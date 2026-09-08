import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useT } from '@/lib/i18n/operator';
import ArtifactEditor from '@/components/admin/ArtifactEditor';
import { createSongSetTrioAdapter } from '@/lib/registry/canvas-adapters';

export interface SongSetEntry {
  variableName: string;
  title: string;
  position: number;
  updatedAt: string;
}

type SongSetLayoutRole = 'title' | 'verse' | 'reff';

export function SongSetEntriesPanel() {
  const { t } = useT();

  const [entries, setEntries] = useState<SongSetEntry[]>([]);
  const [selectedVarName, setSelectedVarName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // New Song Set creation inputs
  const [newTitle, setNewTitle] = useState('');
  const [newVarName, setNewVarName] = useState('');
  const [creating, setCreating] = useState(false);

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftVarName, setDraftVarName] = useState('');
  const [renaming, setRenaming] = useState(false);

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
      const list = data.entries ?? [];
      setEntries(list);
      if (list.length > 0 && !selectedVarName) {
        setSelectedVarName(list[0].variableName);
        setDraftTitle(list[0].title);
      }
    } catch {
      toast.error(t('admin.songSets.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchEntries();
  }, []);

  const activeEntry = entries.find((e) => e.variableName === selectedVarName) ?? entries[0] ?? null;

  useEffect(() => {
    if (activeEntry) {
      setDraftTitle(activeEntry.title);
      setDraftVarName(activeEntry.variableName);
      setIsRenaming(false);
    }
  }, [activeEntry?.variableName]);

  const handleCreate = async () => {
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      toast.error('Song set title is required');
      return;
    }
    let candidateVar = newVarName.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
    if (!candidateVar) {
      let nextNum = entries.length + 1;
      candidateVar = `song_set_${nextNum}`;
      while (entries.some((e) => e.variableName === candidateVar)) {
        nextNum++;
        candidateVar = `song_set_${nextNum}`;
      }
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/song-set-entries', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variableName: candidateVar,
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
      setSelectedVarName(created.variableName);
      setDraftTitle(created.title);
      setNewTitle('');
      setNewVarName('');
      setIsRenaming(false);
      toast.success(t('admin.songSets.created').replace('{title}', created.title));
    } catch {
      toast.error(t('admin.songSets.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveRename = async () => {
    if (!activeEntry) return;
    const trimmedTitle = draftTitle.trim();
    if (!trimmedTitle || trimmedTitle.length > 120) {
      toast.error(t('admin.songSets.titleInvalid'));
      return;
    }
    const trimmedVar = draftVarName.trim().toLowerCase();
    if (!trimmedVar) {
      toast.error(t('admin.songSets.variableNameInvalid'));
      return;
    }
    if (!/^[a-z][a-z0-9_-]{0,79}$/.test(trimmedVar)) {
      toast.error(t('admin.songSets.variableNameInvalid'));
      return;
    }

    setRenaming(true);
    try {
      const res = await fetch(
        `/api/admin/song-set-entries/${encodeURIComponent(activeEntry.variableName)}`,
        {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: trimmedTitle,
            variableName: trimmedVar,
            updatedAt: activeEntry.updatedAt,
          }),
        }
      );

      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        if (data.error && String(data.error).includes('already exists')) {
          toast.error(t('admin.songSets.createConflict'));
        } else {
          toast.error(t('admin.songSets.staleConflict'));
          void fetchEntries();
          setIsRenaming(false);
        }
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songSets.renameFailed'));
        return;
      }

      const updated = (await res.json()) as SongSetEntry;
      setEntries((prev) =>
        prev.map((item) => (item.variableName === activeEntry.variableName ? updated : item))
      );
      setSelectedVarName(updated.variableName);
      toast.success(t('admin.songSets.renamed').replace('{title}', updated.title));
      setIsRenaming(false);
    } catch {
      toast.error(t('admin.songSets.renameFailed'));
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async (entry: SongSetEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = window.confirm(
      t('admin.songSets.confirmDelete')
        .replace('{title}', entry.title)
        .replace('{variableName}', entry.variableName)
    );
    if (!ok) return;

    try {
      const res = await fetch(
        `/api/admin/song-set-entries/${encodeURIComponent(entry.variableName)}`,
        {
          method: 'DELETE',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updatedAt: entry.updatedAt,
          }),
        }
      );

      if (res.status === 409) {
        toast.error(t('admin.songSets.staleConflict'));
        void fetchEntries();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songSets.deleteFailed'));
        return;
      }

      setEntries((prev) => {
        const next = prev.filter((item) => item.variableName !== entry.variableName);
        if (selectedVarName === entry.variableName) {
          setSelectedVarName(next[0]?.variableName ?? null);
        }
        return next;
      });
      toast.success(t('admin.songSets.deleted').replace('{title}', entry.title));
    } catch {
      toast.error(t('admin.songSets.deleteFailed'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[330px_minmax(0,1fr)] gap-6">
      {/* Panel Kiri: Add New Song Set & List */}
      <aside className="space-y-4">
        {/* New Song Set creation panel per DEC-009 / DEC-010 */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">New Song Set</span>
            <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
              Song Set
            </span>
          </div>
          <div className="space-y-2 pt-0.5">
            <Input
              type="text"
              placeholder="Song set title (e.g. Fellowship Song)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={creating || loading}
              className="text-xs h-8"
            />
            <div className="flex gap-1.5">
              <Input
                type="text"
                placeholder="Variable code (e.g. fellowship_song)"
                value={newVarName}
                onChange={(e) => setNewVarName(e.target.value)}
                disabled={creating || loading}
                className="flex-1 text-xs h-8 font-mono"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => void handleCreate()}
                disabled={creating || loading || !newTitle.trim()}
                className="shrink-0 h-8 font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New
              </Button>
            </div>
          </div>
        </div>

        {/* List Song Sets */}
        <div className="rounded-xl border border-border bg-card p-3.5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">Configured Song Sets</span>
            <span className="text-[11px] text-muted-foreground font-mono">{entries.length} items</span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              <span>Loading…</span>
            </div>
          ) : entries.length === 0 ? (
            <p className="text-xs text-muted-foreground p-2">{t('admin.songSets.empty')}</p>
          ) : (
            <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
              {entries.map((entry) => {
                const isSelected = activeEntry?.variableName === entry.variableName;
                return (
                  <div
                    key={entry.variableName}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setSelectedVarName(entry.variableName);
                      setDraftTitle(entry.title);
                      setIsRenaming(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedVarName(entry.variableName);
                        setDraftTitle(entry.title);
                        setIsRenaming(false);
                      }
                    }}
                    className={`group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 bg-muted/30 hover:bg-muted/70 hover:border-border'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold truncate text-foreground">{entry.title}</p>
                      <span className="text-[10px] font-mono text-muted-foreground">[{entry.variableName}]</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title={t('admin.songSets.delete')}
                        onClick={(e) => void handleDelete(entry, e)}
                        className="h-7 w-7 p-1 text-destructive hover:bg-destructive/20 hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>

      {/* Panel Kanan: Rename Card, Trio Switcher & Canvas Workspace */}
      <section className="space-y-4 min-w-0">
        {!activeEntry ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-xs text-muted-foreground">
            No song set selected. Click "New Song Set" to create one.
          </div>
        ) : (
          <>
            {/* Rename Header Card */}
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                {isRenaming ? (
                  <div className="flex items-center gap-3">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {t('admin.songSets.entryTitle')}:
                      </Label>
                      <Input
                        value={draftTitle}
                        disabled={renaming}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="text-sm font-semibold max-w-xs h-8"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {t('admin.songSets.variableName')}:
                      </Label>
                      <Input
                        value={draftVarName}
                        disabled={renaming}
                        onChange={(e) =>
                          setDraftVarName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_'))
                        }
                        className="text-xs font-mono max-w-[160px] h-8"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="text-base font-bold text-foreground">{activeEntry.title}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      [slot: {activeEntry.variableName}]
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {isRenaming ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={renaming}
                      onClick={() => {
                        setIsRenaming(false);
                        setDraftTitle(activeEntry.title);
                        setDraftVarName(activeEntry.variableName);
                      }}
                    >
                      {t('admin.songSets.cancel')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      disabled={renaming || !draftTitle.trim() || !draftVarName.trim()}
                      onClick={() => void handleSaveRename()}
                    >
                      {renaming ? t('admin.songSets.renaming') : t('admin.songSets.save')}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRenaming(true)}
                  >
                    {t('admin.songSets.rename')}
                  </Button>
                )}
              </div>
            </div>

            {/* Layout Trio Switcher & Canvas Workspace */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
              {/* Trio Selector */}
              <div className="flex items-center gap-1.5 p-1 bg-muted rounded-lg border border-border">
                <Button
                  type="button"
                  variant={selectedRole === 'title' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedRole('title')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                    selectedRole === 'title'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  1. Title Slide
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === 'verse' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedRole('verse')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                    selectedRole === 'verse'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  2. Verse Layout
                </Button>
                <Button
                  type="button"
                  variant={selectedRole === 'reff' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedRole('reff')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded transition-colors ${
                    selectedRole === 'reff'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  3. Reffrain Layout
                </Button>
              </div>

              {/* Artifact Editor for the selected trio layout */}
              <ArtifactEditor
                key={`song-set-trio-${selectedRole}`}
                adapter={songSetAdapter}
                initialSelectedId={selectedRole}
                hideList={true}
                allowImages={selectedRole === 'title'}
                bannerNote={
                  <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs text-blue-700 dark:text-blue-300 flex items-center justify-between min-h-[42px] h-[42px] overflow-hidden">
                    {selectedRole === 'title' ? (
                      <>
                        <span className="flex-1 min-w-0 truncate mr-2">🎨 <strong>Song Title Slide</strong> — Title, hymn number, author, and song metadata. Canvas customizes layout & graphics.</span>
                        <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 shrink-0">TITLE SLIDE</span>
                      </>
                    ) : selectedRole === 'verse' ? (
                      <>
                        <span className="flex-1 min-w-0 truncate mr-2">📐 <strong>Auto Lyric Box: 2/3 Height Standard</strong> — Automated formula for hymn lyrics. Canvas customizes background & shapes.</span>
                        <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 shrink-0">VERSE LAYOUT</span>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 min-w-0 truncate mr-2">📐 <strong>Auto Lyric Box: 2/3 Height Standard</strong> — Automated formula for refrain/chorus. Canvas customizes background & shapes.</span>
                        <span className="font-mono text-[10px] bg-blue-500/20 px-2 py-0.5 rounded border border-blue-500/30 shrink-0">REFRAIN LAYOUT</span>
                      </>
                    )}
                  </div>
                }
              />
            </div>
          </>
        )}
      </section>
    </div>
  );
}
