import { useRouter } from '@/lib/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from '@/components/Link';
import { cn } from '@/lib/utils';
import {
  flushPendingHymnCommits,
  HymnNumberAutocomplete,
} from '@/components/HymnNumberAutocomplete';
import { ScriptureRefAutocomplete } from '@/components/ScriptureRefAutocomplete';
import {
  SlidePreviewList,
  type SlidePreviewItem,
} from '@/components/SlidePreviewList';
import { ImageUploadField } from '@/components/ImageUploadField';
import type { PreviewEntry } from '@/lib/artifacts/preview-model';
import { useT } from '@/lib/i18n/operator';
import {
  FORM_ERROR_BANNER,
  FORM_WARN_BANNER,
  FORM_WARN_BANNER_BODY,
} from '@/operator/form-banners';
import {
  buildFieldsPayload,
  coerceHydrateFields,
  EMPTY_WORSHIP_FORM_FIELDS,
  type HymnIndexEntry,
  type WorshipFormFields,
} from '@/lib/worship-form-fields';

type AnnouncementItemInput = {
  id: string;
  image_url: string;
  is_recurring: boolean;
};

type AnnouncementSeed = {
  id?: number | string;
  image_url: string;
  service_id?: number | null;
};

/** Module-level so the default keeps a stable identity across renders. */
const EMPTY_HYMN_INDEX: HymnIndexEntry[] = [];

export default function CreateForm({
  initialAnnouncements = [],
  hymnIndex = EMPTY_HYMN_INDEX,
}: {
  initialAnnouncements?: AnnouncementSeed[];
  hymnIndex?: HymnIndexEntry[];
} = {}) {
  const router = useRouter();
  const { t } = useT();
  const [payload, setPayload] = useState('');
  const [sermonGraphicUrl, setSermonGraphicUrl] = useState('');
  const [familyPhotoUrl, setFamilyPhotoUrl] = useState('');
  const [youthPhotoUrl, setYouthPhotoUrl] = useState('');
  const [announcements, setAnnouncements] = useState<AnnouncementItemInput[]>(() =>
    initialAnnouncements.map((ann, idx) => ({
      id: `init-${idx}-${ann.id ?? idx}`,
      image_url: ann.image_url,
      is_recurring: ann.service_id == null,
    }))
  );

  const [fields, setFields] = useState<WorshipFormFields>(
    EMPTY_WORSHIP_FORM_FIELDS
  );
  const [songSetEntries, setSongSetEntries] = useState<
    Array<{ variableName: string; title: string }>
  >([]);
  const [backgroundLibrary, setBackgroundLibrary] = useState<
    Array<{ id: number; url: string; isDefault: boolean }>
  >([]);
  const [openLyricEditors, setOpenLyricEditors] = useState<Record<string, boolean>>({});
  const [savingBookStatus, setSavingBookStatus] = useState<Record<string, boolean>>({});

  const toggleLyricEditor = async (variableName: string) => {
    const isOpening = !openLyricEditors[variableName];
    setOpenLyricEditors((prev) => ({ ...prev, [variableName]: isOpening }));

    if (isOpening) {
      const current = fieldsRef.current.songSets[variableName];
      // If lyrics are not already filled, fetch from hymn number if valid
      if (!current?.lyricText && current?.songNumber && /^\d+$/.test(current.songNumber.trim())) {
        const num = Number(current.songNumber.trim());
        try {
          const res = await fetch(`/api/hymns?numbers=${num}`);
          if (res.ok) {
            const data = (await res.json()) as { hymns?: Array<{ number: number; lyrics?: string }> };
            const hymn = data.hymns?.find((h) => h.number === num);
            if (hymn?.lyrics) {
              setSongSetField(variableName, 'lyricText', hymn.lyrics);
            }
          }
        } catch {
          // ignore lookup failure
        }
      }
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const [entriesRes, bgRes] = await Promise.all([
          fetch('/api/song-set-entries'),
          fetch('/api/background-library'),
        ]);
        if (entriesRes.ok) {
          const data = (await entriesRes.json()) as {
            entries?: Array<{ variableName: string; title: string }>;
          };
          if (active && Array.isArray(data.entries)) {
            setSongSetEntries(data.entries);
          }
        }
        if (bgRes.ok) {
          const data = (await bgRes.json()) as {
            images?: Array<{ id: number; url: string; isDefault: boolean }>;
          };
          if (active && Array.isArray(data.images)) {
            setBackgroundLibrary(data.images);
          }
        }
      } catch {
        // Non-blocking: fallback to whatever entries form has
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warningCollision, setWarningCollision] = useState<{
    date: string;
    id: number;
  } | null>(null);

  const [detectedDate, setDetectedDate] = useState<string | null>(null);
  const [slidePlan, setSlidePlan] = useState<SlidePreviewItem[]>([]);
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([]);
  const [failedHymnNumbers, setFailedHymnNumbers] = useState<number[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewSeqRef = useRef(0);

  useEffect(() => {
    if (!payload.trim()) {
      setDetectedDate(null);
      setSlidePlan([]);
      setPreviewEntries([]);
      setFailedHymnNumbers([]);
      setWarningCollision(null);
      setPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    const seq = ++previewSeqRef.current;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/services/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            raw_payload: payload,
            sermonGraphicUrl: sermonGraphicUrl || null,
            familyPhotoUrl: familyPhotoUrl || null,
            youthPhotoUrl: youthPhotoUrl || null,
            announcements: announcements.map((a) => ({
              image_url: a.image_url,
              is_recurring: a.is_recurring,
            })),
            fields: buildFieldsPayload(fields),
          }),
        });

        if (seq !== previewSeqRef.current) return;
        if (!res.ok) throw new Error('Preview generation failed');
        const data = (await res.json()) as {
          plan?: SlidePreviewItem[];
          previewEntries?: PreviewEntry[];
          date?: string | null;
          failedHymnNumbers?: number[];
        };
        if (seq !== previewSeqRef.current) return;

        setSlidePlan(data.plan || []);
        // Absent on older cached responses — the list falls back to raw kinds.
        setPreviewEntries(
          Array.isArray(data.previewEntries) ? data.previewEntries : []
        );
        setDetectedDate(data.date || null);
        setFailedHymnNumbers(
          Array.isArray(data.failedHymnNumbers) ? data.failedHymnNumbers : []
        );

        if (data.date) {
          const collisionRes = await fetch(`/api/services?q=${data.date}`, {
            signal: controller.signal,
          });
          if (seq !== previewSeqRef.current) return;
          if (collisionRes.ok) {
            const collData = (await collisionRes.json()) as {
              services?: Array<{ id: number; date: string }>;
            };
            const exactMatch = collData.services?.find(
              (r) => r.date === data.date
            );
            if (exactMatch) {
              setWarningCollision({ date: data.date, id: exactMatch.id });
            } else {
              setWarningCollision(null);
            }
          }
        } else {
          setWarningCollision(null);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Preview error:', err);
        if (seq === previewSeqRef.current) {
          setSlidePlan([]);
          setPreviewEntries([]);
          setDetectedDate(null);
          setWarningCollision(null);
          setFailedHymnNumbers([]);
        }
      } finally {
        if (seq === previewSeqRef.current) setPreviewLoading(false);
      }
    }, 800);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    payload,
    sermonGraphicUrl,
    familyPhotoUrl,
    youthPhotoUrl,
    announcements,
    fields,
  ]);

  // Mirrors `fields` synchronously. A hymn input commits on blur, which the
  // browser dispatches on the Save button's mousedown — before the click that
  // runs `handleSave`. The click closure therefore still holds the pre-commit
  // `fields`, so the request body is built from this ref instead.
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  const setSongSetField = (
    variableName: string,
    subField: 'songNumber' | 'songBookCode' | 'background' | 'lyricText',
    value: string
  ) => {
    setFields((prev) => {
      const current = prev.songSets[variableName] || {
        songNumber: '',
        songBookCode: '',
        background: '',
        lyricText: '',
      };
      const updated = {
        ...prev.songSets,
        [variableName]: { ...current, [subField]: value },
      };
      fieldsRef.current = { ...fieldsRef.current, songSets: updated };
      return { ...prev, songSets: updated };
    });
  };

  const setField = <K extends keyof WorshipFormFields>(
    key: K,
    value: WorshipFormFields[K]
  ) => {
    fieldsRef.current = { ...fieldsRef.current, [key]: value };
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const handleParse = async () => {
    if (!payload.trim()) {
      setError('Raw Rundown Text is required to parse');
      return;
    }
    setParseLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/services/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_payload: payload,
          // Images/announcements so setSlidePlan does not flicker photos away;
          // omit fields so hydrate overlays come from raw parse only.
          sermonGraphicUrl: sermonGraphicUrl || null,
          familyPhotoUrl: familyPhotoUrl || null,
          youthPhotoUrl: youthPhotoUrl || null,
          announcements: announcements.map((a) => ({
            image_url: a.image_url,
            is_recurring: a.is_recurring,
          })),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        plan?: SlidePreviewItem[];
        previewEntries?: PreviewEntry[];
        date?: string | null;
        failedHymnNumbers?: number[];
        fields?: unknown;
      };
      if (!res.ok) {
        throw new Error(data.error || t('form.error.parse'));
      }
      const hydrated = coerceHydrateFields(data.fields);
      if (hydrated) setFields(hydrated);
      setSlidePlan(data.plan || []);
      setPreviewEntries(
        Array.isArray(data.previewEntries) ? data.previewEntries : []
      );
      setDetectedDate(data.date || null);
      setFailedHymnNumbers(
        Array.isArray(data.failedHymnNumbers) ? data.failedHymnNumbers : []
      );
      if (data.date) {
        const collisionRes = await fetch(`/api/services?q=${data.date}`);
        if (collisionRes.ok) {
          const collData = (await collisionRes.json()) as {
            services?: Array<{ id: number; date: string }>;
          };
          const exactMatch = collData.services?.find(
            (r) => r.date === data.date
          );
          if (exactMatch) {
            setWarningCollision({ date: data.date, id: exactMatch.id });
          } else {
            setWarningCollision(null);
          }
        }
      } else {
        setWarningCollision(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('form.error.parse'));
    } finally {
      setParseLoading(false);
    }
  };

  const onSermonSpeakerChange = (nextSpeaker: string) => {
    setFields((prev) => {
      const prevSpeaker = prev.sermonSpeaker;
      const closing = prev.closingPrayerPerson;
      const shouldAutoFill =
        !closing.trim() || closing.trim() === prevSpeaker.trim();
      return {
        ...prev,
        sermonSpeaker: nextSpeaker,
        closingPrayerPerson: shouldAutoFill ? nextSpeaker : closing,
      };
    });
  };

  const resolveScripture = async () => {
    const ref = fields.verseReference;
    if (!ref.trim()) return;

    setError(null);
    try {
      const res = await fetch(
        `/api/scripture?ref=${encodeURIComponent(ref.trim())}`
      );
      const data = (await res.json()) as {
        error?: string;
        text?: string;
        translation?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || t('form.error.scripture'));
      }
      setFields((prev) => ({
        ...prev,
        verseText: data.text || '',
        verseTranslation: data.translation || prev.verseTranslation,
      }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('form.error.scripture'));
    }
  };

  const moveAnnouncement = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= announcements.length) return;
    const next = [...announcements];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);
    setAnnouncements(next);
  };

  const removeAnnouncement = (id: string) => {
    setAnnouncements(announcements.filter((ann) => ann.id !== id));
  };

  const addAnnouncementUrl = (url: string) => {
    if (!url.trim()) return;
    setAnnouncements([
      ...announcements,
      {
        id: `custom-${Date.now()}-${Math.random()}`,
        image_url: url.trim(),
        is_recurring: false,
      },
    ]);
  };

  const uploadAnnouncementFile = async (file: File) => {
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(data.error || t('form.error.upload'));
      setAnnouncements([
        ...announcements,
        {
          id: `upload-${Date.now()}-${Math.random()}`,
          image_url: data.url || '',
          is_recurring: false,
        },
      ]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Announcement upload failed'
      );
    }
  };

  const handleSave = async (allowSecond = false) => {
    if (!payload.trim()) {
      setError(t('form.error.requiredRundown'));
      return;
    }

    // A hymn input blurred by this very click may still be resolving its title
    // against /api/hymns; let it land before the payload is built.
    await flushPendingHymnCommits();

    const recurringCount = announcements.filter((a) => a.is_recurring).length;
    const initialMasterCount = initialAnnouncements.filter(
      (a) => a.service_id == null
    ).length;
    let clearMaster = false;
    if (recurringCount === 0 && initialMasterCount > 0) {
      const ok = window.confirm(t('form.clearMasterConfirm'));
      if (ok) clearMaster = true;
    }

    setIsSaving(true);
    setError(null);

    try {
      const bodyPayload: Record<string, unknown> = {
        raw_payload: payload,
        sermonGraphicUrl: sermonGraphicUrl.trim() || null,
        familyPhotoUrl: familyPhotoUrl.trim() || null,
        youthPhotoUrl: youthPhotoUrl.trim() || null,
        announcements: announcements.map((a) => ({
          image_url: a.image_url,
          is_recurring: a.is_recurring,
        })),
        fields: buildFieldsPayload(fieldsRef.current),
      };
      if (allowSecond) bodyPayload.allowSecond = true;
      if (clearMaster) bodyPayload.clearMaster = true;

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = (await res.json()) as {
        error?: string;
        date?: string;
        existingId?: number;
        id?: number;
        failedHymnNumbers?: number[];
      };

      if (res.status === 409) {
        if (data.date && data.existingId != null) {
          setWarningCollision({ date: data.date, id: data.existingId });
        }
        setError(data.error || t('form.collision.error'));
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || t('form.error.create'));
      }

      if (Array.isArray(data.failedHymnNumbers)) {
        setFailedHymnNumbers(data.failedHymnNumbers);
      }

      router.push(`/services/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('form.error.generic'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {warningCollision && (
        <div className={`${FORM_WARN_BANNER} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}>
          <div>
            <p className="text-sm font-bold">{t('form.collision.title')}</p>
            <p className={FORM_WARN_BANNER_BODY}>
              {t('form.collision.body').replace(
                '{date}',
                warningCollision.date
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/services/${warningCollision.id}`}
              className="text-xs px-3 py-1.5 rounded-lg border border-amber-800/40 bg-amber-500/20 hover:bg-amber-500/30 font-semibold transition-all"
            >
              {t('form.collision.openExisting')}
            </Link>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving || !payload.trim()}
              onClick={() => handleSave(true)}
              className="border-amber-800/40 bg-amber-500/20 text-xs hover:bg-amber-500/30"
            >
              {t('form.collision.createSecond')}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className={FORM_ERROR_BANNER} role="alert">
          {error}
        </div>
      )}

      {failedHymnNumbers.length > 0 && (
        <div className={FORM_WARN_BANNER}>
          <p className="font-semibold">{t('form.missingHymns.title')}</p>
          <p className={FORM_WARN_BANNER_BODY}>
            {t('form.missingHymns.body').replace(
              '{list}',
              failedHymnNumbers.map((n) => `SDAH ${n}`).join(', ')
            )}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12 items-start">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {t('form.create.title')}
              </CardTitle>
              <CardDescription>
                {t('form.create.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-semibold mb-2 block text-muted-foreground">
                  {t('form.rundown.label')}
                </label>
                <Textarea
                  className="h-72 font-mono text-xs"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder={t('form.rundown.placeholder')}
                  required
                  disabled={isSaving}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  {detectedDate ? (
                    <p className="text-xs text-primary font-semibold">
                      {t('form.detectedDate').replace('{date}', detectedDate)}
                    </p>
                  ) : (
                    <span />
                  )}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleParse()}
                    disabled={isSaving || parseLoading || !payload.trim()}
                  >
                    {parseLoading ? t('form.parsing') : t('form.parse')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.songSets.title')}
              </CardTitle>
              <CardDescription>
                {t('form.songSets.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {songSetEntries.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {t('form.songSets.empty')}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {songSetEntries.map((entry) => {
                    const current = fields.songSets[entry.variableName] || {
                      songNumber: '',
                      songBookCode: '',
                      background: '',
                      lyricText: '',
                    };
                    const isLyricOpen = !!openLyricEditors[entry.variableName];
                    const numVal = current.songNumber.trim();
                    const hasValidNum = /^\d+$/.test(numVal);
                    const isSavingBook = !!savingBookStatus[entry.variableName];
                    return (
                      <div key={entry.variableName} className="space-y-2 rounded-lg border border-border/40 p-3 bg-background/40">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                            {entry.title}
                          </label>
                          {hasValidNum ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="xs"
                              className="h-6 text-[11px] px-2 text-primary"
                              onClick={() => toggleLyricEditor(entry.variableName)}
                            >
                              {isLyricOpen ? t('form.songSets.hideLyrics') : t('form.songSets.editLyrics')}
                            </Button>
                          ) : null}
                        </div>
                        <HymnNumberAutocomplete
                          value={current.songNumber}
                          onChange={(v) =>
                            setSongSetField(entry.variableName, 'songNumber', v)
                          }
                          hymnIndex={hymnIndex}
                          placeholder={t('form.hymnPlaceholder')}
                          disabled={isSaving}
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-[10px] text-muted-foreground uppercase font-medium">
                            {t('form.songSets.background')}
                          </label>
                          <Select
                            value={current.background || 'default'}
                            onValueChange={(val) =>
                              setSongSetField(
                                entry.variableName,
                                'background',
                                val === 'default' ? '' : val
                              )
                            }
                            disabled={isSaving}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue placeholder={t('form.songSets.globalDefault')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="default">{t('form.songSets.globalDefault')}</SelectItem>
                              {backgroundLibrary.map((img) => (
                                <SelectItem key={img.id} value={img.url}>
                                  {img.url.split('/').pop() || `Image ${img.id}`} {img.isDefault ? `(${t('form.songSets.globalDefault')})` : ''}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {isLyricOpen ? (
                          <div className="mt-3 pt-2 border-t border-border/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-[11px] font-medium text-muted-foreground">
                                {t('form.songSets.lyricsLabel')}
                              </Label>
                            </div>
                            <Textarea
                              rows={6}
                              className="text-xs font-mono"
                              placeholder={t('form.songSets.lyricsPlaceholder')}
                              value={current.lyricText}
                              onChange={(e) =>
                                setSongSetField(entry.variableName, 'lyricText', e.target.value)
                              }
                              disabled={isSaving}
                            />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.bibleTalk.title')}
              </CardTitle>
              <CardDescription>
                {t('form.bibleTalk.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('form.verseRef')}
                    </label>
                    <Button
                      type="button"
                      variant="link"
                      size="xs"
                      className="h-auto p-0 text-[10px] font-bold"
                      onClick={() => resolveScripture()}
                    >
                      {t('form.resolve')}
                    </Button>
                  </div>
                  <ScriptureRefAutocomplete
                    value={fields.verseReference}
                    onChange={(v) => setField('verseReference', v)}
                    placeholder={t('form.scripturePlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {t('form.verseText')}
                  </label>
                  <Textarea
                    className="h-20 text-xs"
                    value={fields.verseText}
                    onChange={(e) => setField('verseText', e.target.value)}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.divineWorship.title')}
              </CardTitle>
              <CardDescription>
                {t('form.divineWorship.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {t('form.specialSong')}
                  </label>
                  <Input
                    type="text"
                    className="text-xs"
                    value={fields.specialSong}
                    onChange={(e) => setField('specialSong', e.target.value)}
                    placeholder={t('form.specialSongPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.sermon.title')}
              </CardTitle>
              <CardDescription>
                {t('form.sermon.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {t('form.sermonSpeaker')}
                  </label>
                  <Input
                    type="text"
                    className="text-xs"
                    value={fields.sermonSpeaker}
                    onChange={(e) => onSermonSpeakerChange(e.target.value)}
                    placeholder={t('form.sermonSpeakerPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {t('form.closingPrayer')}
                  </label>
                  <Input
                    type="text"
                    className="text-xs"
                    value={fields.closingPrayerPerson}
                    onChange={(e) =>
                      setField('closingPrayerPerson', e.target.value)
                    }
                    placeholder={t('form.closingPrayerPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <ImageUploadField
                label={t('form.sermonGraphic')}
                value={sermonGraphicUrl}
                onChange={setSermonGraphicUrl}
                previewAlt={t('form.sermonGraphicAlt')}
                uploadLabel={t('form.sermonGraphicUpload')}
                disabled={isSaving}
              />
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.family.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploadField
                label={t('form.familyPhoto')}
                value={familyPhotoUrl}
                onChange={setFamilyPhotoUrl}
                previewAlt={t('form.familyPhotoAlt')}
                uploadLabel={t('form.familyPhotoUpload')}
                disabled={isSaving}
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {t('form.familyPrayer')}
                  </label>
                  <Textarea
                    className="h-20 text-xs"
                    value={fields.familyPrayerRequest}
                    onChange={(e) =>
                      setField('familyPrayerRequest', e.target.value)
                    }
                    placeholder={t('form.familyPrayerPlaceholder')}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.youth.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ImageUploadField
                label={t('form.youthPhoto')}
                value={youthPhotoUrl}
                onChange={setYouthPhotoUrl}
                previewAlt={t('form.youthPhotoAlt')}
                uploadLabel={t('form.youthPhotoUpload')}
                disabled={isSaving}
              />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                    {t('form.youthPrayer')}
                  </label>
                  <Textarea
                    className="h-20 text-xs"
                    value={fields.youthPrayerRequest}
                    onChange={(e) =>
                      setField('youthPrayerRequest', e.target.value)
                    }
                    placeholder={t('form.youthPrayerPlaceholder')}
                  disabled={isSaving}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-lg font-bold">
                {t('form.flyers.title')}
              </CardTitle>
              <CardDescription>
                {t('form.flyers.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {announcements.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic text-center py-4">
                    {t('form.flyers.empty')}
                  </p>
                ) : (
                  announcements.map((ann, idx) => (
                    <div
                      key={ann.id}
                      className="flex items-center justify-between border border-border/50 bg-background/30 rounded-xl p-3 gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <a
                          href={ann.image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0 block h-12 w-16 border border-border/80 rounded-lg overflow-hidden bg-background"
                        >
                          <img
                            src={ann.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </a>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] break-all truncate text-muted-foreground">
                            {ann.image_url}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Label className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground cursor-pointer">
                              <Checkbox
                                checked={ann.is_recurring}
                                onCheckedChange={(checked) => {
                                  const next = [...announcements];
                                  next[idx] = {
                                    ...next[idx],
                                    is_recurring: checked === true,
                                  };
                                  setAnnouncements(next);
                                }}
                              />
                              {t('form.flyers.master')}
                            </Label>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          disabled={idx === 0}
                          onClick={() => moveAnnouncement(idx, -1)}
                          title={t('form.moveUp')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="size-3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
                            />
                          </svg>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-xs"
                          disabled={idx === announcements.length - 1}
                          onClick={() => moveAnnouncement(idx, 1)}
                          title={t('form.moveDown')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="size-3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3"
                            />
                          </svg>
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-xs"
                          onClick={() => removeAnnouncement(ann.id)}
                          title={t('form.remove')}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.5}
                            stroke="currentColor"
                            className="size-3"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                            />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-12 items-end pt-2 border-t border-border/40">
                <div className="sm:col-span-8">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                    {t('form.flyers.addUrl')}
                  </label>
                  <Input
                    type="text"
                    id="new-flyer-url-input"
                    className="text-xs"
                    placeholder="https://example.com/flyer.png"
                  />
                </div>
                <div className="sm:col-span-4 flex gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const input = document.getElementById(
                        'new-flyer-url-input'
                      ) as HTMLInputElement | null;
                      if (input && input.value.trim()) {
                        addAnnouncementUrl(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    {t('form.flyers.addUrlButton')}
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    id="flyer-upload-btn"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAnnouncementFile(file);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() =>
                      document.getElementById('flyer-upload-btn')?.click()
                    }
                  >
                    {t('form.flyers.upload')}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
                <span className="font-medium text-foreground/80">
                  {t('form.flyers.title')}:{' '}
                </span>
                {t('form.flyers.how')}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex justify-between items-center">
                <span>{t('form.preview.title')}</span>
                {previewLoading && (
                  <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-2 py-0.5 rounded-full animate-pulse">
                    {t('form.parsing')}
                  </span>
                )}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('form.preview.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-border/50">
              <div className="max-h-[600px] lg:max-h-[calc(100vh-14rem)] overflow-y-auto divide-y divide-border/60">
                <SlidePreviewList entries={previewEntries} slides={slidePlan} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border/80">
        <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'h-auto px-4 py-2')}>
          {t('form.cancel')}
        </Link>
        <Button
          onClick={() => handleSave(false)}
          disabled={isSaving || !payload.trim()}
        >
          {isSaving ? t('form.create.saving') : t('form.create.save')}
        </Button>
      </div>
    </div>
  );
}
