import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useT } from '@/lib/i18n/operator';
import ArtifactEditor from '@/components/admin/ArtifactEditor';
import { createSongSetTrioAdapter } from '@/lib/registry/canvas-adapters';

export interface SongSetEntry {
  variableName: string;
  title: string;
  position: number;
  updatedAt: string;
}

const VARIABLE_NAME_REGEX = /^[a-z][a-z0-9_-]{0,79}$/;

type SongSetLayoutRole = 'title' | 'verse' | 'reff';

export function SongSetEntriesPanel() {
  const { t } = useT();

  const [entries, setEntries] = useState<SongSetEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // New entry form state
  const [newVariableName, setNewVariableName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [varNameError, setVarNameError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Rename modal/inline state
  const [editingVarName, setEditingVarName] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editTitleError, setEditTitleError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  // Delete state
  const [deletingVarName, setDeletingVarName] = useState<string | null>(null);

  // Layout trio active role
  const [selectedRole, setSelectedRole] = useState<SongSetLayoutRole>('title');

  const songSetAdapter = useMemo(() => createSongSetTrioAdapter(), []);

  const fetchEntries = async () => {
    try {
      const res = await fetch('/api/admin/song-set-entries', { credentials: 'same-origin' });
      if (!res.ok) {
        throw new Error('Failed to load');
      }
      const data = (await res.json()) as { entries: SongSetEntry[] };
      setEntries(data.entries ?? []);
    } catch {
      toast.error(t('admin.songSets.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEntries();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedVar = newVariableName.trim();
    const trimmedTitle = newTitle.trim();

    let hasError = false;
    if (!trimmedVar || !VARIABLE_NAME_REGEX.test(trimmedVar)) {
      setVarNameError(t('admin.songSets.variableNameInvalid'));
      hasError = true;
    } else {
      setVarNameError(null);
    }

    if (!trimmedTitle || trimmedTitle.length > 120) {
      setTitleError(t('admin.songSets.titleInvalid'));
      hasError = true;
    } else {
      setTitleError(null);
    }

    if (hasError) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/song-set-entries', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variableName: trimmedVar,
          title: trimmedTitle,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.songSets.createConflict'));
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songSets.createFailed'));
        return;
      }

      const created = (await res.json()) as SongSetEntry;
      setEntries((prev) => [...prev, created].sort((a, b) => a.position - b.position));
      setNewVariableName('');
      setNewTitle('');
      toast.success(t('admin.songSets.created').replace('{title}', created.title));
    } catch {
      toast.error(t('admin.songSets.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const startRename = (entry: SongSetEntry) => {
    setEditingVarName(entry.variableName);
    setEditTitle(entry.title);
    setEditTitleError(null);
  };

  const cancelRename = () => {
    setEditingVarName(null);
    setEditTitle('');
    setEditTitleError(null);
  };

  const handleSaveRename = async (entry: SongSetEntry) => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || trimmedTitle.length > 120) {
      setEditTitleError(t('admin.songSets.titleInvalid'));
      return;
    }

    setRenaming(true);
    try {
      const res = await fetch(`/api/admin/song-set-entries/${encodeURIComponent(entry.variableName)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: trimmedTitle,
          updatedAt: entry.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.songSets.staleConflict'));
        void fetchEntries();
        cancelRename();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songSets.renameFailed'));
        return;
      }

      const updated = (await res.json()) as SongSetEntry;
      setEntries((prev) =>
        prev.map((item) => (item.variableName === updated.variableName ? updated : item))
      );
      toast.success(t('admin.songSets.renamed').replace('{title}', updated.title));
      cancelRename();
    } catch {
      toast.error(t('admin.songSets.renameFailed'));
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async (entry: SongSetEntry) => {
    const ok = window.confirm(
      t('admin.songSets.confirmDelete')
        .replace('{title}', entry.title)
        .replace('{variableName}', entry.variableName)
    );
    if (!ok) return;

    setDeletingVarName(entry.variableName);
    try {
      const res = await fetch(`/api/admin/song-set-entries/${encodeURIComponent(entry.variableName)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: entry.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.songSets.staleConflict'));
        void fetchEntries();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songSets.deleteFailed'));
        return;
      }

      setEntries((prev) => prev.filter((item) => item.variableName !== entry.variableName));
      toast.success(t('admin.songSets.deleted').replace('{title}', entry.title));
    } catch {
      toast.error(t('admin.songSets.deleteFailed'));
    } finally {
      setDeletingVarName(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.songSets.title')}</CardTitle>
          <CardDescription>{t('admin.songSets.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="text-sm font-semibold">{t('admin.songSets.createTitle')}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="song-set-varname">{t('admin.songSets.variableName')}</Label>
                <Input
                  id="song-set-varname"
                  placeholder="e.g. opening_song_bt"
                  value={newVariableName}
                  disabled={creating}
                  onChange={(e) => {
                    setNewVariableName(e.target.value);
                    if (varNameError) setVarNameError(null);
                  }}
                />
                <p className="text-xs text-muted-foreground">{t('admin.songSets.variableNameHint')}</p>
                {varNameError ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {varNameError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="song-set-title">{t('admin.songSets.entryTitle')}</Label>
                <Input
                  id="song-set-title"
                  placeholder="e.g. Opening Song"
                  value={newTitle}
                  disabled={creating}
                  onChange={(e) => {
                    setNewTitle(e.target.value);
                    if (titleError) setTitleError(null);
                  }}
                />
                {titleError ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {titleError}
                  </p>
                ) : null}
              </div>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? t('admin.songSets.adding') : t('admin.songSets.add')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.songSets.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              <span>Loading…</span>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.songSets.empty')}</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {entries.map((entry) => {
                const isEditing = editingVarName === entry.variableName;
                const isDeleting = deletingVarName === entry.variableName;

                return (
                  <div
                    key={entry.variableName}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              {entry.variableName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({t('admin.songSets.position')}: {entry.position})
                            </span>
                          </div>
                          <div className="flex max-w-md items-center gap-2">
                            <Input
                              value={editTitle}
                              disabled={renaming}
                              onChange={(e) => {
                                setEditTitle(e.target.value);
                                if (editTitleError) setEditTitleError(null);
                              }}
                              className="text-sm"
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={renaming}
                              onClick={() => void handleSaveRename(entry)}
                            >
                              {renaming ? t('admin.songSets.renaming') : t('admin.songSets.save')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              disabled={renaming}
                              onClick={cancelRename}
                            >
                              {t('admin.songSets.cancel')}
                            </Button>
                          </div>
                          {editTitleError ? (
                            <p role="alert" className="text-xs font-medium text-destructive">
                              {editTitleError}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground">{entry.title}</h4>
                            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                              {entry.variableName}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {t('admin.songSets.position')}: {entry.position}
                          </p>
                        </div>
                      )}
                    </div>

                    {!isEditing ? (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => startRename(entry)}
                        >
                          {t('admin.songSets.rename')}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                          onClick={() => void handleDelete(entry)}
                        >
                          {isDeleting ? t('admin.songSets.deleting') : t('admin.songSets.delete')}
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

      {/* Shared Layout Trio Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('admin.songSets.layouts.title')}</CardTitle>
          <CardDescription>{t('admin.songSets.layouts.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1 text-xs text-muted-foreground rounded-lg border border-border bg-muted/40 p-3">
            <p><strong>Shared.</strong> {t('admin.songSets.layouts.sharedNote')}</p>
            <p><strong>Frozen per service.</strong> {t('admin.songSets.layouts.frozenNote')}</p>
          </div>

          <div className="flex gap-2">
            {(['title', 'verse', 'reff'] as const).map((role) => (
              <Button
                key={role}
                type="button"
                variant={selectedRole === role ? 'secondary' : 'outline'}
                size="sm"
                className="capitalize"
                onClick={() => setSelectedRole(role)}
              >
                {role === 'title' ? 'Title' : role === 'verse' ? 'Verse' : 'Reff'}
              </Button>
            ))}
          </div>

          <ArtifactEditor
            key={`song-set-trio-${selectedRole}`}
            adapter={songSetAdapter}
            initialSelectedId={selectedRole}
            hideList={true}
            allowImages={selectedRole === 'title'}
            bannerNote={
              selectedRole !== 'title' ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                  {t('admin.songSets.layouts.blankCanvasNote')}
                </div>
              ) : null
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
