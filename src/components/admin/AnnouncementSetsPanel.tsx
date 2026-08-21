import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useT } from '@/lib/i18n/operator';
import ArtifactEditor from './ArtifactEditor';
import {
  createAnnouncementSetAdapter,
  CopiedSlide,
} from '@/lib/registry/canvas-adapters';

export interface AnnouncementSet {
  id: number;
  label: string;
  slideCount: number;
  updatedAt: string;
}

export interface AnnouncementSlide {
  id: number;
  annSetId: number;
  label: string;
  position: number;
  updatedAt: string;
  resettable: boolean;
}

export interface SpineMarker {
  id: string;
  label: string;
  baseType: string;
  updatedAt: string;
  annSetId?: number;
  position?: number;
}

export interface AnnouncementSetsPanelProps {
  copiedSlidePayload?: CopiedSlide | null;
  onCopySlidePayloadChange?: (slide: CopiedSlide | null) => void;
}

export function AnnouncementSetsPanel({
  copiedSlidePayload,
  onCopySlidePayloadChange,
}: AnnouncementSetsPanelProps = {}) {
  const { t } = useT();

  const [sets, setSets] = useState<AnnouncementSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSetId, setSelectedSetId] = useState<number | null>(null);

  // Active canvas editing slide (opens inline below slide list)
  const [editingCanvasSlideId, setEditingCanvasSlideId] = useState<number | null>(null);

  // Markers state (all ann-set-marker rows on spine)
  const [markers, setMarkers] = useState<SpineMarker[]>([]);
  const [addingMarker, setAddingMarker] = useState(false);
  const [removingMarkerId, setRemovingMarkerId] = useState<string | null>(null);

  // New set form
  const [newSetLabel, setNewSetLabel] = useState('');
  const [creatingSet, setCreatingSet] = useState(false);
  const [setLabelError, setSetLabelError] = useState<string | null>(null);

  // Rename set state
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editSetLabel, setEditSetLabel] = useState('');
  const [editSetError, setEditSetError] = useState<string | null>(null);
  const [renamingSet, setRenamingSet] = useState(false);
  const [deletingSetId, setDeletingSetId] = useState<number | null>(null);

  // Slides state for selected set
  const [slides, setSlides] = useState<AnnouncementSlide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(false);
  const [newSlideLabel, setNewSlideLabel] = useState('');
  const [creatingSlide, setCreatingSlide] = useState(false);
  const [slideLabelError, setSlideLabelError] = useState<string | null>(null);

  // Rename slide state
  const [editingSlideId, setEditingSlideId] = useState<number | null>(null);
  const [editSlideLabel, setEditSlideLabel] = useState('');
  const [editSlideError, setEditSlideError] = useState<string | null>(null);
  const [renamingSlide, setRenamingSlide] = useState(false);
  const [deletingSlideId, setDeletingSlideId] = useState<number | null>(null);
  const [resettingSlideId, setResettingSlideId] = useState<number | null>(null);
  const [reorderingSlides, setReorderingSlides] = useState(false);

  const fetchSets = async () => {
    try {
      const res = await fetch('/api/admin/announcement-sets', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load sets');
      const data = (await res.json()) as { sets: AnnouncementSet[] };
      const loadedSets = data.sets ?? [];
      setSets(loadedSets);
      if (selectedSetId === null && loadedSets.length > 0) {
        setSelectedSetId(loadedSets[0].id);
      }
    } catch {
      toast.error(t('admin.annSets.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const fetchMarkers = async () => {
    try {
      const res = await fetch('/api/admin/artifacts', { credentials: 'same-origin' });
      if (!res.ok) return;
      const data = (await res.json()) as { templates: Array<{ id: string; baseType: string; label: string; updatedAt: string }> };
      const templates = data.templates ?? [];
      const markerSummaries = templates
        .map((tmpl, idx) => ({ ...tmpl, position: idx }))
        .filter((tmpl) => tmpl.baseType === 'ann-set-marker');

      // Fetch detail for each marker to get annSetId
      const markerDetails = await Promise.all(
        markerSummaries.map(async (m) => {
          try {
            const dRes = await fetch(`/api/admin/artifacts/${m.id}`, { credentials: 'same-origin' });
            if (!dRes.ok) return m;
            const dJson = (await dRes.json()) as { annSetId?: number };
            return { ...m, annSetId: dJson.annSetId };
          } catch {
            return m;
          }
        })
      );
      setMarkers(markerDetails);
    } catch {
      // ignore
    }
  };

  const fetchSlides = async (setId: number) => {
    setLoadingSlides(true);
    try {
      const res = await fetch(`/api/admin/announcement-sets/${setId}/slides`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load slides');
      const data = (await res.json()) as { slides: AnnouncementSlide[] };
      setSlides(data.slides ?? []);
    } catch {
      toast.error(t('admin.annSets.loadFailed'));
    } finally {
      setLoadingSlides(false);
    }
  };

  useEffect(() => {
    void fetchSets();
    void fetchMarkers();
  }, []);

  useEffect(() => {
    if (selectedSetId !== null) {
      void fetchSlides(selectedSetId);
    } else {
      setSlides([]);
    }
  }, [selectedSetId]);

  const selectedSet = sets.find((s) => s.id === selectedSetId);
  const referencingMarkersForSelected = selectedSet
    ? markers.filter((m) => m.annSetId === selectedSet.id)
    : [];

  const handleCreateSet = async (e: React.FormEvent) => {
    e.preventDefault();
    const label = newSetLabel.trim();
    if (!label || label.length > 80) {
      setSetLabelError(t('admin.annSets.labelInvalid'));
      return;
    }
    setSetLabelError(null);
    setCreatingSet(true);

    try {
      const res = await fetch('/api/admin/announcement-sets', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });
      if (res.status === 409) {
        toast.error(t('admin.annSets.createConflict'));
        return;
      }
      if (!res.ok) {
        toast.error(t('admin.annSets.createFailed'));
        return;
      }
      const created = (await res.json()) as AnnouncementSet;
      setSets((prev) => [...prev, created]);
      setSelectedSetId(created.id);
      setNewSetLabel('');
      toast.success(t('admin.annSets.created').replace('{label}', created.label));
    } catch {
      toast.error(t('admin.annSets.createFailed'));
    } finally {
      setCreatingSet(false);
    }
  };

  const startRenameSet = (set: AnnouncementSet) => {
    setEditingSetId(set.id);
    setEditSetLabel(set.label);
    setEditSetError(null);
  };

  const cancelRenameSet = () => {
    setEditingSetId(null);
    setEditSetLabel('');
    setEditSetError(null);
  };

  const handleSaveRenameSet = async (set: AnnouncementSet) => {
    const label = editSetLabel.trim();
    if (!label || label.length > 80) {
      setEditSetError(t('admin.annSets.labelInvalid'));
      return;
    }
    setRenamingSet(true);
    try {
      const res = await fetch(`/api/admin/announcement-sets/${set.id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          updatedAt: set.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.annSets.staleConflict'));
        void fetchSets();
        cancelRenameSet();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.annSets.renameFailed'));
        return;
      }

      const updated = (await res.json()) as AnnouncementSet;
      setSets((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(t('admin.annSets.renamed').replace('{label}', updated.label));
      cancelRenameSet();
    } catch {
      toast.error(t('admin.annSets.renameFailed'));
    } finally {
      setRenamingSet(false);
    }
  };

  const handleDeleteSet = async (set: AnnouncementSet) => {
    const referencingMarkers = markers.filter((m) => m.annSetId === set.id);
    if (referencingMarkers.length > 0) {
      toast.error(
        t('admin.annSets.deleteRefusedHasMarkers').replace(
          '{count}',
          String(referencingMarkers.length)
        )
      );
      return;
    }

    const ok = window.confirm(
      t('admin.annSets.confirmDelete').replace('{label}', set.label)
    );
    if (!ok) return;

    setDeletingSetId(set.id);
    try {
      const res = await fetch(`/api/admin/announcement-sets/${set.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: set.updatedAt,
        }),
      });

      if (res.status === 409) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(errorData.error || t('admin.annSets.staleConflict'));
        void fetchSets();
        void fetchMarkers();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.annSets.deleteFailed'));
        return;
      }

      setSets((prev) => {
        const next = prev.filter((s) => s.id !== set.id);
        if (selectedSetId === set.id) {
          setSelectedSetId(next.length > 0 ? next[0].id : null);
        }
        return next;
      });
      toast.success(t('admin.annSets.deleted').replace('{label}', set.label));
    } catch {
      toast.error(t('admin.annSets.deleteFailed'));
    } finally {
      setDeletingSetId(null);
    }
  };

  const handleAddMarker = async () => {
    if (!selectedSet) return;
    setAddingMarker(true);
    try {
      const markerLabel = selectedSet.label;
      const res = await fetch('/api/admin/artifacts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: markerLabel,
          baseType: 'ann-set-marker',
          annSetId: selectedSet.id,
        }),
      });

      if (!res.ok) {
        toast.error(t('admin.annSets.addMarkerFailed'));
        return;
      }

      toast.success(t('admin.annSets.addedMarker').replace('{label}', markerLabel));
      void fetchMarkers();
    } catch {
      toast.error(t('admin.annSets.addMarkerFailed'));
    } finally {
      setAddingMarker(false);
    }
  };

  const handleRemoveMarker = async (marker: SpineMarker) => {
    const ok = window.confirm(
      t('admin.annSets.confirmRemoveMarker').replace('{label}', marker.label)
    );
    if (!ok) return;

    setRemovingMarkerId(marker.id);
    try {
      const res = await fetch(`/api/admin/artifacts/${encodeURIComponent(marker.id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: marker.updatedAt,
        }),
      });

      if (!res.ok) {
        toast.error(t('admin.annSets.removeMarkerFailed'));
        return;
      }

      toast.success(t('admin.annSets.removedMarker'));
      void fetchMarkers();
    } catch {
      toast.error(t('admin.annSets.removeMarkerFailed'));
    } finally {
      setRemovingMarkerId(null);
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSet) return;
    const label = newSlideLabel.trim();
    if (!label || label.length > 80) {
      setSlideLabelError(t('admin.annSets.slideLabelHint'));
      return;
    }
    setSlideLabelError(null);
    setCreatingSlide(true);

    try {
      const res = await fetch(`/api/admin/announcement-sets/${selectedSet.id}/slides`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label }),
      });

      if (!res.ok) {
        toast.error(t('admin.annSets.slideAddFailed'));
        return;
      }

      const created = (await res.json()) as AnnouncementSlide;
      setSlides((prev) => [...prev, created].sort((a, b) => a.position - b.position));
      setNewSlideLabel('');
      toast.success(t('admin.annSets.slideAdded').replace('{label}', created.label));
      // Increment slideCount locally on set
      setSets((prev) =>
        prev.map((s) => (s.id === selectedSet.id ? { ...s, slideCount: s.slideCount + 1 } : s))
      );
    } catch {
      toast.error(t('admin.annSets.slideAddFailed'));
    } finally {
      setCreatingSlide(false);
    }
  };

  const startRenameSlide = (slide: AnnouncementSlide) => {
    setEditingSlideId(slide.id);
    setEditSlideLabel(slide.label);
    setEditSlideError(null);
  };

  const cancelRenameSlide = () => {
    setEditingSlideId(null);
    setEditSlideLabel('');
    setEditSlideError(null);
  };

  const handleSaveRenameSlide = async (slide: AnnouncementSlide) => {
    if (!selectedSet) return;
    const label = editSlideLabel.trim();
    if (!label || label.length > 80) {
      setEditSlideError(t('admin.annSets.slideLabelHint'));
      return;
    }

    setRenamingSlide(true);
    try {
      const res = await fetch(`/api/admin/announcement-sets/${selectedSet.id}/slides/${slide.id}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label,
          updatedAt: slide.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.annSets.staleConflict'));
        void fetchSlides(selectedSet.id);
        cancelRenameSlide();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.annSets.slideRenameFailed'));
        return;
      }

      const updated = (await res.json()) as AnnouncementSlide;
      setSlides((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      toast.success(t('admin.annSets.slideRenamed').replace('{label}', updated.label));
      cancelRenameSlide();
    } catch {
      toast.error(t('admin.annSets.slideRenameFailed'));
    } finally {
      setRenamingSlide(false);
    }
  };

  const handleDeleteSlide = async (slide: AnnouncementSlide) => {
    if (!selectedSet) return;
    const ok = window.confirm(
      t('admin.annSets.confirmDeleteSlide').replace('{label}', slide.label)
    );
    if (!ok) return;

    setDeletingSlideId(slide.id);
    try {
      const res = await fetch(`/api/admin/announcement-sets/${selectedSet.id}/slides/${slide.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: slide.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.annSets.staleConflict'));
        void fetchSlides(selectedSet.id);
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.annSets.slideDeleteFailed'));
        return;
      }

      toast.success(t('admin.annSets.slideDeleted'));
      // Server compacts position; re-read list as specified in brief
      void fetchSlides(selectedSet.id);
      setSets((prev) =>
        prev.map((s) =>
          s.id === selectedSet.id ? { ...s, slideCount: Math.max(0, s.slideCount - 1) } : s
        )
      );
    } catch {
      toast.error(t('admin.annSets.slideDeleteFailed'));
    } finally {
      setDeletingSlideId(null);
    }
  };

  const handleResetSlide = async (slide: AnnouncementSlide) => {
    if (!selectedSet) return;
    const ok = window.confirm(
      t('admin.annSets.confirmResetSlide').replace('{label}', slide.label)
    );
    if (!ok) return;

    setResettingSlideId(slide.id);
    try {
      const res = await fetch(
        `/api/admin/announcement-sets/${selectedSet.id}/slides/${slide.id}/reset`,
        {
          method: 'POST',
          credentials: 'same-origin',
        }
      );

      if (!res.ok) {
        toast.error(t('admin.annSets.slideResetFailed'));
        return;
      }

      toast.success(t('admin.annSets.slideResetDone'));
      void fetchSlides(selectedSet.id);
    } catch {
      toast.error(t('admin.annSets.slideResetFailed'));
    } finally {
      setResettingSlideId(null);
    }
  };

  const handleMoveSlide = async (slide: AnnouncementSlide, direction: -1 | 1) => {
    if (!selectedSet) return;
    const index = slides.findIndex((s) => s.id === slide.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= slides.length) return;

    const desired = [...slides];
    [desired[index], desired[target]] = [desired[target], desired[index]];

    setReorderingSlides(true);
    try {
      const res = await fetch(`/api/admin/announcement-sets/${selectedSet.id}/slides/order`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: desired.map(({ id, updatedAt }) => ({ id, updatedAt })),
        }),
      });

      if (res.status === 400 || res.status === 409) {
        toast.error(t('admin.annSets.slideReorderConflict'));
        void fetchSlides(selectedSet.id);
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.annSets.slideReorderFailed'));
        return;
      }

      const data = (await res.json()) as { slides: AnnouncementSlide[] };
      setSlides(data.slides ?? desired);
      toast.success(t('admin.annSets.slideReorderSaved'));
    } catch {
      toast.error(t('admin.annSets.slideReorderFailed'));
    } finally {
      setReorderingSlides(false);
    }
  };

  const announcementSetAdapter = useMemo(() => {
    if (selectedSetId === null) return null;
    return createAnnouncementSetAdapter(selectedSetId);
  }, [selectedSetId]);

  return (
    <div className="space-y-6">
      {/* Create new set */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.annSets.title')}</CardTitle>
          <CardDescription>{t('admin.annSets.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateSet} className="space-y-4">
            <h3 className="text-sm font-semibold">{t('admin.annSets.createTitle')}</h3>
            <div className="space-y-1.5 max-w-md">
              <Label htmlFor="ann-set-label">{t('admin.annSets.label')}</Label>
              <div className="flex gap-2">
                <Input
                  id="ann-set-label"
                  placeholder="e.g. Break Time Announcements"
                  value={newSetLabel}
                  disabled={creatingSet}
                  onChange={(e) => {
                    setNewSetLabel(e.target.value);
                    if (setLabelError) setSetLabelError(null);
                  }}
                  className="flex-1"
                />
                <Button type="submit" disabled={creatingSet}>
                  {creatingSet ? t('admin.annSets.adding') : t('admin.annSets.add')}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{t('admin.annSets.labelHint')}</p>
              {setLabelError ? (
                <p role="alert" className="text-xs font-medium text-destructive">
                  {setLabelError}
                </p>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Grid: Set List on Left / Detail on Right */}
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Sets List */}
        <aside className="min-w-0 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">{t('admin.annSets.title')}</h2>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground rounded-2xl border border-border bg-card/60">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              <span>Loading…</span>
            </div>
          ) : sets.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card/60 p-4 text-sm text-muted-foreground">
              {t('admin.annSets.empty')}
            </div>
          ) : (
            <div className="space-y-2">
              {sets.map((set) => {
                const isSelected = selectedSetId === set.id;
                const isEditing = editingSetId === set.id;
                const isDeleting = deletingSetId === set.id;
                const setReferencingMarkers = markers.filter((m) => m.annSetId === set.id);
                const hasReferencingMarkers = setReferencingMarkers.length > 0;

                return (
                  <div
                    key={set.id}
                    onClick={() => {
                      if (!isEditing) setSelectedSetId(set.id);
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border bg-card/60 hover:bg-muted/60'
                    }`}
                  >
                    {isEditing ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Input
                          value={editSetLabel}
                          disabled={renamingSet}
                          onChange={(e) => {
                            setEditSetLabel(e.target.value);
                            if (editSetError) setEditSetError(null);
                          }}
                          className="text-sm"
                        />
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={renamingSet}
                            onClick={() => void handleSaveRenameSet(set)}
                          >
                            {renamingSet ? t('admin.annSets.renaming') : t('admin.annSets.save')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={renamingSet}
                            onClick={cancelRenameSet}
                          >
                            {t('admin.annSets.cancel')}
                          </Button>
                        </div>
                        {editSetError ? (
                          <p role="alert" className="text-xs font-medium text-destructive">
                            {editSetError}
                          </p>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-medium text-sm text-foreground leading-tight">
                            {set.label}
                          </span>
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            {set.slideCount === 1
                              ? t('admin.annSets.slidesCountOne')
                              : t('admin.annSets.slidesCount').replace('{count}', String(set.slideCount))}
                          </Badge>
                        </div>

                        {hasReferencingMarkers ? (
                          <p className="text-xs text-amber-600 dark:text-amber-400">
                            {t('admin.annSets.deleteRefusedHasMarkers').replace(
                              '{count}',
                              String(setReferencingMarkers.length)
                            )}
                          </p>
                        ) : null}

                        <div
                          className="flex items-center justify-end gap-1.5 pt-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => startRenameSet(set)}
                          >
                            {t('admin.annSets.rename')}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting || hasReferencingMarkers}
                            title={
                              hasReferencingMarkers
                                ? t('admin.annSets.deleteRefusedHasMarkers').replace(
                                    '{count}',
                                    String(setReferencingMarkers.length)
                                  )
                                : undefined
                            }
                            onClick={() => void handleDeleteSet(set)}
                          >
                            {isDeleting ? t('admin.annSets.deleting') : t('admin.annSets.delete')}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Set Detail / Slides / Markers */}
        <section className="min-w-0 space-y-6">
          {!selectedSet ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
              {t('admin.annSets.empty')}
            </div>
          ) : (
            <>
              {/* Spine Markers for this set */}
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">
                        {t('admin.annSets.markersSectionTitle')}
                      </CardTitle>
                      <CardDescription>
                        {t('admin.annSets.markersSectionDesc')}
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={addingMarker}
                      onClick={() => void handleAddMarker()}
                    >
                      <Plus className="h-4 w-4 mr-1.5" />
                      {addingMarker ? t('admin.annSets.addingMarker') : t('admin.annSets.addMarker')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground italic">
                    {t('admin.annSets.markerStructuralNote')}
                  </p>

                  {referencingMarkersForSelected.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('admin.annSets.markersNone')}</p>
                  ) : (
                    <div className="divide-y divide-border rounded-xl border border-border">
                      {referencingMarkersForSelected.map((marker) => {
                        const isRemoving = removingMarkerId === marker.id;
                        return (
                          <div
                            key={marker.id}
                            className="flex items-center justify-between p-3 text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Badge variant="outline" className="font-mono text-xs">
                                marker
                              </Badge>
                              <span className="font-medium text-foreground truncate">
                                {marker.label}
                              </span>
                              {marker.position !== undefined ? (
                                <span className="text-xs text-muted-foreground">
                                  (pos: {marker.position})
                                </span>
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              disabled={isRemoving}
                              onClick={() => void handleRemoveMarker(marker)}
                            >
                              {isRemoving
                                ? t('admin.annSets.removingMarker')
                                : t('admin.annSets.removeMarker')}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Slides in this set */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('admin.annSets.slidesTitle')}</CardTitle>
                  <CardDescription>{t('admin.annSets.slidesDesc')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Add slide form */}
                  <form onSubmit={handleAddSlide} className="flex gap-2 max-w-md">
                    <Input
                      placeholder="e.g. Offering & Tithe"
                      value={newSlideLabel}
                      disabled={creatingSlide}
                      onChange={(e) => {
                        setNewSlideLabel(e.target.value);
                        if (slideLabelError) setSlideLabelError(null);
                      }}
                      className="flex-1"
                    />
                    <Button type="submit" disabled={creatingSlide}>
                      {creatingSlide ? t('admin.annSets.addingSlide') : t('admin.annSets.addSlide')}
                    </Button>
                  </form>
                  {slideLabelError ? (
                    <p role="alert" className="text-xs font-medium text-destructive">
                      {slideLabelError}
                    </p>
                  ) : null}

                  {/* Slide List */}
                  {loadingSlides ? (
                    <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
                      <span>Loading slides…</span>
                    </div>
                  ) : slides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{t('admin.annSets.slidesEmpty')}</p>
                  ) : (
                    <div className="divide-y divide-border rounded-xl border border-border">
                      {slides.map((slide, index) => {
                        const isEditing = editingSlideId === slide.id;
                        const isDeleting = deletingSlideId === slide.id;
                        const isResetting = resettingSlideId === slide.id;

                        return (
                          <div
                            key={slide.id}
                            className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0 flex-1">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editSlideLabel}
                                    disabled={renamingSlide}
                                    onChange={(e) => {
                                      setEditSlideLabel(e.target.value);
                                      if (editSlideError) setEditSlideError(null);
                                    }}
                                    className="text-sm max-w-md"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={renamingSlide}
                                      onClick={() => void handleSaveRenameSlide(slide)}
                                    >
                                      {renamingSlide
                                        ? t('admin.annSets.renaming')
                                        : t('admin.annSets.save')}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      disabled={renamingSlide}
                                      onClick={cancelRenameSlide}
                                    >
                                      {t('admin.annSets.cancel')}
                                    </Button>
                                  </div>
                                  {editSlideError ? (
                                    <p role="alert" className="text-xs font-medium text-destructive">
                                      {editSlideError}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-muted-foreground w-6 text-right">
                                    #{index + 1}
                                  </span>
                                  <span className="font-medium text-foreground text-sm">
                                    {slide.label}
                                  </span>
                                </div>
                              )}
                            </div>

                            {!isEditing ? (
                              <div className="flex shrink-0 items-center gap-1.5 flex-wrap">
                                {/* Edit canvas button */}
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingCanvasSlideId(slide.id);
                                  }}
                                  title={t('admin.annSets.editCanvas')}
                                >
                                  {t('admin.annSets.editCanvas')}
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  disabled={isDeleting || isResetting}
                                  onClick={() => startRenameSlide(slide)}
                                >
                                  {t('admin.annSets.rename')}
                                </Button>

                                {slide.resettable ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isResetting || isDeleting}
                                    onClick={() => void handleResetSlide(slide)}
                                  >
                                    {isResetting
                                      ? t('admin.annSets.slideResetting')
                                      : t('admin.annSets.slideReset')}
                                  </Button>
                                ) : null}

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={t('admin.annSets.slideMoveUp')}
                                  title={t('admin.annSets.slideMoveUp')}
                                  disabled={reorderingSlides || index === 0}
                                  onClick={() => void handleMoveSlide(slide, -1)}
                                >
                                  <ArrowUp className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon-sm"
                                  aria-label={t('admin.annSets.slideMoveDown')}
                                  title={t('admin.annSets.slideMoveDown')}
                                  disabled={reorderingSlides || index === slides.length - 1}
                                  onClick={() => void handleMoveSlide(slide, 1)}
                                >
                                  <ArrowDown className="h-4 w-4" />
                                </Button>

                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="sm"
                                  disabled={isDeleting || isResetting}
                                  onClick={() => void handleDeleteSlide(slide)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Inline Canvas Editor for selected Announcement Slide */}
              {selectedSet && announcementSetAdapter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t('admin.annSets.canvasEditorTitle')}
                    </CardTitle>
                    <CardDescription>
                      {t('admin.annSets.canvasEditorDesc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ArtifactEditor
                      key={`ann-set-${selectedSet.id}-editor`}
                      adapter={announcementSetAdapter}
                      initialSelectedId={
                        editingCanvasSlideId !== null ? String(editingCanvasSlideId) : null
                      }
                      copiedSlidePayload={copiedSlidePayload}
                      onCopySlidePayloadChange={onCopySlidePayloadChange}
                    />
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

export default AnnouncementSetsPanel;
