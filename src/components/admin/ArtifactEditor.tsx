import { toast } from 'sonner';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  Bold,
  BringToFront,
  Copy,
  Image as ImageIcon,
  Italic,
  MoveVertical,
  Plus,
  SendToBack,
  Square,
  Trash2,
  Type,
  Underline,
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
  FabricTextLike,
  calculateImageFit,
  INSERT_CASCADE_PX,
  INSERT_CASCADE_STEPS,
  MAX_FONT_SIZE,
  MIN_FONT_SIZE,
  NEW_SHAPE_FILL,
  NEW_SHAPE_SIZE_PX,
  NEW_TEXT_CONTENT,
  NEW_TEXT_SIZE_PX,
  clampFontSize,
  computeContextMenuCoords,
  filterOutBackgroundElements,
  getElementId,
  handleContextMenuTrigger,
  isBackgroundElement,
  isFabricTextObject,
  isUserAuthoredId,
  nextElementId,
  normalizeFontSize,
  pctToPx,
  pxToPct,
  resolveInitialSelectedId,
  serializeCanvas,
  serializeTextStyle,
  shouldPreserveSelectionOnContextMenu,
  syncImageClipOnMove,
  syncImageClipOnScale,
  toStrictHexColor,
  updateImageElementFit,
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

function getEditableLayout(template: StoredArtifactTemplate): ArtifactLayout | null {
  if (!isCanvasAuthorable(template.baseType)) return null;
  return template.layouts.default ?? null;
}

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
    return new fabric.Textbox(element.content ?? '', {
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
      ...(style?.textDecoration === 'underline' ? { underline: true } : {}),
      ...(style?.lineHeight !== undefined ? { lineHeight: style.lineHeight } : {}),
      ...(style?.textShadow ? { shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: 4, offsetX: 2, offsetY: 2 }) } : {}),
      textAlign: style?.textAlign ?? DEFAULT_TEXT_ALIGN,
      splitByGrapheme: true,
      editable: editable,
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
    if (typeof Image !== 'undefined') {
      const imgEl = new Image();
      imgEl.crossOrigin = 'anonymous';
      imgEl.src = element.imageRef;

      const calcFit = () =>
        calculateImageFit(
          { left, top, width, height },
          { width: imgEl.naturalWidth, height: imgEl.naturalHeight },
          element.style?.objectFit
        );

      const initial = calcFit();
      const clipBox = new fabric.Rect({
        left,
        top,
        width,
        height,
        absolutePositioned: true,
      });

      const fabricImg = new fabric.FabricImage(imgEl, {
        ...common,
        width: initial.width,
        height: initial.height,
        left: initial.left,
        top: initial.top,
        scaleX: initial.scaleX,
        scaleY: initial.scaleY,
        clipPath: clipBox,
        data: {
          elementId: element.id,
          imageRef: element.imageRef,
          objectFit: element.style?.objectFit,
          clipOffset: { x: left - initial.left, y: top - initial.top },
          clipDimensions: { width, height },
          baseScaleX: initial.scaleX,
          baseScaleY: initial.scaleY,
        },
      });
      imgEl.onload = () => {
        const updated = calcFit();
        if ((fabricImg as any).data) {
          (fabricImg as any).data.clipOffset = { x: left - updated.left, y: top - updated.top };
          (fabricImg as any).data.clipDimensions = { width, height };
          (fabricImg as any).data.baseScaleX = updated.scaleX;
          (fabricImg as any).data.baseScaleY = updated.scaleY;
        }
        fabricImg.set({
          width: updated.width,
          height: updated.height,
          left: updated.left,
          top: updated.top,
          scaleX: updated.scaleX,
          scaleY: updated.scaleY,
          clipPath: clipBox,
        });
        fabricImg.canvas?.requestRenderAll();
      };
      return fabricImg;
    }
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
  fetchAvailableAnnouncementSets,
  fetchAvailableSongSets,
  fetchBackgroundLibrary,
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
  allowRename?: boolean;
  bannerNote?: React.ReactNode;
  prefixListSlot?: React.ReactNode;
}

export default function ArtifactEditor({
  adapter = mainSpineAdapter,
  initialSelectedId = null,
  copiedSlidePayload: externalCopiedSlidePayload,
  onCopySlidePayloadChange,
  hideList = false,
  allowImages = true,
  allowRename = true,
  bannerNote = null,
  prefixListSlot = null,
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
  const [underline, setUnderline] = useState(false);
  const [lineHeight, setLineHeight] = useState<number>(1.16);
  const [textShadow, setTextShadow] = useState(false);
  const [shadowBlur, setShadowBlur] = useState<number>(4);
  const [shapeFill, setShapeFill] = useState('#5C2E16');
  const [selectedElementIds, setSelectedElementIds] = useState<string[]>([]);
  const [selectedTextCount, setSelectedTextCount] = useState(0);
  const [textContent, setTextContent] = useState('');
  /** Elements authored in this session, not yet persisted. */
  const addedElementsRef = useRef<Map<string, CanvasElement>>(new Map());
  const addedPlaceholdersRef = useRef<Map<string, PlaceholderDefinition>>(
    new Map()
  );
  const insertCounterRef = useRef(0);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showBgDialog, setShowBgDialog] = useState(false);
  const [bgLibrary, setBgLibrary] = useState<Array<{ id: number; url: string }>>([]);
  const [availableSongSets, setAvailableSongSets] = useState<Array<{ variableName: string; title: string }>>([]);
  const [availableAnnSets, setAvailableAnnSets] = useState<Array<{ id: number; label: string }>>([]);
  const [newSlideType, setNewSlideType] = useState('general');
  const [drawingTool, setDrawingTool] = useState<'text' | 'rect' | null>(null);
  const drawingToolRef = useRef<'text' | 'rect' | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragSourceIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const saveSequenceRef = useRef(0);

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
    const texts: FabricTextLike[] = active.filter(isFabricTextObject);
    setSelectedTextCount(texts.length);
    const selectedText = texts[0];
    // The content field edits one box at a time; anything else clears it.
    setTextContent(texts.length === 1 && selectedText ? (selectedText.text ?? '') : '');
    if (selectedText) {
      setFontColor(
        toStrictHexColor(selectedText.fill, DEFAULT_FONT_COLOR) ?? DEFAULT_FONT_COLOR
      );
      const size = normalizeFontSize(selectedText.fontSize);
      setFontSize(size);
      setFontSizeInput(String(size));
      setFontWeight(selectedText.fontWeight === 'bold' ? 'bold' : 'normal');
      setFontStyle(selectedText.fontStyle === 'italic' ? 'italic' : 'normal');
      setUnderline(Boolean((selectedText as any).underline));
      setLineHeight(
        typeof (selectedText as any).lineHeight === 'number'
          ? (selectedText as any).lineHeight
          : 1.16
      );
      setTextShadow(Boolean((selectedText as any).shadow));
      if ((selectedText as any).shadow && typeof (selectedText as any).shadow.blur === 'number') {
        setShadowBlur((selectedText as any).shadow.blur);
      }
    }
    const shapes = active.filter((obj) => (obj as any).type === 'rect' && !(obj as any).data?.imageRef);
    if (shapes.length > 0) {
      setShapeFill(toStrictHexColor((shapes[0] as any).fill, '#5C2E16') ?? '#5C2E16');
    }
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
    loadList()
      .then((summaries) => {
        setSelectedId((current) => resolveInitialSelectedId(current, initialSelectedId, summaries));
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : t('admin.artifacts.loadFailed'));
      });
    void fetchAvailableSongSets().then(setAvailableSongSets);
    void fetchAvailableAnnouncementSets().then(setAvailableAnnSets);
    void fetchBackgroundLibrary().then(setBgLibrary);
    const handleWindowClick = () => setContextMenu(null);
    window.addEventListener('click', handleWindowClick);
    return () => window.removeEventListener('click', handleWindowClick);
  }, [loadList, t]);

  useEffect(() => {
    drawingToolRef.current = drawingTool;
    const canvas = fabricCanvasRef.current;
    if (canvas) {
      canvas.defaultCursor = drawingTool ? 'crosshair' : 'default';
    }
  }, [drawingTool]);

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
        fireRightClick: true,
        stopContextMenu: true,
        backgroundColor: layout.backgroundColor,
        preserveObjectStacking: true,
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

      let dragStart: { x: number; y: number } | null = null;
      const onMouseDown = (opt: any) => {
        if (!drawingToolRef.current) return;
        const pointer = canvas.getScenePoint(opt.e);
        dragStart = { x: pointer.x, y: pointer.y };
      };
      const onMouseUp = (opt: any) => {
        const tool = drawingToolRef.current;
        if (!tool || !dragStart) return;
        const pointer = canvas.getScenePoint(opt.e);
        const start = dragStart;
        dragStart = null;
        const dx = Math.abs(pointer.x - start.x);
        const dy = Math.abs(pointer.y - start.y);
        let x = Math.min(start.x, pointer.x);
        let y = Math.min(start.y, pointer.y);
        let w = dx;
        let h = dy;
        if (dx < 10 && dy < 10) {
          const def = tool === 'text' ? NEW_TEXT_SIZE_PX : NEW_SHAPE_SIZE_PX;
          w = def.w;
          h = def.h;
        }
        void insertDrawnElement(tool === 'rect' ? 'shape' : 'text', x, y, w, h);
        setDrawingTool(null);
      };
      canvas.on('mouse:down', onMouseDown);
      canvas.on('mouse:up', onMouseUp);

      // Native DOM listener on upperCanvasEl: Fabric wraps canvas in an upper-canvas DOM layer
      // that receives pointer events. Handling contextmenu here guarantees reliable execution.
      const upperCanvasEl = canvas.upperCanvasEl;
      const onNativeContextMenu = (e: MouseEvent) => {
        e.preventDefault();
        const shell = canvasShellRef.current;
        const rect = shell ? shell.getBoundingClientRect() : null;
        handleContextMenuTrigger(
          e,
          canvas,
          rect,
          syncSelection,
          setContextMenu
        );
      };
      upperCanvasEl?.addEventListener('contextmenu', onNativeContextMenu);

      // SPEC-14-01: On active image object moving, synchronize clipPath coordinates
      const onObjectMoving = (opt: any) => {
        const target = opt.target;
        if (target && syncImageClipOnMove(target)) {
          canvas.requestRenderAll();
        }
      };
      canvas.on('object:moving', onObjectMoving);

      // SPEC-15-01: On active image object scaling, synchronize clipPath coordinates and dimensions
      const onObjectScaling = (opt: any) => {
        const target = opt.target;
        if (target && syncImageClipOnScale(target)) {
          canvas.requestRenderAll();
        }
      };
      canvas.on('object:scaling', onObjectScaling);

      // SPEC-13-03: On image object scaling/modification, recalculate contain fit so image content grows/shrinks with handles
      const onObjectModified = (opt: any) => {
        const target = opt.target;
        const action = opt?.action || opt?.transform?.action;
        if (action === 'drag' || action === 'move') {
          syncImageClipOnMove(target);
          return;
        }
        if (target && target.data?.imageRef) {
          if (updateImageElementFit(target, fabric)) {
            canvas.requestRenderAll();
          }
        }
      };
      canvas.on('object:modified', onObjectModified);

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
        canvas.off('mouse:down', onMouseDown);
        canvas.off('mouse:up', onMouseUp);
        canvas.off('object:moving', onObjectMoving);
        canvas.off('object:scaling', onObjectScaling);
        canvas.off('object:modified', onObjectModified);
        upperCanvasEl?.removeEventListener('contextmenu', onNativeContextMenu);
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

  const insertDrawnElement = useCallback(
    async (kind: 'text' | 'shape', xPx: number, yPx: number, wPx: number, hPx: number) => {
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
      insertCounterRef.current += 1;
      const id = nextElementId(usedIds, insertCounterRef.current);
      const maxZ = [
        ...layout.elements,
        ...addedElementsRef.current.values(),
      ].reduce((acc, e) => Math.max(acc, e.zIndex), -1);

      const element: CanvasElement = {
        id,
        type: kind,
        required: false,
        x: pxToPct(xPx, CANVAS_WIDTH),
        y: pxToPct(yPx, CANVAS_HEIGHT),
        w: pxToPct(wPx, CANVAS_WIDTH),
        h: pxToPct(hPx, CANVAS_HEIGHT),
        zIndex: maxZ + 1,
        ...(kind === 'text'
          ? {
              content: NEW_TEXT_CONTENT,
              style: {
                fontFamily: DEFAULT_FONT_FAMILY,
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
      markDirty();
      setStatus('idle');
      setMessage(null);
    },
    [template, fontColor, fontSize, syncSelection, markDirty]
  );

  const handleChangeBackgroundUrl = useCallback(
    async (url: string | null) => {
      const canvas = fabricCanvasRef.current;
      const layout = template ? getEditableLayout(template) : null;
      if (!canvas || !layout) return;

      const fabric = await import('fabric');
      if (fabricCanvasRef.current !== canvas) return;

      let bg: any = undefined;
      if (url) {
        try {
          bg = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' });
        } catch (err) {
          toast.error(err instanceof Error ? err.message : 'Failed to load background');
          return;
        }

        if (fabricCanvasRef.current !== canvas) return;

        if (!bg || !bg.width) {
          toast.error('Failed to load background: invalid image');
          return;
        }

        bg.set({
          left: 0,
          top: 0,
          scaleX: CANVAS_WIDTH / (bg.width || CANVAS_WIDTH),
          scaleY: CANVAS_HEIGHT / (bg.height || CANVAS_HEIGHT),
          selectable: false,
          evented: false,
        });
      }

      // Replace or clear canvas background image
      canvas.backgroundImage = bg;
      if (url) {
        layout.backgroundImage = url;
      } else {
        delete layout.backgroundImage;
      }

      // SPEC-13-09 / DEC-014: Replace existing background element instead of stacking extra layers
      const bgElements = (layout.elements ?? []).filter(isBackgroundElement);
      for (const bgEl of bgElements) {
        addedElementsRef.current.delete(bgEl.id);
        const obj = canvas.getObjects().find((o) => getElementId(o) === bgEl.id);
        if (obj) canvas.remove(obj);
      }
      layout.elements = filterOutBackgroundElements(layout.elements ?? []);

      canvas.requestRenderAll();
      syncSelection(canvas);
      markDirty();
      setShowBgDialog(false);
    },
    [template, syncSelection, markDirty]
  );

  const handleUploadBackgroundFile = useCallback(
    async (file: File) => {
      try {
        const { url } = await uploadImageFile(file);
        await handleChangeBackgroundUrl(url);
        toast.success(t('admin.artifacts.saved'));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to upload background');
      }
    },
    [handleChangeBackgroundUrl, t]
  );

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

      // Sort objects: top-down for forward/front, bottom-up for backward/back
      const objects = canvas.getObjects();
      const sorted = [...active].sort((a, b) => {
        const idxA = objects.indexOf(a);
        const idxB = objects.indexOf(b);
        return action === 'forward' || action === 'front' ? idxB - idxA : idxA - idxB;
      });

      let changed = false;
      for (const obj of sorted) {
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
    for (const obj of active) {
      const elementId = getElementId(obj);
      if (!elementId) continue;
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

    setStatus('idle');
    setMessage(
      `Removed ${removable.length} element${removable.length === 1 ? '' : 's'}. Save to persist.`
    );
  }, [template, syncSelection, markDirty, t]);

  // DEC-012: The canvas admits one keyboard shortcut: Delete/Backspace on the selected element.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;

      const activeEl = document.activeElement;
      if (
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        (activeEl instanceof HTMLElement && activeEl.isContentEditable) ||
        activeEl instanceof HTMLButtonElement ||
        activeEl?.getAttribute('role') === 'button'
      ) {
        return;
      }

      const shell = canvasShellRef.current;
      const isCanvasFocused =
        shell &&
        (shell.contains(activeEl) || activeEl === document.body || activeEl === null);
      if (!isCanvasFocused) return;

      const canvas = fabricCanvasRef.current;
      if (!canvas) return;

      const activeObjects = canvas.getActiveObjects();
      if (activeObjects.length === 0) return;

      const isTextEditing = activeObjects.some((obj) => (obj as any).isEditing === true);
      if (isTextEditing) return;

      e.preventDefault();
      handleDeleteSelected();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleDeleteSelected]);

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

    void import('fabric').then((fabric) => {
      const shadowObj = textShadow
        ? new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: shadowBlur, offsetX: 2, offsetY: 2 })
        : null;
      let updated = false;
      for (const obj of canvas.getActiveObjects()) {
        if (!isFabricTextObject(obj)) continue;
        obj.set({
          fill: fontColor,
          fontSize,
          fontWeight,
          fontStyle,
          underline,
          lineHeight,
          shadow: shadowObj,
        } as any);
        updated = true;
      }
      if (updated) {
        canvas.requestRenderAll();
        markDirty();
      }
    });
  };

  const handleFontColorChange = (color: string) => {
    setFontColor(color);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    let updated = false;
    for (const obj of canvas.getActiveObjects()) {
      if (!isFabricTextObject(obj)) continue;
      obj.set({ fill: color });
      updated = true;
    }
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

  const handleToggleUnderline = useCallback(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const texts = canvas.getActiveObjects().filter(isFabricTextObject);
    if (texts.length === 0) return;
    const nextUnderline = !underline;
    setUnderline(nextUnderline);
    for (const obj of texts) {
      obj.set({ underline: nextUnderline } as any);
    }
    canvas.requestRenderAll();
    markDirty();
  }, [underline, markDirty]);

  const handleLineHeightChange = useCallback(
    (val: number) => {
      const clamped = Math.max(0.8, Math.min(2.5, Number(val.toFixed(2))));
      setLineHeight(clamped);
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      for (const obj of canvas.getActiveObjects()) {
        if (isFabricTextObject(obj)) {
          obj.set({ lineHeight: clamped });
        }
      }
      canvas.requestRenderAll();
      markDirty();
    },
    [markDirty]
  );

  const handleToggleTextShadow = useCallback(async () => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    const fabric = await import('fabric');
    const nextShadow = !textShadow;
    setTextShadow(nextShadow);
    const shadowObj = nextShadow
      ? new fabric.Shadow({ color: 'rgba(0,0,0,0.8)', blur: shadowBlur, offsetX: 2, offsetY: 2 })
      : null;
    for (const obj of canvas.getActiveObjects()) {
      if (isFabricTextObject(obj)) {
        obj.set({ shadow: shadowObj } as any);
      }
    }
    canvas.requestRenderAll();
    markDirty();
  }, [textShadow, shadowBlur, markDirty]);

  const handleShadowBlurChange = useCallback(
    async (blurVal: number) => {
      const clamped = Math.max(0, Math.min(20, Math.round(blurVal)));
      setShadowBlur(clamped);
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const fabric = await import('fabric');
      const shadowObj = new fabric.Shadow({
        color: 'rgba(0,0,0,0.8)',
        blur: clamped,
        offsetX: 2,
        offsetY: 2,
      });
      for (const obj of canvas.getActiveObjects()) {
        if (isFabricTextObject(obj)) {
          obj.set({ shadow: shadowObj } as any);
        }
      }
      canvas.requestRenderAll();
      markDirty();
    },
    [markDirty]
  );

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
    const clamped = clampFontSize(parsed);
    setFontSize(clamped);
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;
    let updated = false;
    for (const obj of canvas.getActiveObjects()) {
      if (!isFabricTextObject(obj)) continue;
      obj.set({ fontSize: clamped });
      updated = true;
    }
    if (updated) {
      canvas.requestRenderAll();
      markDirty();
    }
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

  const handleSetTextAlign = useCallback(
    (align: 'left' | 'center' | 'right') => {
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      const texts = canvas.getActiveObjects().filter(isFabricTextObject);
      if (texts.length === 0) return;
      for (const obj of texts) {
        obj.set({ textAlign: align });
      }
      canvas.requestRenderAll();
      markDirty();
    },
    [markDirty]
  );

  const handleSetShapeFill = useCallback(
    (color: string) => {
      setShapeFill(color);
      const canvas = fabricCanvasRef.current;
      if (!canvas) return;
      for (const obj of canvas.getActiveObjects()) {
        if ((obj as any).type === 'rect' && !(obj as any).data?.imageRef) {
          obj.set({ fill: color });
        }
      }
      canvas.requestRenderAll();
      markDirty();
    },
    [markDirty]
  );

  const handleCloneTemplate = async (item: ArtifactTemplateSummary) => {
    try {
      const data = await adapter.getOne(item.id);
      const { updatedAt, id, ...body } = data;

      const baseLabel = item.label.replace(/\s*\(Copy(?:\s+\d+)?\)$/, '');
      let copyNum = 1;
      const regex = new RegExp(`^${baseLabel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(Copy(?:\\s+(\\d+))?\\)$`);
      for (const t of templates) {
        const match = t.label.match(regex);
        if (match) {
          const n = match[1] ? parseInt(match[1], 10) : 1;
          if (n >= copyNum) copyNum = n + 1;
        }
      }
      const newLabel = `${baseLabel} (Copy ${copyNum})`;

      const created = await adapter.create(newLabel, {
        baseType: item.baseType,
        variableName: (item as any).variableName,
        annSetId: (item as any).annSetId,
      });

      if (item.baseType === 'general' && body.layouts) {
        await adapter.save(created.id, {
          ...body,
          id: created.id,
          label: newLabel,
          baseType: 'general',
          updatedAt: created.updatedAt,
        });
      }

      await loadList();
      setSelectedId(created.id);
      toast(t('admin.artifacts.created').replace('{label}', newLabel));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to clone slide');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragSourceIndexRef.current = index;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const rawData = e.dataTransfer.getData('text/plain');
    const sourceIndex =
      rawData !== '' && !Number.isNaN(Number(rawData))
        ? Number(rawData)
        : (dragSourceIndexRef.current ?? draggedIndex);
    dragSourceIndexRef.current = null;
    setDraggedIndex(null);
    if (
      sourceIndex === null ||
      sourceIndex === targetIndex ||
      sourceIndex < 0 ||
      sourceIndex >= templates.length
    ) {
      return;
    }
    const next = [...templates];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, moved);
    setTemplates(next);
    await handleReorderTemplates(next);
  };

  const handleCreate = async () => {
    const proceed = mayDiscard(
      isDirty && isEditable,
      DISCARD_ON_SWITCH_CONFIRMATION,
      (message) => window.confirm(message)
    );
    if (!proceed) return;

    setStatus('creating');
    setMessage(null);
    try {
      let opts: { baseType?: string; variableName?: string; annSetId?: number } = {};
      let label = newLabel.trim();
      if (newSlideType === 'general') {
        label = label || 'New Slide';
        opts = { baseType: 'general' };
      } else if (newSlideType.startsWith('song:')) {
        const vn = newSlideType.slice(5);
        const songEntry = availableSongSets.find((s) => s.variableName === vn);
        label = label || songEntry?.title || vn;
        opts = { baseType: 'song-set-entry', variableName: vn };
      } else if (newSlideType.startsWith('ann:')) {
        const sid = parseInt(newSlideType.slice(4), 10);
        const annEntry = availableAnnSets.find((a) => a.id === sid);
        label = label || annEntry?.label || `Announcement Set ${sid}`;
        opts = { baseType: 'ann-set-marker', annSetId: sid };
      }
      const data = await adapter.create(label, opts);
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

    const currentSaveSeq = ++saveSequenceRef.current;
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
      if (currentSaveSeq !== saveSequenceRef.current) return;
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
    if (!template || busy) return;
    if (
      !window.confirm(
        t('admin.artifacts.confirmReset').replace('{label}', template.label)
      )
    )
      return;

    // Discard any in-flight Save by incrementing sequence counter
    saveSequenceRef.current += 1;

    setStatus('resetting');
    setMessage(null);
    try {
      // Revert in-memory canvas state to the last-Saved template from adapter/store
      const data = await adapter.getOne(template.id);
      addedElementsRef.current = new Map();
      addedPlaceholdersRef.current = new Map();
      setSelectedElementIds([]);
      setContextMenu(null);
      setTemplate({ ...data });
      if (typeof data.label === 'string') setDraftLabel(data.label);
      setIsDirty((current) => nextDirtyState(current, 'reset'));
      setStatus('success');
      setMessage(t('admin.artifacts.resetDone'));
      toast(t('admin.artifacts.resetDone'));
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

  const handleReorderTemplates = async (desired: ArtifactTemplateSummary[]) => {
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

  const handleMoveTemplate = async (item: ArtifactTemplateSummary, direction: -1 | 1) => {
    const index = templates.findIndex((candidate) => candidate.id === item.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= templates.length) return;

    const desired = [...templates];
    [desired[index], desired[target]] = [desired[target], desired[index]];
    await handleReorderTemplates(desired);
  };

  const isEditable = template ? isCanvasAuthorable(template.baseType) : false;
  const isResettable = Boolean(template && isEditable);
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
  const canDeleteSelection = selectedElementIds.length > 0;

  return (
    <div className={hideList ? 'block' : 'grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)] min-h-[580px]'}>
      {!hideList ? (
        <aside className="space-y-4">
          {prefixListSlot}

          {/* POIN 1 & 2: REGION "NEW SLIDE" */}
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Slide</span>
              <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                {adapter === mainSpineAdapter ? 'Spine Placement' : 'Add Slide'}
              </span>
            </div>
            {adapter === mainSpineAdapter ? (
              <div className="flex gap-1.5 pt-0.5">
                <Select
                  value={newSlideType}
                  onValueChange={(val) => {
                    if (val) setNewSlideType(val);
                  }}
                  disabled={busy}
                >
                  <SelectTrigger className="flex-1 min-w-0 text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">📄 General Slide (Canvas)</SelectItem>
                    {availableSongSets.length > 0 ? (
                      availableSongSets.map((s) => (
                        <SelectItem key={s.variableName} value={`song:${s.variableName}`}>
                          🎵 {s.title}
                        </SelectItem>
                      ))
                    ) : null}
                    {availableAnnSets.length > 0 ? (
                      availableAnnSets.map((a) => (
                        <SelectItem key={a.id} value={`ann:${a.id}`}>
                          📢 {a.label}
                        </SelectItem>
                      ))
                    ) : null}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={busy}
                  className="shrink-0 h-8"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5 pt-0.5">
                <Input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder={t('admin.artifacts.addPlaceholder')}
                  disabled={busy}
                  className="flex-1 text-xs h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleCreate()}
                  disabled={busy || !newLabel.trim()}
                  className="shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* LIST TEMPLATES (POIN 3: HOVER ACTIONS & DND REORDER) */}
          <div className="rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-sm flex flex-col max-h-[calc(100vh-380px)] min-h-[220px]">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-foreground">Deck Sequence</span>
              <span className="text-[11px] text-muted-foreground font-mono">{templates.length} slides</span>
            </div>
            <ul className="space-y-1.5 overflow-y-auto pr-1 flex-1 min-h-0">
              {templates.map((item, index) => {
                const isSelected = selectedId === item.id;
                return (
                  <li
                    key={item.id}
                    draggable={!busy}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={() => {
                      if (dragOverIndex === index) setDragOverIndex(null);
                    }}
                    onDragEnd={() => {
                      setDragOverIndex(null);
                      dragSourceIndexRef.current = null;
                    }}
                    onDrop={(e) => void handleDrop(e, index)}
                    className={`group relative transition-all ${
                      dragOverIndex === index ? 'ring-2 ring-primary bg-primary/20 rounded-lg' : ''
                    }`}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => {
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
                      className={`flex items-center justify-between p-2 rounded-lg border cursor-grab active:cursor-grabbing select-none transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-border'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-medium truncate text-foreground">{item.label}</p>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          [{kindChipLabel(item.baseType)}]
                        </span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title={t('admin.artifacts.moveUp')}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleMoveTemplate(item, -1);
                          }}
                          disabled={busy || index === 0}
                          className="h-7 w-7 p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title={t('admin.artifacts.moveDown')}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleMoveTemplate(item, 1);
                          }}
                          disabled={busy || index === templates.length - 1}
                          className="h-7 w-7 p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title="Clone / Duplicate"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleCloneTemplate(item);
                          }}
                          disabled={busy}
                          className="h-7 w-7 p-1 text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          title={t('admin.artifacts.delete')}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleDeleteTemplate(item);
                          }}
                          disabled={busy}
                          className="h-7 w-7 p-1 text-destructive hover:text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      ) : null}

      <section className="min-w-0 space-y-4">
        {bannerNote ? <div>{bannerNote}</div> : null}
        {!template ? (
          <>
            <div className="h-6 min-h-[24px] flex items-center overflow-hidden">
              {message ? (
                <p
                  role="alert"
                  className={`text-xs truncate ${
                    status === 'error' || status === 'conflict'
                      ? 'text-destructive'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{t('admin.artifacts.selectHint')}</p>
          </>
        ) : (
          <>
            {/* POIN 4: SLIDE HEADER REGION (CARD RESMI DENGAN SIKLUS RENAME/RESET KONSISTEN) */}
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between shadow-sm min-h-[58px]">
              <div className="flex items-center gap-3">
                {allowRename && isRenaming ? (
                  <Input
                    id="artifact-label"
                    type="text"
                    value={draftLabel}
                    onChange={(event) => setDraftLabel(event.target.value)}
                    maxLength={80}
                    disabled={busy}
                    aria-label={t('admin.artifacts.rename')}
                    placeholder={template.label}
                    className="text-base font-semibold max-w-sm h-8"
                    autoFocus
                  />
                ) : (
                  <span className="text-base font-bold text-foreground">{draftLabel || template.label}</span>
                )}
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  [{kindChipLabel(template.baseType)}]
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isDirty && isEditable ? (
                  <span
                    role="status"
                    className="text-xs font-medium text-muted-foreground"
                  >
                    {UNSAVED_INDICATOR_LABEL}
                  </span>
                ) : null}

                {allowRename ? (
                  <>
                    {isRenaming ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsRenaming(false);
                            setDraftLabel(template.label);
                          }}
                          disabled={busy}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={async () => {
                            await handleRename();
                            setIsRenaming(false);
                          }}
                          disabled={!labelDirty || busy}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRenaming(true)}
                        disabled={busy}
                      >
                        {t('admin.artifacts.rename')}
                      </Button>
                    )}
                    <div className="h-4 w-px bg-border mx-1" />
                  </>
                ) : null}

                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground">Canvas:</span>
                  {isResettable ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReset}
                      disabled={!isEditable || busy || (!isDirty && !labelDirty)}
                    >
                      {t('admin.artifacts.reset')}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSave}
                    disabled={!isEditable || busy}
                  >
                    {t('admin.artifacts.save')}
                  </Button>
                </div>
              </div>
            </div>

            <div className="h-6 min-h-[24px] flex items-center overflow-hidden">
              {message ? (
                <p
                  role="alert"
                  className={`text-xs truncate ${
                    status === 'error' || status === 'conflict'
                      ? 'text-destructive'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {message}
                </p>
              ) : null}
            </div>

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
              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                {/* TOOLBAR ROW 1: ADD NEW ELEMENTS & CHANGE BACKGROUND */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 border border-border/80 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground font-semibold px-1">Add:</span>
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
                      variant={drawingTool === 'text' ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => setDrawingTool((cur) => (cur === 'text' ? null : 'text'))}
                      disabled={busy}
                      title="Text"
                    >
                      <Type className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant={drawingTool === 'rect' ? 'default' : 'outline'}
                      size="icon-sm"
                      onClick={() => setDrawingTool((cur) => (cur === 'rect' ? null : 'rect'))}
                      disabled={busy}
                      title="Rectangle"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </Button>
                    {allowImages ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={busy}
                        title="Image"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </Button>
                    ) : null}

                    <div className="h-4 w-px bg-border mx-1" />

                    <div>
                      <input
                        ref={bgFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUploadBackgroundFile(f);
                          if (bgFileInputRef.current) bgFileInputRef.current.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBgDialog(true)}
                        className="text-xs font-medium flex items-center gap-1.5"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        Background
                      </Button>
                    </div>

                    <div className="h-4 w-px bg-border mx-1" />

                    <Select
                      value={insertPlaceholderKey}
                      onValueChange={(val) => {
                        if (val) setInsertPlaceholderKey(val);
                      }}
                      disabled={busy}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-[170px] text-xs h-8"
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
                      size="sm"
                      onClick={() => {
                        void insertPlaceholder(insertPlaceholderKey);
                      }}
                      disabled={busy}
                      className="text-xs"
                    >
                      + Placeholder
                    </Button>
                  </div>
                </div>

                {/* TOOLBAR ROW 2: ELEMENT PROPERTIES (POIN 8) */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-xs h-11 min-h-[44px] max-h-[44px] overflow-x-auto overflow-y-hidden shrink-0 flex-nowrap">
                  {selectedElementIds.length === 0 ? (
                    <span className="text-muted-foreground text-xs italic">
                      Properties (None): Select element first
                    </span>
                  ) : selectedTextCount > 0 ? (
                    <>
                      <span className="text-[11px] font-mono text-muted-foreground uppercase">Properties (Text):</span>
                      <input
                        type="color"
                        value={fontColor}
                        onChange={(e) => handleFontColorChange(e.target.value)}
                        className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded"
                        title="Font Color"
                      />
                      <Input
                        type="number"
                        min={MIN_FONT_SIZE}
                        max={MAX_FONT_SIZE}
                        value={fontSizeInput}
                        onChange={(e) => handleFontSizeInput(e.target.value)}
                        onBlur={() => setFontSizeInput(String(fontSize))}
                        className="w-20 h-7 text-xs text-center"
                        title="Font Size"
                      />
                      <Button
                        type="button"
                        variant={fontWeight === 'bold' ? 'default' : 'outline'}
                        size="icon-sm"
                        onClick={handleToggleBold}
                        disabled={busy}
                        title={t('admin.artifacts.bold')}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant={fontStyle === 'italic' ? 'default' : 'outline'}
                        size="icon-sm"
                        onClick={handleToggleItalic}
                        disabled={busy}
                        title={t('admin.artifacts.italic')}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant={underline ? 'default' : 'outline'}
                        size="icon-sm"
                        onClick={handleToggleUnderline}
                        disabled={busy}
                        title={t('admin.artifacts.underline')}
                      >
                        <Underline className="w-3.5 h-3.5" />
                      </Button>
                      <div className="h-4 w-px bg-border mx-1" />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleSetTextAlign('left')}
                        title="Align Left"
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleSetTextAlign('center')}
                        title="Align Center"
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() => handleSetTextAlign('right')}
                        title="Align Right"
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </Button>
                      <div className="h-4 w-px bg-border mx-1" />
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          onClick={() => {
                            const next = lineHeight >= 1.8 ? 1.0 : Number((lineHeight + 0.2).toFixed(1));
                            handleLineHeightChange(next);
                          }}
                          disabled={busy}
                          title={`Line Height (${lineHeight.toFixed(1)})`}
                        >
                          <MoveVertical className="w-3.5 h-3.5" />
                        </Button>
                        <input
                          type="range"
                          min={0.8}
                          max={2.4}
                          step={0.1}
                          value={lineHeight}
                          onChange={(e) => handleLineHeightChange(Number(e.target.value))}
                          disabled={busy}
                          className="w-14 h-3 accent-primary cursor-pointer"
                          title={`Line Height: ${lineHeight.toFixed(1)}`}
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant={textShadow ? 'default' : 'outline'}
                          size="icon-sm"
                          onClick={handleToggleTextShadow}
                          disabled={busy}
                          title="Text Shadow"
                        >
                          <span className="font-black text-xs drop-shadow leading-none">S</span>
                        </Button>
                        {textShadow && (
                          <input
                            type="range"
                            min={0}
                            max={20}
                            step={1}
                            value={shadowBlur}
                            onChange={(e) => void handleShadowBlurChange(Number(e.target.value))}
                            disabled={busy}
                            className="w-14 h-3 accent-primary cursor-pointer"
                            title={`Shadow Blur: ${shadowBlur}`}
                          />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={applyTextStyle}
                        className="text-xs h-7 ml-auto"
                      >
                        {t('admin.artifacts.applyStyle')}
                      </Button>
                    </>
                  ) : fabricCanvasRef.current?.getActiveObjects().some((o) => Boolean((o as any).data?.imageRef)) ? (
                    <span className="text-muted-foreground text-xs italic">
                      Properties (Image): No properties to change
                    </span>
                  ) : (
                    <>
                      <span className="text-[11px] font-mono text-muted-foreground uppercase">Properties (Shape):</span>
                      <Label className="flex items-center gap-1 text-xs">
                        Color:
                        <input
                          type="color"
                          value={shapeFill}
                          onChange={(e) => handleSetShapeFill(e.target.value)}
                          className="w-5 h-5 bg-transparent border-0 cursor-pointer rounded ml-1"
                        />
                      </Label>
                    </>
                  )}
                </div>

                {/* CANVAS WORKSPACE & CONTEXT MENU (POIN 5 & 6) */}
                <div
                  ref={canvasShellRef}
                  className="relative flex aspect-video w-full max-h-[calc(100vh-310px)] min-h-[320px] items-center justify-center overflow-hidden rounded-xl border border-border bg-black/90"
                  onContextMenu={(e) => {
                    // Prevent native browser context menu on canvas shell
                    e.preventDefault();
                  }}
                >
                  <canvas ref={canvasRef} />

                  {/* Context Menu (Right Click) */}
                  {contextMenu ? (
                    <div
                      style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
                      className="absolute z-50 min-w-[160px] rounded-lg border border-border bg-popover/95 p-1 text-xs text-popover-foreground shadow-xl backdrop-blur-sm space-y-0.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-accent hover:text-accent-foreground text-left cursor-pointer select-none"
                        onClick={() => {
                          handleReorderLayer('front');
                          setContextMenu(null);
                        }}
                      >
                        <span>{t('admin.artifacts.bringToFront')}</span>
                        <span className="text-[10px] text-muted-foreground">Top</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-accent hover:text-accent-foreground text-left cursor-pointer select-none"
                        onClick={() => {
                          handleReorderLayer('forward');
                          setContextMenu(null);
                        }}
                      >
                        <span>{t('admin.artifacts.bringForward')}</span>
                        <span className="text-[10px] text-muted-foreground">+1</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-accent hover:text-accent-foreground text-left cursor-pointer select-none"
                        onClick={() => {
                          handleReorderLayer('backward');
                          setContextMenu(null);
                        }}
                      >
                        <span>{t('admin.artifacts.sendBackward')}</span>
                        <span className="text-[10px] text-muted-foreground">-1</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-accent hover:text-accent-foreground text-left cursor-pointer select-none"
                        onClick={() => {
                          handleReorderLayer('back');
                          setContextMenu(null);
                        }}
                      >
                        <span>{t('admin.artifacts.sendToBack')}</span>
                        <span className="text-[10px] text-muted-foreground">Bottom</span>
                      </div>
                      <div className="h-px bg-border my-1" />
                      <div
                        role="button"
                        tabIndex={0}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-accent hover:text-accent-foreground text-left cursor-pointer select-none"
                        onClick={() => {
                          void handleDuplicateSelected();
                          setContextMenu(null);
                        }}
                      >
                        <span>{t('admin.artifacts.duplicateSelected')}</span>
                      </div>
                      <div
                        role="button"
                        tabIndex={canDeleteSelection ? 0 : -1}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left select-none ${
                          canDeleteSelection
                            ? 'hover:bg-destructive/10 text-destructive cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                        }`}
                        onClick={() => {
                          if (canDeleteSelection) {
                            handleDeleteSelected();
                            setContextMenu(null);
                          }
                        }}
                      >
                        <span>{t('admin.artifacts.deleteSelected')}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </>
        )}

        {/* Change Background Modal Dialog */}
        {showBgDialog ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Change Canvas Background</h3>
                <Button variant="outline" size="sm" onClick={() => setShowBgDialog(false)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => bgFileInputRef.current?.click()}
                    className="flex-1"
                  >
                    Upload Image File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleChangeBackgroundUrl(null)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    Remove Background
                  </Button>
                </div>

                {bgLibrary.length > 0 ? (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Choose from Background Library:</Label>
                    <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                      {bgLibrary.map((bg) => (
                        <div
                          key={bg.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => void handleChangeBackgroundUrl(bg.url)}
                          className="aspect-video rounded-lg overflow-hidden border border-border hover:border-primary cursor-pointer transition-all"
                        >
                          <img src={bg.url} alt="Background" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
