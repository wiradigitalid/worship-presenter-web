import { toast } from 'sonner';
import {
  ArrowDown,
  ArrowUp,
  Bold,
  BringToFront,
  Copy,
  Italic,
  SendToBack,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ArtifactLayout,
  ArtifactTemplateSummary,
  CanvasElement,
  PlaceholderDefinition,
  StoredArtifactTemplate,
} from '@/lib/registry/types';
import { isCanvasAuthorable, kindChipLabel } from '@/lib/registry/types';
import {
  PLACEHOLDER_CATALOG,
  catalogEntry,
  findUnknownPredefinedFieldTokens,
} from '@/lib/registry/placeholder-catalog';
import {
  beforeUnloadGuard,
  CANVAS_MUTATION_EVENTS,
  DISCARD_ON_SWITCH_CONFIRMATION,
  mayDiscard,
  nextDirtyState,
  UNSAVED_INDICATOR_LABEL,
} from '@/lib/canvas-dirty-guard';
import { useNavigationBlocker } from '@/components/navigation-blocker';
import { useT } from '@/lib/i18n/operator';
import type { I18nKey } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  INSERT_CASCADE_PX,
  INSERT_CASCADE_STEPS,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  NEW_SHAPE_FILL,
  NEW_SHAPE_SIZE_PX,
  NEW_TEXT_CONTENT,
  NEW_TEXT_SIZE_PX,
  clampFontSize,
  getElementId,
  isFabricTextObject,
  isUserAuthoredId,
  nextElementId,
  normalizeFontSize,
  pctToPx,
  pxToPct,
  serializeCanvas,
  serializeTextStyle,
  toStrictHexColor,
} from '@/lib/registry/canvas-utils';

function placeholderLabelKey(key: string): I18nKey {
  return `admin.artifacts.placeholder.${key}` as I18nKey;
}

type FabricModule = typeof import('fabric');

type EditorStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'creating'
  | 'renaming'
  | 'resetting'
  | 'deleting'
  | 'reordering'
  | 'success'
  | 'error'
  | 'conflict';

function elementToFabricObject(
  fabric: FabricModule,
  element: CanvasElement,
  editable: boolean
) {
  const left = pctToPx(element.x, CANVAS_WIDTH);
  const top = pctToPx(element.y, CANVAS_HEIGHT);
  const width = pctToPx(element.w, CANVAS_WIDTH);
  const height = pctToPx(element.h, CANVAS_HEIGHT);
  const common = {
    left,
    top,
    width,
    height,
    selectable: editable,
    evented: editable,
    hasControls: editable,
    lockRotation: true,
    data: { elementId: element.id },
  };

  if (element.type === 'text') {
    const style = element.style;
    return new fabric.FabricText(element.content ?? '', {
      ...common,
      fill: style?.fontColor ?? DEFAULT_FONT_COLOR,
      fontSize: normalizeFontSize(style?.fontSize),
      fontFamily: style?.fontFamily ?? DEFAULT_FONT_FAMILY,
      // Fabric v6 assigns an explicit `undefined` straight over its own class
      // default and then dies in `Cache.getFontCache` (`fontStyle.toLowerCase`
      // of undefined), so an unset key must be omitted, not passed as
      // undefined. Every shipped text element omits fontStyle.
      ...(style?.fontWeight !== undefined ? { fontWeight: style.fontWeight } : {}),
      ...(style?.fontStyle !== undefined ? { fontStyle: style.fontStyle } : {}),
      textAlign: style?.textAlign ?? DEFAULT_TEXT_ALIGN,
    });
  }

  if (element.type === 'shape') {
    return new fabric.Rect({
      ...common,
      fill: element.style?.fillColor ?? '#5C2E16',
      opacity: element.style?.opacity ?? 1,
    });
  }

  if (element.type === 'image' && element.imageRef) {
    return new fabric.Rect({
      ...common,
      fill: '#333333',
      stroke: '#888888',
      strokeWidth: 1,
      data: { elementId: element.id, imageRef: element.imageRef },
    });
  }

  return new fabric.Rect({
    ...common,
    fill: 'rgba(255,255,255,0.08)',
    stroke: '#cccccc',
    strokeDashArray: [6, 4],
    data: { elementId: element.id, placeholderKey: element.placeholderKey },
  });
}

import {
  ArtifactEditorAdapter,
  CopiedSlide,
  mainSpineAdapter,
  uploadImageFile,
} from '@/lib/registry/canvas-adapters';

export {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_FONT_COLOR,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_SIZE,
  DEFAULT_TEXT_ALIGN,
  elementToFabricObject,
  serializeCanvas,
  serializeTextStyle,
};

export interface ArtifactEditorProps {
  adapter?: ArtifactEditorAdapter;
  initialSelectedId?: string | null;
  copiedSlidePayload?: CopiedSlide | null;
  onCopySlidePayloadChange?: (slide: CopiedSlide | null) => void;
  hideList?: boolean;
  allowImages?: boolean;
  bannerNote?: React.ReactNode;
}

export default function ArtifactEditor({
  adapter = mainSpineAdapter,
  initialSelectedId = null,
  copiedSlidePayload: externalCopiedSlidePayload,
  onCopySlidePayloadChange,
  hideList = false,
  allowImages = true,
  bannerNote = null,
}: ArtifactEditorProps = {}) {
  const { t } = useT();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasShellRef = useRef<HTMLDivElement | null>(null);
  const fabricCanvasRef = useRef<import('fabric').Canvas | null>(null);
  const [templates, setTemplates] = useState<ArtifactTemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId);
  const [template, setTemplate] = useState<StoredArtifactTemplate | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [status, setStatus] = useState<EditorStatus>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [fontColor, setFontColor] = useState(DEFAULT_FONT_COLOR);
  /** Committed font size: always finite and positive, safe for the server. */
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  /** Raw input text, so the admin can clear the field without writing a 0. */
  const [fontSizeInput, setFontSizeInput] = useState(String(DEFAULT_FONT_SIZE));
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedTextCount, setSelectedTextCount] = useState(0);
  const [textContent, setTextContent] = useState('');
  /** Elements authored in this session, not yet persisted. */
  const addedElementsRef = useRef<Map<string, CanvasElement>>(new Map());
  const addedPlaceholdersRef = useRef<Map<string, PlaceholderDefinition>>(
    new Map()
  );
  const insertCounterRef = useRef(0);

  const fitCanvasToShell = useCallback(() => {
    const shell = canvasShellRef.current;
    const canvas = fabricCanvasRef.current;
    if (!shell || !canvas) return;
    const width = shell.clientWidth;
    const height = shell.clientHeight;
    if (width <= 0 || height <= 0) return;
    const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
    // One scaling mechanism only: keep the logical canvas at 960×540 and let
    // Fabric's zoom scale the paint. Resize the wrapper element (the
    // `.canvas-container` Fabric auto-generates) so the visible stage fills
    // the shell — `cssOnly` setDimensions doubly scales content and leaves
    // the wrapper at 960×540, which is what produced the tiny-corner preview.
    canvas.setZoom(scale);
    const wrapper = canvas.wrapperEl;
    if (wrapper) {
      wrapper.style.width = `${CANVAS_WIDTH * scale}px`;
      wrapper.style.height = `${CANVAS_HEIGHT * scale}px`;
    }
    canvas.calcOffset();
    canvas.requestRenderAll();
  }, []);
  const [insertPlaceholderKey, setInsertPlaceholderKey] = useState(
    PLACEHOLDER_CATALOG[0]?.key ?? 'date'
  );
  /**
   * Whether the mounted canvas carries authoring the server has not seen.
   *
   * In memory and nowhere else, per `AD-24`, which names this story as its live
   * instance: a layout parked in `localStorage` would escape the whole registry
   * write contract. This is a warning mechanism, not a recovery one.
   */
  const [isDirty, setIsDirty] = useState(false);
  const { setIsBlocked } = useNavigationBlocker();

  const markDirty = useCallback(() => {
    setIsDirty((current) => nextDirtyState(current, 'mutated'));
  }, []);

  /** Mirrors Fabric's active selection into React (uncontrolled canvas stays the source). */
  const syncSelection = useCallback((canvas: import('fabric').Canvas) => {
    const active = canvas.getActiveObjects();
    setSelectedElementIds(
      active
        .map(getElementId)
        .filter((id): id is string => typeof id === 'string' && id.length > 0)
    );
    const texts = active.filter(isFabricTextObject);
    setSelectedTextCount(texts.length);
    // The content field edits one box at a time; anything else clears it.
    setTextContent(texts.length === 1 ? (texts[0].text ?? '') : '');
    const selectedText = texts[0];
    if (!selectedText) return;
    setFontColor(
      toStrictHexColor(selectedText.fill, DEFAULT_FONT_COLOR) ?? DEFAULT_FONT_COLOR
    );
    const size = normalizeFontSize(selectedText.fontSize);
    setFontSize(size);
    setFontSizeInput(String(size));
    setFontWeight(selectedText.fontWeight === 'bold' ? 'bold' : 'normal');
    setFontStyle(selectedText.fontStyle === 'italic' ? 'italic' : 'normal');
  }, []);

  const loadList = useCallback(async () => {
    const summaries = await adapter.list();
    setTemplates(summaries);
    return summaries;
  }, [adapter]);

  const loadTemplate = useCallback(async (id: string) => {
    setStatus('loading');
    setMessage(null);
    const data = await adapter.getOne(id);
    setTemplate(data);
    setDraftLabel(typeof data.label === 'string' ? data.label : '');
    // A new server copy remounts the canvas, and a freshly mounted canvas is
    // never dirty. This is the one place every remount comes through — the
    // first load, a template switch, and the reload behind a 409 — so it clears
    // here rather than in the mount effect. It is also the more accurate spot:
    // a *failed* load leaves the previous canvas mounted with its unsaved work
    // still on it, and that flag must survive.
    setIsDirty((current) => nextDirtyState(current, 'template-changed'));
    setStatus('idle');
  }, [adapter]);

  useEffect(() => {
    loadList().catch((err) => {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.loadFailed'));
    });
  }, [loadList]);

  useEffect(() => {
    if (initialSelectedId && selectedId !== initialSelectedId) {
      setSelectedId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    if (!selectedId) return;
    loadTemplate(selectedId).catch((err) => {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.loadOneFailed'));
    });
  }, [selectedId, loadTemplate]);

  useEffect(() => {
    let disposed = false;
    let removeCanvasListeners: (() => void) | undefined;

    async function mountCanvas() {
      if (!canvasRef.current || !template) return;
      // A fresh canvas means a fresh authoring session: anything added before is
      // either persisted (and back in layout.elements) or discarded.
      addedElementsRef.current = new Map();
      addedPlaceholdersRef.current = new Map();
      const layout = getEditableLayout(template);
      if (!layout) {
        fabricCanvasRef.current?.dispose();
        fabricCanvasRef.current = null;
        return;
      }

      const fabric = await import('fabric');
      if (disposed) return;

      fabricCanvasRef.current?.dispose();
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        selection: true,
        backgroundColor: layout.backgroundColor,
      });
      fabricCanvasRef.current = canvas;

      const disposeCanvasIfAborted = () => {
        if (!disposed) return false;
        removeCanvasListeners?.();
        removeCanvasListeners = undefined;
        if (fabricCanvasRef.current === canvas) {
          canvas.dispose();
          fabricCanvasRef.current = null;
        }
        return true;
      };

      if (layout.backgroundImage) {
        const bg = await fabric.FabricImage.fromURL(layout.backgroundImage, {
          crossOrigin: 'anonymous',
        });
        if (disposeCanvasIfAborted()) return;

        bg.set({
          left: 0,
          top: 0,
          scaleX: CANVAS_WIDTH / (bg.width || CANVAS_WIDTH),
          scaleY: CANVAS_HEIGHT / (bg.height || CANVAS_HEIGHT),
          selectable: false,
          evented: false,
        });
        canvas.backgroundImage = bg;
      }

      if (disposeCanvasIfAborted()) return;

      // The PPTX exporter and the web slideshow both paint in `zIndex` order,
      // so the canvas must stack the same way or the admin edits an overlap
      // that does not match the real output. Source order breaks ties.
      const painted = layout.elements
        .map((element, index) => ({ element, index }))
        .sort((a, b) => a.element.zIndex - b.element.zIndex || a.index - b.index);
      for (const { element } of painted) {
        canvas.add(elementToFabricObject(fabric, element, true));
      }

      const onSelectionChange = () => {
        syncSelection(canvas);
      };
      canvas.on('selection:created', onSelectionChange);
      canvas.on('selection:updated', onSelectionChange);
      canvas.on('selection:cleared', onSelectionChange);
      // Registered here and not one line earlier: the paint loop above calls
      // `canvas.add()` for every seed element, and `canvas.add()` fires
      // `object:added`. Attached any sooner, a fresh mount would mark itself
      // dirty and the guard would fire on a canvas nobody has touched.
      for (const event of CANVAS_MUTATION_EVENTS) {
        canvas.on(event, markDirty);
      }
      removeCanvasListeners = () => {
        canvas.off('selection:created', onSelectionChange);
        canvas.off('selection:updated', onSelectionChange);
        canvas.off('selection:cleared', onSelectionChange);
        for (const event of CANVAS_MUTATION_EVENTS) {
          canvas.off(event, markDirty);
        }
      };

      if (disposeCanvasIfAborted()) return;

      canvas.requestRenderAll();
      fitCanvasToShell();
      // `aspect-video` may not have a computed height on the first frame, so
      // retry once on the next tick. Without this, the shell stays at
      // height=0 → scale=0 and the canvas collapses to a thread of pixels.
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => fitCanvasToShell());
      }
    }

    mountCanvas().catch((err) => {
      if (disposed) return;
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.canvasFailed'));
    });

    return () => {
      disposed = true;
      // Before `dispose()`, which is the existing order and now load-bearing
      // twice over: a mutation listener still attached while the canvas tears
      // itself down would mark the outgoing template dirty on its way out.
      removeCanvasListeners?.();
      removeCanvasListeners = undefined;
      fabricCanvasRef.current?.dispose();
      fabricCanvasRef.current = null;
    };
  }, [template, syncSelection, markDirty, fitCanvasToShell]);

  const insertElement = useCallback(
    async (kind: 'text' | 'shape') => {
      const canvas = fabricCanvasRef.current;
      const layout = template ? getEditableLayout(template) : null;
      if (!canvas || !layout) return;

      const usedIds = new Set<string>([
        ...layout.elements.map((e) => e.id),
        ...addedElementsRef.current.keys(),
        ...canvas
          .getObjects()
          .map(getElementId)
          .filter((id): id is string => typeof id === 'string'),
      ]);
      const id = nextElementId(usedIds, insertCounterRef.current);
      const step = insertCounterRef.current % INSERT_CASCADE_STEPS;
      insertCounterRef.current += 1;

      const size = kind === 'text' ? NEW_TEXT_SIZE_PX : NEW_SHAPE_SIZE_PX;
      const offset = step * INSERT_CASCADE_PX;
      const leftPx = (CANVAS_WIDTH - size.w) / 2 + offset;
      const topPx = (CANVAS_HEIGHT - size.h) / 2 + offset;
      const maxZ = [
        ...layout.elements,
        ...addedElementsRef.current.values(),
      ].reduce((acc, e) => Math.max(acc, e.zIndex), -1);

      const element: CanvasElement = {
        id,
        type: kind,
        required: false,
        x: pxToPct(leftPx, CANVAS_WIDTH),
        y: pxToPct(topPx, CANVAS_HEIGHT),
        w: pxToPct(size.w, CANVAS_WIDTH),
        h: pxToPct(size.h, CANVAS_HEIGHT),
        zIndex: maxZ + 1,
        ...(kind === 'text'
          ? {
              content: NEW_TEXT_CONTENT,
              style: {
                fontFamily: 'Arial',
                fontSize,
                fontColor,
                fontWeight: 'normal',
                textAlign: 'left' as const,
              },
            }
          : { style: { fillColor: NEW_SHAPE_FILL, opacity: 1 } }),
      };

      const fabric = await import('fabric');
      if (fabricCanvasRef.current !== canvas) return;

      addedElementsRef.current.set(id, element);
      const obj = elementToFabricObject(fabric, element, true);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncSelection(canvas);
      // Redundant on paper — `canvas.add` above fires `object:added`, which the
      // mutation listener already turns into this same call — and kept on
      // purpose. `markDirty` is idempotent, and the four explicit-edit handlers
      // are required to raise the flag themselves rather than inherit it from a
      // listener registered elsewhere in the file: two of the four
      // (`applyTextStyle`, `handleTextContentChange`) raise no Fabric event at
      // all, so the set only reads consistently if all four are explicit. Not
      // dead code; deleting it makes this handler depend on a registration two
      // hundred lines away.
      markDirty();
      setStatus('idle');
      setMessage(null);
    },
    [template, fontColor, fontSize, syncSelection, markDirty]
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const insertImage = useCallback(
    async (file: File) => {
      const canvas = fabricCanvasRef.current;
      const layout = template ? getEditableLayout(template) : null;
      if (!canvas || !layout) return;

      setStatus('saving');
      setMessage(null);
      let url = '';
      try {
        const uploaded = await uploadImageFile(file);
        url = uploaded.url;
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : t('admin.artifacts.uploadImageFailed'));
        toast(err instanceof Error ? err.message : t('admin.artifacts.uploadImageFailed'));
        return;
      }

      const usedIds = new Set<string>([
        ...layout.elements.map((e) => e.id),
        ...addedElementsRef.current.keys(),
        ...canvas
          .getObjects()
          .map(getElementId)
          .filter((id): id is string => typeof id === 'string'),
      ]);
      const id = nextElementId(usedIds, insertCounterRef.current);
      const step = insertCounterRef.current % INSERT_CASCADE_STEPS;
      insertCounterRef.current += 1;

      const size = NEW_SHAPE_SIZE_PX;
      const offset = step * INSERT_CASCADE_PX;
      const leftPx = (CANVAS_WIDTH - size.w) / 2 + offset;
      const topPx = (CANVAS_HEIGHT - size.h) / 2 + offset;
      const maxZ = [
        ...layout.elements,
        ...addedElementsRef.current.values(),
      ].reduce((acc, e) => Math.max(acc, e.zIndex), -1);

      const element: CanvasElement = {
        id,
        type: 'image',
        required: false,
        x: pxToPct(leftPx, CANVAS_WIDTH),
        y: pxToPct(topPx, CANVAS_HEIGHT),
        w: pxToPct(size.w, CANVAS_WIDTH),
        h: pxToPct(size.h, CANVAS_HEIGHT),
        zIndex: maxZ + 1,
        imageRef: url,
      };

      const fabric = await import('fabric');
      if (fabricCanvasRef.current !== canvas) {
        setStatus('idle');
        return;
      }

      addedElementsRef.current.set(id, element);
      const obj = elementToFabricObject(fabric, element, true);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncSelection(canvas);
      markDirty();
      setStatus('idle');
      setMessage(null);
    },
    [template, syncSelection, markDirty, t]
  );

  const handleReorderLayer = useCallback(
    (action: 'forward' | 'backward' | 'front' | 'back') => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const active = canvas.getActiveObjects();
      if (active.length === 0) return;

      let changed = false;
      for (const obj of active) {
        if (action === 'forward') {
          if (canvas.bringObjectForward(obj)) changed = true;
        } else if (action === 'backward') {
          if (canvas.sendObjectBackwards(obj)) changed = true;
        } else if (action === 'front') {
          if (canvas.bringObjectToFront(obj)) changed = true;
        } else if (action === 'back') {
          if (canvas.sendObjectToBack(obj)) changed = true;
        }
      }

      if (changed) {
        canvas.requestRenderAll();
        syncSelection(canvas);
        markDirty();
      }
    },
    [syncSelection, markDirty]
  );

  const insertPlaceholder = useCallback(
    async (key: string) => {
      const canvas = fabricCanvasRef.current;
      const layout = template ? getEditableLayout(template) : null;
      const entry = catalogEntry(key);
      if (!template || !canvas || !layout || !entry) return;

      const alreadyDeclared =
        template.placeholders.some((placeholder) => placeholder.key === key) ||
        addedPlaceholdersRef.current.has(key);
      if (!alreadyDeclared) {
        addedPlaceholdersRef.current.set(key, {
          key: entry.key,
          type: entry.type,
          required: false,
        });
      }

      const usedIds = new Set<string>([
        ...layout.elements.map((element) => element.id),
        ...addedElementsRef.current.keys(),
        ...canvas
          .getObjects()
          .map(getElementId)
          .filter((id): id is string => typeof id === 'string'),
      ]);
      const id = nextElementId(usedIds, insertCounterRef.current);
      const step = insertCounterRef.current % INSERT_CASCADE_STEPS;
      insertCounterRef.current += 1;

      const size =
        entry.type === 'image' ? NEW_SHAPE_SIZE_PX : NEW_TEXT_SIZE_PX;
      const offset = step * INSERT_CASCADE_PX;
      const leftPx = (CANVAS_WIDTH - size.w) / 2 + offset;
      const topPx = (CANVAS_HEIGHT - size.h) / 2 + offset;
      const maxZ = [
        ...layout.elements,
        ...addedElementsRef.current.values(),
      ].reduce((acc, element) => Math.max(acc, element.zIndex), -1);

      const element: CanvasElement = {
        id,
        type: entry.type === 'image' ? 'image-placeholder' : 'text',
        required: false,
        x: pxToPct(leftPx, CANVAS_WIDTH),
        y: pxToPct(topPx, CANVAS_HEIGHT),
        w: pxToPct(size.w, CANVAS_WIDTH),
        h: pxToPct(size.h, CANVAS_HEIGHT),
        zIndex: maxZ + 1,
        ...(entry.type === 'image'
          ? { placeholderKey: entry.key }
          : {
              content: `{${entry.key}}`,
              style: {
                fontFamily: 'Arial',
                fontSize,
                fontColor,
                fontWeight: 'normal',
                textAlign: 'left' as const,
              },
            }),
      };

      const fabric = await import('fabric');
      if (fabricCanvasRef.current !== canvas) return;

      addedElementsRef.current.set(id, element);
      const obj = elementToFabricObject(fabric, element, true);
      canvas.add(obj);
      canvas.setActiveObject(obj);
      canvas.requestRenderAll();
      syncSelection(canvas);
      markDirty();
      setStatus('idle');
      setMessage(null);
    },
    [template, fontColor, fontSize, syncSelection, markDirty]
  );

  const handleDeleteSelected = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    const layout = template ? getEditableLayout(template) : null;
    if (!canvas || !layout) return;

    const byId = new Map<string, CanvasElement>([
      ...addedElementsRef.current,
      ...layout.elements.map((e) => [e.id, e] as const),
    ]);
    const active = canvas.getActiveObjects();
    if (active.length === 0) {
      setStatus('error');
      setMessage(t('admin.artifacts.selectElementFirst'));
      return;
    }

    const removable: import('fabric').FabricObject[] = [];
    const refused: string[] = [];
    for (const obj of active) {
      const elementId = getElementId(obj);
      if (!elementId) continue;
      const source = byId.get(elementId);
      if (!isUserAuthoredId(elementId) || source?.required) {
        refused.push(elementId);
        continue;
      }
      removable.push(obj);
    }

    if (removable.length > 0) {
      canvas.discardActiveObject();
      canvas.remove(...removable);
      for (const obj of removable) {
        const elementId = getElementId(obj);
        if (elementId) addedElementsRef.current.delete(elementId);
      }
      canvas.requestRenderAll();
      syncSelection(canvas);
      // Same reason as `insertElement`: `canvas.remove` already fires
      // `object:removed`, and this stays anyway so all four explicit-edit
      // handlers raise the flag the same way.
      markDirty();
    }

    if (refused.length > 0) {
      setStatus('error');
      setMessage(
        `Cannot delete ${refused.join(', ')} — shipped and required elements are part of the template.`
      );
      return;
    }
    setStatus('idle');
    setMessage(
      `Removed ${removable.length} element${removable.length === 1 ? '' : 's'}. Save to persist.`
    );
  }, [template, syncSelection, markDirty, t]);

  const handleDuplicateSelected = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    const layout = template ? getEditableLayout(template) : null;
    if (!canvas || !layout) return;

    const byId = new Map<string, CanvasElement>([
      ...addedElementsRef.current,
      ...layout.elements.map((e) => [e.id, e] as const),
    ]);
    const active = canvas.getActiveObjects();
    if (active.length === 0) {
      setStatus('error');
      setMessage(t('admin.artifacts.selectElementFirst'));
      return;
    }

    const fabric = await import('fabric');
    if (fabricCanvasRef.current !== canvas) return;

    const usedIds = new Set<string>([
      ...layout.elements.map((e) => e.id),
      ...addedElementsRef.current.keys(),
      ...canvas
        .getObjects()
        .map(getElementId)
        .filter((id): id is string => typeof id === 'string'),
    ]);

    let maxZ = [
      ...layout.elements,
      ...addedElementsRef.current.values(),
    ].reduce((acc, element) => Math.max(acc, element.zIndex), -1);

    const newObjects: import('fabric').FabricObject[] = [];

    for (const obj of active) {
      const elementId = getElementId(obj);
      if (!elementId) continue;
      const source = byId.get(elementId);
      if (!source) continue;

      const id = nextElementId(usedIds, insertCounterRef.current);
      usedIds.add(id);
      insertCounterRef.current += 1;
      maxZ += 1;

      // Duplicate element: full copy of style/text/shape/geometry/tokens,
      // image element copies its URL string by reference (shared ref).
      const clonedElement: CanvasElement = {
        ...source,
        id,
        required: false,
        x: Math.min(90, source.x + pxToPct(INSERT_CASCADE_PX, CANVAS_WIDTH)),
        y: Math.min(90, source.y + pxToPct(INSERT_CASCADE_PX, CANVAS_HEIGHT)),
        zIndex: maxZ,
        style: source.style ? { ...source.style } : undefined,
      };

      if (source.type === 'text' && isFabricTextObject(obj)) {
        clonedElement.content = obj.text ?? source.content;
      }

      addedElementsRef.current.set(id, clonedElement);
      const fabricObj = elementToFabricObject(fabric, clonedElement, true);
      canvas.add(fabricObj);
      newObjects.push(fabricObj);
    }

    if (newObjects.length > 0) {
      canvas.discardActiveObject();
      if (newObjects.length === 1) {
        canvas.setActiveObject(newObjects[0]);
      } else {
        const sel = new fabric.ActiveSelection(newObjects, { canvas });
        canvas.setActiveObject(sel);
      }
      canvas.requestRenderAll();
      syncSelection(canvas);
      markDirty();
      setStatus('idle');
      setMessage(null);
    }
  }, [template, syncSelection, markDirty, t]);

  const applyTextStyle = () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    let updated = false;
    for (const obj of canvas.getActiveObjects()) {
      if (!isFabricTextObject(obj)) continue;
      obj.set({ fill: fontColor, fontSize });
      updated = true;
    }
    // `obj.set(...)` raises no canvas event, so the mutation listeners never see
    // this; and pressing Apply with nothing selected changed nothing, so it must
    // not claim otherwise.
    if (updated) {
      canvas.requestRenderAll();
      markDirty();
    }
  };

  const handleToggleBold = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const texts = canvas.getActiveObjects().filter(isFabricTextObject);
    if (texts.length === 0) return;
    const nextWeight: 'normal' | 'bold' = fontWeight === 'bold' ? 'normal' : 'bold';
    setFontWeight(nextWeight);
    for (const obj of texts) {
      obj.set({ fontWeight: nextWeight });
    }
    canvas.requestRenderAll();
    markDirty();
  }, [fontWeight, markDirty]);

  const handleToggleItalic = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const texts = canvas.getActiveObjects().filter(isFabricTextObject);
    if (texts.length === 0) return;
    const nextStyle: 'normal' | 'italic' = fontStyle === 'italic' ? 'normal' : 'italic';
    setFontStyle(nextStyle);
    for (const obj of texts) {
      obj.set({ fontStyle: nextStyle });
    }
    canvas.requestRenderAll();
    markDirty();
  }, [fontStyle, markDirty]);

  /**
   * Writes the words of the selected text box straight through to Fabric, so
   * the next Save picks them up. Deliberately limited to a single selected text
   * element: applying one string to a multi-selection would wipe the others.
   */
  const handleTextContentChange = (value: string) => {
    setTextContent(value);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const texts = canvas.getActiveObjects().filter(isFabricTextObject);
    if (texts.length !== 1) return;
    texts[0].set({ text: value });
    canvas.requestRenderAll();
    // Same reason as `applyTextStyle`: a direct `set` is invisible to Fabric's
    // canvas-level events.
    markDirty();
  };

  const handleFontSizeInput = (raw: string) => {
    setFontSizeInput(raw);
    const parsed = Number(raw);
    // An empty field is `Number('') === 0`; never commit that — the server
    // rejects the entire save with an opaque `style.fontSize must be positive`.
    if (!raw.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    setFontSize(clampFontSize(parsed));
  };

  const [internalCopiedSlidePayload, setInternalCopiedSlidePayload] = useState<CopiedSlide | null>(null);

  const activeCopiedSlidePayload =
    externalCopiedSlidePayload !== undefined
      ? externalCopiedSlidePayload
      : internalCopiedSlidePayload;

  const setCopiedSlide = (val: CopiedSlide | null) => {
    if (onCopySlidePayloadChange) {
      onCopySlidePayloadChange(val);
    }
    setInternalCopiedSlidePayload(val);
  };

  const handleCopySlide = async (item: ArtifactTemplateSummary) => {
    try {
      const data = await adapter.getOne(item.id);
      const { updatedAt, id, ...body } = data;
      setCopiedSlide({
        label: `${item.label} (Copy)`,
        payload: body,
      });
      toast(t('admin.artifacts.copiedSlide'));
    } catch (err) {
      toast(err instanceof Error ? err.message : t('admin.artifacts.loadOneFailed'));
    }
  };

  const handlePasteSlide = async () => {
    if (!activeCopiedSlidePayload) return;
    const proceed = mayDiscard(
      isDirty && isEditable,
      DISCARD_ON_SWITCH_CONFIRMATION,
      (message) => window.confirm(message)
    );
    if (!proceed) return;

    setStatus('creating');
    setMessage(null);
    try {
      // 1. Create new authored slide
      const data = await adapter.create(activeCopiedSlidePayload.label);

      // 2. Put copied layout/payload into the new slide (shares image references as-is)
      const saveRes = await adapter.save(data.id, {
        ...activeCopiedSlidePayload.payload,
        id: data.id,
        label: activeCopiedSlidePayload.label,
        baseType: 'general',
        updatedAt: data.updatedAt,
      });
      if (!saveRes.ok) throw new Error(saveRes.error || t('admin.artifacts.saveFailed'));

      await loadList();
      setSelectedId(data.id);
      setStatus('success');
      toast(t('admin.artifacts.created').replace('{label}', activeCopiedSlidePayload.label));
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.addFailed'));
    }
  };

  const handleCreate = async () => {
    const label = newLabel.trim();
    if (!label) return;
    const proceed = mayDiscard(
      isDirty && isEditable,
      DISCARD_ON_SWITCH_CONFIRMATION,
      (message) => window.confirm(message)
    );
    if (!proceed) return;

    setStatus('creating');
    setMessage(null);
    try {
      const data = await adapter.create(label);
      setNewLabel('');
      await loadList();
      setSelectedId(data.id);
      setStatus('success');
      setMessage(
        t('admin.artifacts.created').replace('{label}', data.label || label)
      );
      toast(t('admin.artifacts.created').replace('{label}', data.label || label));
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.addFailed'));
    }
  };

  const handleRename = async () => {
    if (!template) return;
    const label = draftLabel.trim();
    if (!label) return;

    setStatus('renaming');
    setMessage(null);
    try {
      const res = await adapter.rename(template.id, label, template.updatedAt);
      if (res.status === 409) {
        await loadTemplate(template.id);
        setStatus('conflict');
        setMessage(res.error || t('admin.artifacts.modifiedElsewhere'));
        return;
      }
      if (!res.ok || !res.data) throw new Error(res.error || t('admin.artifacts.renameFailed'));
      const data = res.data;
      setTemplate(data);
      if (typeof data.label === 'string') setDraftLabel(data.label);
      setStatus('success');
      setMessage(t('admin.artifacts.renamed'));
      toast(t('admin.artifacts.renamed'));
      await loadList();
    } catch (err) {
      setStatus('error');
      setMessage(
        err instanceof Error ? err.message : t('admin.artifacts.renameFailed')
      );
    }
  };

  const handleSave = async () => {
    if (!template) return;
    const layout = getEditableLayout(template);
    const canvas = fabricCanvasRef.current;
    if (!layout || !canvas) return;

    setStatus('saving');
    setMessage(null);
    try {
      // Fabric reports group-relative left/top while an ActiveSelection is
      // live; discard it first so serialization always reads canvas coords.
      canvas.discardActiveObject();
      // The selection is gone, so the toolbar must not keep offering actions
      // (Delete, content edit) against an object that is no longer active.
      syncSelection(canvas);
      // The canvas is authoritative for the element set: additions appear here
      // and deletions are simply absent. Server-side stability rules still
      // reject removal of any seeded or required element.
      const updatedElements = serializeCanvas(
        canvas,
        layout,
        addedElementsRef.current
      );
      const { updatedAt, ...templateBody } = template;
      const extraPlaceholders = [...addedPlaceholdersRef.current.values()].filter(
        (placeholder) =>
          !template.placeholders.some((existing) => existing.key === placeholder.key)
      );
      const payload = {
        ...templateBody,
        label: draftLabel.trim() || template.label,
        placeholders: [...template.placeholders, ...extraPlaceholders],
        layouts: {
          ...templateBody.layouts,
          default: {
            ...layout,
            elements: updatedElements,
          },
        },
        updatedAt,
      };

      const res = await adapter.save(template.id, payload);
      if (res.status === 409) {
        // Reload first: `loadTemplate` clears the banner, so the explanation
        // has to be written after it or the admin sees nothing at all.
        await loadTemplate(template.id);
        setStatus('conflict');
        // Reloading remounts the canvas from the server copy, which throws away
        // every element added or deleted since the last successful save. Say so
        // plainly instead of leaving the admin to discover it.
        setMessage(
          t('admin.artifacts.conflictSaved').replace(
            '{error}',
            res.error || t('admin.artifacts.modifiedElsewhere')
          )
        );
        return;
      }
      if (!res.ok || !res.data) throw new Error(res.error || t('admin.artifacts.saveFailed'));
      const data = res.data;
      setTemplate(data);
      if (typeof data.label === 'string') setDraftLabel(data.label);
      setIsDirty((current) => nextDirtyState(current, 'saved'));
      setStatus('success');
      const unknownWarnings = findUnknownPredefinedFieldTokens(payload);
      if (unknownWarnings.length > 0) {
        const warningMsg = `${t('admin.artifacts.saved')} (${unknownWarnings.join(', ')})`;
        setMessage(warningMsg);
        toast(warningMsg);
      } else {
        setMessage(t('admin.artifacts.saved'));
        toast(t('admin.artifacts.saved'));
      }
      await loadList();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.saveFailed'));
    }
  };

  const handleReset = async () => {
    if (!template) return;
    if (
      !window.confirm(
        t('admin.artifacts.confirmReset').replace('{label}', template.label)
      )
    )
      return;

    setStatus('resetting');
    setMessage(null);
    try {
      const res = await adapter.reset(template.id, template.updatedAt);
      if (res.status === 409) {
        await loadTemplate(template.id);
        setStatus('conflict');
        setMessage(
          t('admin.artifacts.resetConflict').replace(
            '{error}',
            res.error || t('admin.artifacts.modifiedElsewhere')
          )
        );
        return;
      }
      if (!res.ok || !res.data) throw new Error(res.error || t('admin.artifacts.resetFailed'));
      const data = res.data;
      setTemplate(data);
      if (typeof data.label === 'string') setDraftLabel(data.label);
      setIsDirty((current) => nextDirtyState(current, 'reset'));
      setStatus('success');
      setMessage(t('admin.artifacts.resetDone'));
      toast(t('admin.artifacts.resetDone'));
      await loadList();
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.resetFailed'));
    }
  };

  const reconcileSelectedTemplate = async (
    summaries: ArtifactTemplateSummary[]
  ) => {
    if (!selectedId) return;
    const summary = summaries.find((item) => item.id === selectedId);
    if (!summary) {
      setSelectedId(null);
      setTemplate(null);
      setIsDirty((current) => nextDirtyState(current, 'template-changed'));
      return;
    }
    // A delete/reorder refreshes every remaining row's concurrency token. Keep
    // an unsaved canvas mounted, but advance its token from the authoritative
    // summary so its next Save is not needlessly rejected as stale.
    if (isDirty) {
      setTemplate((current) =>
        current?.id === summary.id ? { ...current, updatedAt: summary.updatedAt } : current
      );
      return;
    }
    await loadTemplate(selectedId);
  };

  const handleDeleteTemplate = async (item: ArtifactTemplateSummary) => {
    const deletingSelected = item.id === selectedId;
    const warning =
      deletingSelected && isDirty && isEditable
        ? t('admin.artifacts.confirmDeleteDirty').replace('{label}', item.label)
        : t('admin.artifacts.confirmDelete').replace('{label}', item.label);
    if (!window.confirm(warning)) return;

    setStatus('deleting');
    setMessage(null);
    try {
      const res = await adapter.delete(item.id, item.updatedAt);
      if (res.status === 409) {
        const summaries = await loadList();
        await reconcileSelectedTemplate(summaries);
        setStatus('conflict');
        setMessage(
          t('admin.artifacts.deleteConflict').replace(
            '{error}',
            res.error || t('admin.artifacts.modifiedElsewhere')
          )
        );
        return;
      }
      if (res.status === 404) {
        const summaries = await loadList();
        await reconcileSelectedTemplate(summaries);
        setStatus('conflict');
        setMessage(
          t('admin.artifacts.deleteMissing').replace(
            '{error}',
            res.error || t('admin.artifacts.loadOneFailed')
          )
        );
        return;
      }
      if (!res.ok) throw new Error(res.error || t('admin.artifacts.deleteFailed'));
      const summaries = res.templates ?? (await loadList());
      setTemplates(summaries);
      if (deletingSelected) {
        setSelectedId(null);
        setTemplate(null);
        setIsDirty((current) => nextDirtyState(current, 'template-changed'));
      } else {
        await reconcileSelectedTemplate(summaries);
      }
      setStatus('success');
      setMessage(t('admin.artifacts.deleted').replace('{label}', item.label));
      toast(t('admin.artifacts.deleted').replace('{label}', item.label));
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.deleteFailed'));
    }
  };

  const handleMoveTemplate = async (item: ArtifactTemplateSummary, direction: -1 | 1) => {
    const index = templates.findIndex((candidate) => candidate.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= templates.length) return;

    const desired = [...templates];
    [desired[index], desired[target]] = [desired[target], desired[index]];
    setStatus('reordering');
    setMessage(null);
    try {
      const res = await adapter.reorder(
        desired.map(({ id, updatedAt }) => ({ id, updatedAt }))
      );
      if (res.status === 409 || res.status === 400) {
        const summaries = await loadList();
        await reconcileSelectedTemplate(summaries);
        setStatus('conflict');
        setMessage(
          t('admin.artifacts.reorderConflict').replace(
            '{error}',
            res.error || t('admin.artifacts.modifiedElsewhere')
          )
        );
        return;
      }
      if (!res.ok) throw new Error(res.error || t('admin.artifacts.reorderFailed'));
      const summaries = res.templates ?? (await loadList());
      setTemplates(summaries);
      await reconcileSelectedTemplate(summaries);
      setStatus('success');
      setMessage(t('admin.artifacts.reorderSaved'));
      toast(t('admin.artifacts.reorderSaved'));
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : t('admin.artifacts.reorderFailed'));
    }
  };

  const isEditable = template ? isCanvasAuthorable(template.baseType) : false;
  const isResettable = Boolean(
    template && templates.find((item) => item.id === template.id)?.resettable
  );
  const labelDirty = Boolean(
    template && draftLabel.trim() !== '' && draftLabel.trim() !== template.label
  );

  // Letterbox the 960×540 reference canvas inside its shell: scale to the smaller
  // of width/height ratio so the stage always fills the card without scrollbars.
  useEffect(() => {
    const shell = canvasShellRef.current;
    if (!shell) return;
    fitCanvasToShell();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => fitCanvasToShell());
    observer.observe(shell);
    return () => {
      observer.disconnect();
    };
  }, [template, fitCanvasToShell]);

  // The browser-level exits: closing the tab, reloading, typing a new URL. The
  // listener is the registration itself — armed only while an editable canvas
  // has something to lose, and removed on cleanup, so an operator who has only
  // read a template meets nothing.
  useEffect(() => {
    if (!isDirty || !isEditable) return;
    window.addEventListener('beforeunload', beforeUnloadGuard);
    return () => {
      window.removeEventListener('beforeunload', beforeUnloadGuard);
    };
  }, [isDirty, isEditable]);

  // `beforeunload` cannot see a client-side route change, so the same state is
  // published to the page's navigation blocker, which is what `Header`'s links
  // read. Cleared on unmount: a blocked flag outliving this editor would put a
  // confirmation in front of every link on the page it left behind.
  useEffect(() => {
    setIsBlocked(isDirty && isEditable);
    return () => {
      setIsBlocked(false);
    };
  }, [isDirty, isEditable, setIsBlocked]);

  const busy =
    status === 'loading' ||
    status === 'saving' ||
    status === 'creating' ||
    status === 'renaming' ||
    status === 'resetting' ||
    status === 'deleting' ||
    status === 'reordering';

  // The canvas stops accepting input while a request is in flight, the way the
  // toolbar buttons already do.
  //
  // Without this there is a window with no good outcome. `handleSave` reads the
  // canvas once, then awaits; a drag landing in that gap fires `object:modified`
  // and sets the flag, but the edit is not in the payload, and the success path
  // replaces `template` — which remounts the canvas from the server copy and
  // throws that edit away. Clearing the flag then reports clean over work that
  // was silently discarded, which is the exact failure this story exists to
  // prevent. Discarding the active object closes the toolbar paths in the same
  // move: with no selection, `applyTextStyle` changes nothing and the text field
  // disables itself.
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    if (busy) canvas.discardActiveObject();
    canvas.selection = !busy;
    for (const object of canvas.getObjects()) {
      object.selectable = !busy;
      object.evented = !busy;
    }
    canvas.requestRenderAll();
  }, [busy]);
  const requiredElementIds = new Set(
    (template ? (getEditableLayout(template)?.elements ?? []) : [])
      .filter((element) => element.required)
      .map((element) => element.id)
  );
  const canDeleteSelection =
    selectedElementIds.length > 0 &&
    selectedElementIds.every(
      (id) => isUserAuthoredId(id) && !requiredElementIds.has(id)
    );

  return (
    <div className={hideList ? 'block' : 'grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]'}>
      {!hideList ? (
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card/60 p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Templates</h2>
        <form
          className="mb-3 flex gap-1"
          onSubmit={(event) => {
            event.preventDefault();
            void handleCreate();
          }}
        >
          <Input
            type="text"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            maxLength={80}
            placeholder={t('admin.artifacts.addPlaceholder')}
            aria-label={t('admin.artifacts.addLabel')}
            disabled={busy}
            className="min-w-0 flex-1"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={busy || !newLabel.trim()}
          >
            {status === 'creating' ? t('admin.artifacts.adding') : t('admin.artifacts.add')}
          </Button>
          {activeCopiedSlidePayload ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => void handlePasteSlide()}
              disabled={busy}
              title={t('admin.artifacts.pasteSlide')}
            >
              {t('admin.artifacts.pasteSlide')}
            </Button>
          ) : null}
        </form>
        <ul className="max-h-[70vh] space-y-1 overflow-x-hidden overflow-y-auto">
          {templates.map((item) => {
            const isSelected = selectedId === item.id;
            return (
              <li key={item.id} className="border-b border-border/60 last:border-b-0">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    // Re-clicking the row that is already open is not a switch,
                    // and must not prompt. A different row re-enters mountCanvas,
                    // which throws the added-element map away and disposes the
                    // canvas — every unsaved edit goes with it.
                    if (item.id === selectedId) return;
                    const proceed = mayDiscard(
                      isDirty && isEditable,
                      DISCARD_ON_SWITCH_CONFIRMATION,
                      (message) => window.confirm(message)
                    );
                    if (!proceed) return;
                    setSelectedId(item.id);
                  }}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    event.preventDefault();
                    if (item.id === selectedId) return;
                    const proceed = mayDiscard(
                      isDirty && isEditable,
                      DISCARD_ON_SWITCH_CONFIRMATION,
                      (message) => window.confirm(message)
                    );
                    if (!proceed) return;
                    setSelectedId(item.id);
                  }}
                  className={`cursor-pointer rounded-lg px-2 py-2 transition-colors ${
                    isSelected
                      ? 'bg-primary/10 ring-1 ring-primary/40'
                      : 'hover:bg-muted/60'
                  }`}
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
                    <span className="truncate font-medium leading-tight">
                      {item.label}
                    </span>
                    <div className="grid shrink-0 grid-cols-2 gap-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`${t('admin.artifacts.moveUp')} ${item.label}`}
                        title={t('admin.artifacts.moveUp')}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleMoveTemplate(item, -1);
                        }}
                        disabled={busy || templates[0]?.id === item.id}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`${t('admin.artifacts.moveDown')} ${item.label}`}
                        title={t('admin.artifacts.moveDown')}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleMoveTemplate(item, 1);
                        }}
                        disabled={busy || templates.at(-1)?.id === item.id}
                      >
                        <ArrowDown />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs opacity-80">
                      <span>[{kindChipLabel(item.baseType)}]</span>
                      {!item.editable ? (
                        <span>{t('admin.artifacts.readOnly')}</span>
                      ) : null}
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`${t('admin.artifacts.copySlide')} ${item.label}`}
                        title={t('admin.artifacts.copySlide')}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleCopySlide(item);
                        }}
                        disabled={busy}
                      >
                        <Copy />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        aria-label={`${t('admin.artifacts.delete')} ${item.label}`}
                        title={t('admin.artifacts.delete')}
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeleteTemplate(item);
                        }}
                        disabled={busy}
                        className="border-destructive text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </aside>
      ) : null}

      <section className="min-w-0 space-y-4">
        {bannerNote ? <div>{bannerNote}</div> : null}
        {!template ? (
          <>
            {message ? (
              <p
                role="alert"
                className={`text-sm ${
                  status === 'error' || status === 'conflict'
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {message}
              </p>
            ) : null}
            <p className="text-sm text-muted-foreground">{t('admin.artifacts.selectHint')}</p>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Label className="sr-only" htmlFor="artifact-label">
                  {t('admin.artifacts.label')}
                </Label>
                <Input
                  id="artifact-label"
                  type="text"
                  value={draftLabel}
                  onChange={(event) => setDraftLabel(event.target.value)}
                  maxLength={80}
                  disabled={busy}
                  className="text-lg font-semibold"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                  <span>[{kindChipLabel(template.baseType)}]</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {isDirty && isEditable ? (
                  <span
                    role="status"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {UNSAVED_INDICATOR_LABEL}
                  </span>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleRename()}
                  disabled={!labelDirty || busy}
                >
                  {status === 'renaming'
                    ? t('admin.artifacts.renaming')
                    : t('admin.artifacts.rename')}
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={!isEditable || busy}
                >
                  {t('admin.artifacts.save')}
                </Button>
                {isResettable ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={busy}
                  >
                    {t('admin.artifacts.reset')}
                  </Button>
                ) : null}
              </div>
            </div>

            {message ? (
              <p
                role="alert"
                className={`text-sm ${
                  status === 'error' || status === 'conflict'
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {message}
              </p>
            ) : null}

            {!isEditable ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-sm text-muted-foreground">
                {template.baseType === 'ann-set-marker'
                  ? t('admin.artifacts.markerSpineNote')
                  : t('admin.artifacts.readOnlyBody').replace(
                      '{kind}',
                      `[${kindChipLabel(template.baseType)}]`
                    )}
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/40 p-4">
                  <span className="mr-1 text-sm font-medium">{t('admin.artifacts.elements')}</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={busy}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        void insertImage(file);
                      }
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void insertElement('text');
                    }}
                    disabled={busy}
                  >
                    {t('admin.artifacts.addText')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void insertElement('shape');
                    }}
                    disabled={busy}
                  >
                    {t('admin.artifacts.addRect')}
                  </Button>
                  {allowImages ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        fileInputRef.current?.click();
                      }}
                      disabled={busy}
                    >
                      {t('admin.artifacts.addImage')}
                    </Button>
                  ) : null}
                  <Select
                    value={insertPlaceholderKey}
                    onValueChange={(val) => {
                      if (val) setInsertPlaceholderKey(val);
                    }}
                    disabled={busy}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-[180px]"
                      aria-label={t('admin.artifacts.insertPlaceholder')}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLACEHOLDER_CATALOG.filter(
                        (entry) => allowImages || entry.type !== 'image'
                      ).map((entry) => (
                        <SelectItem key={entry.key} value={entry.key}>
                          {t(placeholderLabelKey(entry.key))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void insertPlaceholder(insertPlaceholderKey);
                    }}
                    disabled={busy}
                  >
                    {t('admin.artifacts.insertPlaceholder')}
                  </Button>
                  <div className="mx-1 h-4 w-px bg-border/60" />
                  <span className="mr-1 text-xs text-muted-foreground">{t('admin.artifacts.layerOrder')}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderLayer('forward')}
                    disabled={busy || selectedElementIds.length === 0}
                    title={t('admin.artifacts.bringForward')}
                  >
                    <ArrowUp />
                    <span className="sr-only sm:not-sr-only sm:inline">{t('admin.artifacts.bringForward')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderLayer('backward')}
                    disabled={busy || selectedElementIds.length === 0}
                    title={t('admin.artifacts.sendBackward')}
                  >
                    <ArrowDown />
                    <span className="sr-only sm:not-sr-only sm:inline">{t('admin.artifacts.sendBackward')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderLayer('front')}
                    disabled={busy || selectedElementIds.length === 0}
                    title={t('admin.artifacts.bringToFront')}
                  >
                    <BringToFront />
                    <span className="sr-only sm:not-sr-only sm:inline">{t('admin.artifacts.bringToFront')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleReorderLayer('back')}
                    disabled={busy || selectedElementIds.length === 0}
                    title={t('admin.artifacts.sendToBack')}
                  >
                    <SendToBack />
                    <span className="sr-only sm:not-sr-only sm:inline">{t('admin.artifacts.sendToBack')}</span>
                  </Button>
                  <div className="mx-1 h-4 w-px bg-border/60" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={busy || !canDeleteSelection}
                    title={
                      selectedElementIds.length === 0
                        ? t('admin.artifacts.deleteHintNone')
                        : canDeleteSelection
                          ? t('admin.artifacts.deleteHintOk')
                          : t('admin.artifacts.deleteHintShipped')
                    }
                    className="border-destructive/60 text-destructive hover:bg-destructive/10"
                  >
                    {t('admin.artifacts.deleteSelected')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void handleDuplicateSelected();
                    }}
                    disabled={busy || selectedElementIds.length === 0}
                    title={t('admin.artifacts.duplicateSelected')}
                  >
                    {t('admin.artifacts.duplicateSelected')}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {t('admin.artifacts.deleteOnlyAuthored')}
                  </span>
                </div>
                <div className="space-y-4 rounded-2xl border border-border bg-card/40 p-4">
                  <div className="space-y-2">
                    <Label htmlFor="artifact-text-content" className="text-sm font-medium">
                      {t('admin.artifacts.text')}
                    </Label>
                    <Textarea
                      id="artifact-text-content"
                      value={textContent}
                      disabled={selectedTextCount !== 1}
                      rows={5}
                      onChange={(e) => handleTextContentChange(e.target.value)}
                      placeholder={
                        selectedTextCount === 1
                          ? t('admin.artifacts.textPlaceholder')
                          : t('admin.artifacts.textPlaceholderIdle')
                      }
                      title={
                        selectedTextCount === 1
                          ? t('admin.artifacts.textTitle')
                          : t('admin.artifacts.textTitleIdle')
                      }
                      className="min-h-[7.5rem] w-full resize-y font-mono text-sm leading-relaxed"
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-3">
                  <Label className="flex items-center gap-2 text-sm">
                    {t('admin.artifacts.fontColor')}
                    <input
                      type="color"
                      value={fontColor}
                      onChange={(e) => setFontColor(e.target.value)}
                      className="align-middle"
                    />
                  </Label>
                  <Label className="flex items-center gap-2 text-sm">
                    {t('admin.artifacts.fontSize')}
                    <Input
                      type="number"
                      min={MIN_FONT_SIZE}
                      max={MAX_FONT_SIZE}
                      value={fontSizeInput}
                      onChange={(e) => handleFontSizeInput(e.target.value)}
                      onBlur={() => setFontSizeInput(String(fontSize))}
                      className="w-20"
                    />
                  </Label>
                  <Button
                    type="button"
                    variant={fontWeight === 'bold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleToggleBold}
                    disabled={selectedTextCount === 0 || busy}
                    title={t('admin.artifacts.bold')}
                  >
                    <Bold />
                    <span className="sr-only sm:not-sr-only sm:inline">{t('admin.artifacts.bold')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant={fontStyle === 'italic' ? 'default' : 'outline'}
                    size="sm"
                    onClick={handleToggleItalic}
                    disabled={selectedTextCount === 0 || busy}
                    title={t('admin.artifacts.italic')}
                  >
                    <Italic />
                    <span className="sr-only sm:not-sr-only sm:inline">{t('admin.artifacts.italic')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyTextStyle}
                  >
                    {t('admin.artifacts.applyStyle')}
                  </Button>
                  <span className="text-xs text-muted-foreground sm:ml-auto">
                    {t('admin.artifacts.styleHint')}
                  </span>
                  </div>
                </div>
                <div
                  ref={canvasShellRef}
                  className="flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border border-border bg-black/90"
                >
                  <canvas ref={canvasRef} />
                </div>
              </>
            )}
          </>
        )}
      </section>
    </div>
  );
}
