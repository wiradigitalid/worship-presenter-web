import type {
  ArtifactLayout,
  CanvasElement,
} from '@/lib/registry/types';

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 540;

export const USER_ELEMENT_PREFIX = 'usr-';

export const NEW_TEXT_CONTENT = 'New text';
export const NEW_SHAPE_FILL = '#5C2E16';
export const NEW_TEXT_SIZE_PX = { w: 400, h: 80 };
export const NEW_SHAPE_SIZE_PX = { w: 300, h: 180 };
export const INSERT_CASCADE_PX = 18;
export const INSERT_CASCADE_STEPS = 8;

export const DEFAULT_FONT_COLOR = '#FFFFFF';
export const DEFAULT_FONT_FAMILY = 'Arial';
export const DEFAULT_TEXT_ALIGN = 'left' as const;
export const DEFAULT_FONT_SIZE = 32;
export const MIN_FONT_SIZE = 8;
export const MAX_FONT_SIZE = 200;

export function pctToPx(value: number, total: number) {
  return (value / 100) * total;
}

export function pxToPct(value: number, total: number) {
  return (value / total) * 100;
}

export const MIN_ELEMENT_W_PCT = pxToPct(1, CANVAS_WIDTH);
export const MIN_ELEMENT_H_PCT = pxToPct(1, CANVAS_HEIGHT);

export function toStrictHexColor(fill: unknown, fallback?: string): string | undefined {
  if (typeof fill !== 'string' || !fill.trim()) return fallback;

  const hexMatch = fill.match(/^#([0-9A-Fa-f]{6})$/);
  if (hexMatch) return `#${hexMatch[1].toUpperCase()}`;

  const rgbMatch = fill.match(
    /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/
  );
  if (rgbMatch) {
    const channels = [rgbMatch[1], rgbMatch[2], rgbMatch[3]].map(Number);
    if (channels.every((n) => n >= 0 && n <= 255)) {
      return `#${channels
        .map((n) => n.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;
    }
  }

  return fallback;
}

export function clampFontSize(value: number) {
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value));
}

export function normalizeFontSize(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_FONT_SIZE;
}

export function isUserAuthoredId(elementId: string) {
  return elementId.startsWith(USER_ELEMENT_PREFIX);
}

export function nextElementId(usedIds: Set<string>, counter: number) {
  let candidate = `${USER_ELEMENT_PREFIX}${Date.now().toString(36)}-${counter.toString(36)}`;
  let salt = 0;
  while (usedIds.has(candidate)) {
    salt += 1;
    candidate = `${USER_ELEMENT_PREFIX}${Date.now().toString(36)}-${counter.toString(36)}-${salt}`;
  }
  return candidate;
}

export function getElementId(obj: { get?: (key: string) => unknown; data?: { elementId?: string } }): string | undefined {
  if (typeof obj.get === 'function') {
    return (obj.get('data') as { elementId?: string } | undefined)?.elementId;
  }
  return obj.data?.elementId;
}

export function isFabricTextObject(
  obj: { type?: string }
): obj is {
  type: string;
  text?: string;
  fill?: unknown;
  fontSize?: unknown;
  fontFamily?: string;
  fontWeight?: unknown;
  fontStyle?: string;
  textAlign?: string;
} {
  return obj.type === 'text';
}

export function serializeTextStyle(
  source: CanvasElement,
  textObj: {
    fill?: unknown;
    fontSize?: unknown;
    fontFamily?: string;
    fontWeight?: unknown;
    fontStyle?: string;
    textAlign?: string;
  }
): CanvasElement['style'] | undefined {
  const style: NonNullable<CanvasElement['style']> = { ...source.style };

  const setIfMeaningful = <K extends keyof NonNullable<CanvasElement['style']>>(
    key: K,
    current: NonNullable<CanvasElement['style']>[K] | undefined,
    constructionDefault: NonNullable<CanvasElement['style']>[K]
  ) => {
    if (current === undefined) return;
    if (source.style?.[key] === undefined && current === constructionDefault) return;
    style[key] = current;
  };

  setIfMeaningful(
    'fontColor',
    toStrictHexColor(textObj.fill, source.style?.fontColor),
    DEFAULT_FONT_COLOR
  );
  setIfMeaningful(
    'fontSize',
    typeof textObj.fontSize === 'number' ? textObj.fontSize : undefined,
    DEFAULT_FONT_SIZE
  );
  setIfMeaningful('fontFamily', textObj.fontFamily, DEFAULT_FONT_FAMILY);
  setIfMeaningful(
    'fontWeight',
    textObj.fontWeight === undefined ? undefined : String(textObj.fontWeight),
    'normal'
  );
  setIfMeaningful('fontStyle', textObj.fontStyle, 'normal');
  setIfMeaningful(
    'textAlign',
    textObj.textAlign === 'left' ||
      textObj.textAlign === 'center' ||
      textObj.textAlign === 'right'
      ? (textObj.textAlign as 'left' | 'center' | 'right')
      : undefined,
    DEFAULT_TEXT_ALIGN
  );

  return Object.keys(style).length > 0 ? style : undefined;
}

export function serializeCanvas(
  canvas: { getObjects: () => Array<any> },
  layout: ArtifactLayout,
  added: Map<string, CanvasElement>
): CanvasElement[] {
  const byId = new Map<string, CanvasElement>([
    ...added,
    ...layout.elements.map((e) => [e.id, e] as const),
  ]);
  // Canvas order is zIndex order; the stored array keeps template order so that
  // `hydrate`'s source-order tie-break — and diffs against the seed — stay put.
  const sourceRank = new Map(layout.elements.map((e, i) => [e.id, i] as const));

  // Determine if canvas stacking order of existing elements has changed relative
  // to the initial painted ordering (sorted by zIndex, tie-broken by template/source order).
  // If not reordered, preserve each element's source zIndex untouched (setIfMeaningful discipline).
  const canvasObjects = canvas.getObjects();
  const existingObjects = canvasObjects
    .map((obj, canvasIndex) => {
      const elementId = getElementId(obj);
      return { elementId, canvasIndex };
    })
    .filter((entry): entry is { elementId: string; canvasIndex: number } =>
      typeof entry.elementId === 'string' && sourceRank.has(entry.elementId)
    );

  const survivingIds = new Set(existingObjects.map((e) => e.elementId));
  const initialOrder = layout.elements
    .filter((element) => survivingIds.has(element.id))
    .map((element, sourceIndex) => ({
      id: element.id,
      zIndex: element.zIndex,
      sourceIndex,
    }))
    .sort((a, b) => a.zIndex - b.zIndex || a.sourceIndex - b.sourceIndex);

  // Check if surviving elements are in their initial relative order on canvas,
  // and check if any added elements have moved relative to the existing elements
  // (e.g. newly added element was moved behind/below existing elements).
  const hasReorderedExisting = existingObjects.some(
    (entry, idx) => entry.elementId !== initialOrder[idx]?.id
  );

  // Check if any added element is positioned before (underneath) any existing element on canvas
  const minExistingIndex = existingObjects.length > 0 ? existingObjects[0].canvasIndex : -1;
  const maxExistingIndex = existingObjects.length > 0 ? existingObjects[existingObjects.length - 1].canvasIndex : -1;
  const hasReorderedAdded = canvasObjects.some((obj, canvasIndex) => {
    const elementId = getElementId(obj);
    if (!elementId || !added.has(elementId)) return false;
    // Added element was created at the top (zIndex = maxZ + 1).
    // If it is located below any existing element in canvas index order, it was explicitly reordered.
    return maxExistingIndex !== -1 && canvasIndex < maxExistingIndex;
  });

  const isOrderModified = hasReorderedExisting || hasReorderedAdded;

  const serialized = canvasObjects.flatMap((obj, canvasIndex) => {
    const elementId = getElementId(obj);
    if (!elementId) return [];
    const source = byId.get(elementId);
    if (!source) return [];

    const left = obj.left ?? 0;
    const top = obj.top ?? 0;
    const scaleX = Math.abs(obj.scaleX ?? 1);
    const scaleY = Math.abs(obj.scaleY ?? 1);
    const isText = source.type === 'text' && isFabricTextObject(obj);

    const authoredLeft = pctToPx(source.x, CANVAS_WIDTH);
    const authoredTop = pctToPx(source.y, CANVAS_HEIGHT);
    const authoredWidth = pctToPx(source.w, CANVAS_WIDTH);
    const authoredHeight = pctToPx(source.h, CANVAS_HEIGHT);
    const measuredWidth = Math.abs(obj.width ?? 0) * scaleX;
    const measuredHeight = Math.abs(obj.height ?? 0) * scaleY;

    const w = isText
      ? source.w * scaleX
      : measuredWidth === authoredWidth
        ? source.w
        : pxToPct(measuredWidth, CANVAS_WIDTH);
    const h = isText
      ? source.h * scaleY
      : measuredHeight === authoredHeight
        ? source.h
        : pxToPct(measuredHeight, CANVAS_HEIGHT);

    const next: CanvasElement = {
      ...source,
      x: left === authoredLeft ? source.x : pxToPct(left, CANVAS_WIDTH),
      y: top === authoredTop ? source.y : pxToPct(top, CANVAS_HEIGHT),
      w: Math.max(w, MIN_ELEMENT_W_PCT),
      h: Math.max(h, MIN_ELEMENT_H_PCT),
      zIndex: isOrderModified ? canvasIndex : source.zIndex,
    };

    if (isText) {
      const text = obj.text ?? '';
      if (source.content !== undefined || text !== '') {
        next.content = text;
      }
      const style = serializeTextStyle(source, obj);
      if (style) {
        next.style = style;
      } else {
        delete next.style;
      }
    }

    const rank =
      sourceRank.get(elementId) ?? layout.elements.length + canvasIndex;
    return [{ rank, next }];
  });

  return serialized
    .map((entry, index) => ({ ...entry, index }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.next);
}
