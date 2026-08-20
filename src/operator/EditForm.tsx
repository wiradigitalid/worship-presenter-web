import { useRouter } from '@/lib/navigation';
import Link from '@/components/Link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ParsedRundown } from '@/lib/parser';
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
import DeleteButton from '@/operator/DeleteButton';
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
  fieldsFromParsed,
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

function mapAnnouncements(
  list: AnnouncementSeed[]
): AnnouncementItemInput[] {
  return list.map((ann, idx) => ({
    id: `init-${idx}-${ann.id ?? idx}`,
    image_url: ann.image_url,
    is_recurring: ann.service_id == null,
  }));
}

/** Module-level so the default keeps a stable identity across renders. */
const EMPTY_HYMN_INDEX: HymnIndexEntry[] = [];

export default function EditForm({
  id,
  initialPayload,
  initialParsed = null,
  initialSermonGraphicUrl = '',
  initialFamilyPhotoUrl = '',
  initialYouthPhotoUrl = '',
  initialAnnouncements = [],
  flyerImages = [],
  usingLegacyFallback = false,
  initialUpdatedAt,
  hymnIndex = EMPTY_HYMN_INDEX,
}: {
  id: number;
  initialPayload: string;
  initialParsed?: ParsedRundown | null;
  initialSermonGraphicUrl?: string;
  initialFamilyPhotoUrl?: string;
  initialYouthPhotoUrl?: string;
  initialAnnouncements?: AnnouncementSeed[];
  /** Server-resolved URLs for legacy fallback when the editable list is empty. */
  flyerImages?: string[];
  usingLegacyFallback?: boolean;
  /** Accepted for page compat; edit no longer mutates participants_payload. */
  initialParticipantsRaw?: string;
  initialUpdatedAt: string;
  hymnIndex: HymnIndexEntry[];
}) {
  const router = useRouter();
  const { t } = useT();
  const [payload, setPayload] = useState(initialPayload);
  const [sermonGraphicUrl, setSermonGraphicUrl] = useState(
    initialSermonGraphicUrl
  );
  const [familyPhotoUrl, setFamilyPhotoUrl] = useState(initialFamilyPhotoUrl);
  const [youthPhotoUrl, setYouthPhotoUrl] = useState(initialYouthPhotoUrl);
  const [announcements, setAnnouncements] = useState<AnnouncementItemInput[]>(
    () => mapAnnouncements(initialAnnouncements)
  );

  const [fields, setFields] = useState<WorshipFormFields>(() =>
    fieldsFromParsed(initialParsed)
  );
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [isSaving, setIsSaving] = useState(false);
  const [parseLoading, setParseLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detectedDate, setDetectedDate] = useState<string | null>(null);
  const [slidePlan, setSlidePlan] = useState<SlidePreviewItem[]>([]);
  const [previewEntries, setPreviewEntries] = useState<PreviewEntry[]>([]);
  const [failedHymnNumbers, setFailedHymnNumbers] = useState<number[]>(
    () => initialParsed?.failedHymnNumbers ?? []
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewSeqRef = useRef(0);

  // Sync server props into local state (CAP-5 409 refresh path)
  useEffect(() => {
    setUpdatedAt(initialUpdatedAt);
  }, [initialUpdatedAt]);

  useEffect(() => {
    setPayload(initialPayload);
  }, [initialPayload]);

  useEffect(() => {
    setSermonGraphicUrl(initialSermonGraphicUrl);
  }, [initialSermonGraphicUrl]);

  useEffect(() => {
    setFamilyPhotoUrl(initialFamilyPhotoUrl);
  }, [initialFamilyPhotoUrl]);

  useEffect(() => {
    setYouthPhotoUrl(initialYouthPhotoUrl);
  }, [initialYouthPhotoUrl]);

  useEffect(() => {
    setAnnouncements(mapAnnouncements(initialAnnouncements));
  }, [initialAnnouncements]);

  useEffect(() => {
    setFields(fieldsFromParsed(initialParsed));
  }, [initialParsed]);

  // CAP-5 live preview whenever payload is non-empty (create-parity; not gated)
  useEffect(() => {
    if (!payload.trim()) {
      setDetectedDate(null);
      setSlidePlan([]);
      setPreviewEntries([]);
      setFailedHymnNumbers([]);
      setPreviewLoading(false);
      return;
    }

    const controller = new AbortController();
    const seq = ++previewSeqRef.current;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
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
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        console.error('Preview error:', err);
        if (seq === previewSeqRef.current) {
          setSlidePlan([]);
          setPreviewEntries([]);
          setDetectedDate(null);
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

  const removeAnnouncement = (annId: string) => {
    setAnnouncements(announcements.filter((ann) => ann.id !== annId));
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

  const resetFromProps = () => {
    setPayload(initialPayload);
    setSermonGraphicUrl(initialSermonGraphicUrl);
    setFamilyPhotoUrl(initialFamilyPhotoUrl);
    setYouthPhotoUrl(initialYouthPhotoUrl);
    setAnnouncements(mapAnnouncements(initialAnnouncements));
    setFields(fieldsFromParsed(initialParsed));
    setUpdatedAt(initialUpdatedAt);
    setError(null);
  };

  // Live carousel from form state (avoids stale flyerImages after edit/save).
  // Legacy-only services: empty editable list + server-resolved flyerImages.
  const carouselImages =
    announcements.length > 0 || !usingLegacyFallback
      ? announcements
          .map((a) => a.image_url)
          .filter((url) => Boolean(url.trim()))
      : flyerImages;

  const handleSave = async () => {
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
      const res = await fetch(`/api/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updated_at: updatedAt,
          raw_payload: payload,
          sermonGraphicUrl: sermonGraphicUrl.trim() || null,
          familyPhotoUrl: familyPhotoUrl.trim() || null,
          youthPhotoUrl: youthPhotoUrl.trim() || null,
          clearMaster: clearMaster || undefined,
          announcements: announcements.map((a) => ({
            image_url: a.image_url,
            is_recurring: a.is_recurring,
          })),
          fields: buildFieldsPayload(fieldsRef.current),
        }),
      });

      if (res.status === 409) {
        alert(
          'This service was changed elsewhere. Refreshing form from the server.'
        );
        router.refresh();
        return;
      }

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error || t('form.error.update'));
      }

      const data = (await res.json()) as { updated_at?: string };
      if (data.updated_at) setUpdatedAt(data.updated_at);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('form.error.update'));
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
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
              <CardTitle>{t('form.flyers.title')}</CardTitle>
              <CardDescription>
                {carouselImages.length === 0
                  ? t('form.flyers.editEmpty')
                  : usingLegacyFallback && announcements.length === 0
                    ? t('form.flyers.editLegacy')
                    : carouselImages.length === 1
                      ? t('form.flyers.editCountOne')
                      : t('form.flyers.editCount').replace(
                          '{n}',
                          String(carouselImages.length)
                        )}{' '}
                <Link
                  href="/announcements"
                  className="text-primary hover:underline"
                >
                  {t('form.flyers.manage')}
                </Link>
              </CardDescription>
            </CardHeader>
            {carouselImages.length > 0 && (
              <CardContent>
                <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth">
                  {carouselImages.map((img, i) => (
                    <a
                      key={`${img}-${i}`}
                      href={img}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 snap-start group relative block h-32 w-auto max-w-[200px] border rounded overflow-hidden"
                    >
                      <img
                        src={img}
                        alt={t('announcements.alt').replace('{n}', String(i + 1))}
                        className="h-full w-auto object-cover group-hover:scale-105 transition-transform"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>

          <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="text-xl font-bold">
                {t('form.edit.title')}
              </CardTitle>
              <CardDescription>
                {t('form.edit.description')}
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
                  <button
                    type="button"
                    onClick={() => void handleParse()}
                    disabled={isSaving || parseLoading || !payload.trim()}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none cursor-pointer shrink-0"
                  >
                    {parseLoading ? t('form.parsing') : t('form.parse')}
                  </button>
                </div>
              </div>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      {t('form.openingSong')}
                  </label>
                  <HymnNumberAutocomplete
                    value={fields.song1Number}
                    onChange={(v) => setField('song1Number', v)}
                    hymnIndex={hymnIndex}
                    placeholder={t('form.hymnPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      {t('form.closingSong')}
                  </label>
                  <HymnNumberAutocomplete
                    value={fields.song2Number}
                    onChange={(v) => setField('song2Number', v)}
                    hymnIndex={hymnIndex}
                    placeholder={t('form.hymnPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('form.verseRef')}
                    </label>
                    <button
                      type="button"
                      onClick={() => resolveScripture()}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      {t('form.resolve')}
                    </button>
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      {t('form.openingSong')}
                  </label>
                  <HymnNumberAutocomplete
                    value={fields.song3Number}
                    onChange={(v) => setField('song3Number', v)}
                    hymnIndex={hymnIndex}
                    placeholder={t('form.hymnPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">
                      {t('form.closingSong')}
                  </label>
                  <HymnNumberAutocomplete
                    value={fields.song4Number}
                    onChange={(v) => setField('song4Number', v)}
                    hymnIndex={hymnIndex}
                    placeholder={t('form.hymnPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <div className="sm:col-span-2">
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
                            <label className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">
                              <input
                                type="checkbox"
                                checked={ann.is_recurring}
                                onChange={(e) => {
                                  const next = [...announcements];
                                  next[idx] = {
                                    ...next[idx],
                                    is_recurring: e.target.checked,
                                  };
                                  setAnnouncements(next);
                                }}
                                className="size-3 rounded border-border text-primary focus:ring-0 cursor-pointer"
                              />
                              {t('form.flyers.master')}
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveAnnouncement(idx, -1)}
                          className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 cursor-pointer text-muted-foreground"
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
                        </button>
                        <button
                          type="button"
                          disabled={idx === announcements.length - 1}
                          onClick={() => moveAnnouncement(idx, 1)}
                          className="p-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 cursor-pointer text-muted-foreground"
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
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAnnouncement(ann.id)}
                          className="p-1 text-red-500 rounded hover:bg-red-500/10 cursor-pointer"
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
                        </button>
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
                    id="edit-flyer-url-input"
                    className="text-xs"
                    placeholder="https://example.com/flyer.png"
                  />
                </div>
                <div className="sm:col-span-4 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById(
                        'edit-flyer-url-input'
                      ) as HTMLInputElement | null;
                      if (input && input.value.trim()) {
                        addAnnouncementUrl(input.value);
                        input.value = '';
                      }
                    }}
                    className="flex-1 text-center py-2 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                  >
                    {t('form.flyers.addUrlButton')}
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    id="flyer-upload-edit-btn"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadAnnouncementFile(file);
                      e.target.value = '';
                    }}
                  />
                  <label
                    htmlFor="flyer-upload-edit-btn"
                    className="flex-1 flex items-center justify-center cursor-pointer text-center py-2 text-xs font-semibold bg-primary/10 border border-primary/20 text-primary rounded-lg hover:bg-primary/20 transition-all"
                  >
                    {t('form.flyers.upload')}
                  </label>
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

      <div className="flex justify-between gap-3 pt-4 border-t border-border/80">
        <DeleteButton id={id} updatedAt={updatedAt} />
        <div className="flex gap-3">
        <Button variant="outline" onClick={resetFromProps} disabled={isSaving}>
          {t('form.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? t('form.edit.saving') : t('form.edit.save')}
        </Button>
        </div>
      </div>
    </div>
  );
}
