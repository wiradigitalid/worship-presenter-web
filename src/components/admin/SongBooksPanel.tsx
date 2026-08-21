import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useT } from '@/lib/i18n/operator';

export interface SongBook {
  bookCode: string;
  name: string;
  locale: string;
  licence?: string | null;
  provenance?: string | null;
  isDefault: boolean;
  updatedAt: string;
}

export function SongBooksPanel() {
  const { t } = useT();

  const [books, setBooks] = useState<SongBook[]>([]);
  const [loading, setLoading] = useState(true);

  // New book form state
  const [newBookCode, setNewBookCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocale, setNewLocale] = useState('');
  const [newLicence, setNewLicence] = useState('');
  const [newProvenance, setNewProvenance] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  const [creating, setCreating] = useState(false);
  const [bookCodeError, setBookCodeError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [localeError, setLocaleError] = useState<string | null>(null);

  // Edit book state
  const [editingBookCode, setEditingBookCode] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editLocale, setEditLocale] = useState('');
  const [editLicence, setEditLicence] = useState('');
  const [editProvenance, setEditProvenance] = useState('');
  const [editIsDefault, setEditIsDefault] = useState(false);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [editLocaleError, setEditLocaleError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  // Delete state
  const [deletingBookCode, setDeletingBookCode] = useState<string | null>(null);
  const [settingDefaultCode, setSettingDefaultCode] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/admin/song-books', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Failed to load');
      const data = (await res.json()) as { books: SongBook[] };
      setBooks(data.books ?? []);
    } catch {
      toast.error(t('admin.songBooks.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchBooks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = newBookCode.trim();
    const name = newName.trim();
    const locale = newLocale.trim();
    const licence = newLicence.trim();
    const provenance = newProvenance.trim();

    let hasError = false;
    if (!code || code.length > 20) {
      setBookCodeError(t('admin.songBooks.bookCodeInvalid'));
      hasError = true;
    } else {
      setBookCodeError(null);
    }

    if (!name || name.length > 120) {
      setNameError(t('admin.songBooks.nameInvalid'));
      hasError = true;
    } else {
      setNameError(null);
    }

    if (!locale || locale.length > 20) {
      setLocaleError(t('admin.songBooks.localeInvalid'));
      hasError = true;
    } else {
      setLocaleError(null);
    }

    if (hasError) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/song-books', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookCode: code,
          name,
          locale,
          licence: licence || null,
          provenance: provenance || null,
          isDefault: newIsDefault,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.songBooks.createConflict'));
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songBooks.createFailed'));
        return;
      }

      await fetchBooks();
      setNewBookCode('');
      setNewName('');
      setNewLocale('');
      setNewLicence('');
      setNewProvenance('');
      setNewIsDefault(false);
      toast.success(t('admin.songBooks.created').replace('{name}', name));
    } catch {
      toast.error(t('admin.songBooks.createFailed'));
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (book: SongBook) => {
    setEditingBookCode(book.bookCode);
    setEditName(book.name);
    setEditLocale(book.locale);
    setEditLicence(book.licence ?? '');
    setEditProvenance(book.provenance ?? '');
    setEditIsDefault(book.isDefault);
    setEditNameError(null);
    setEditLocaleError(null);
  };

  const cancelEdit = () => {
    setEditingBookCode(null);
    setEditName('');
    setEditLocale('');
    setEditLicence('');
    setEditProvenance('');
    setEditIsDefault(false);
    setEditNameError(null);
    setEditLocaleError(null);
  };

  const handleSaveEdit = async (book: SongBook) => {
    const name = editName.trim();
    const locale = editLocale.trim();
    const licence = editLicence.trim();
    const provenance = editProvenance.trim();

    let hasError = false;
    if (!name || name.length > 120) {
      setEditNameError(t('admin.songBooks.nameInvalid'));
      hasError = true;
    } else {
      setEditNameError(null);
    }

    if (!locale || locale.length > 20) {
      setEditLocaleError(t('admin.songBooks.localeInvalid'));
      hasError = true;
    } else {
      setEditLocaleError(null);
    }

    if (hasError) return;

    setEditing(true);
    try {
      const res = await fetch(`/api/admin/song-books/${encodeURIComponent(book.bookCode)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          locale,
          licence: licence || null,
          provenance: provenance || null,
          isDefault: editIsDefault,
          updatedAt: book.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.songBooks.staleConflict'));
        void fetchBooks();
        cancelEdit();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songBooks.updateFailed'));
        return;
      }

      await fetchBooks();
      toast.success(t('admin.songBooks.updated').replace('{name}', name));
      cancelEdit();
    } catch {
      toast.error(t('admin.songBooks.updateFailed'));
    } finally {
      setEditing(false);
    }
  };

  const handleMakeDefault = async (book: SongBook) => {
    if (book.isDefault) return;

    setSettingDefaultCode(book.bookCode);
    try {
      const res = await fetch(`/api/admin/song-books/${encodeURIComponent(book.bookCode)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isDefault: true,
          updatedAt: book.updatedAt,
        }),
      });

      if (res.status === 409) {
        toast.error(t('admin.songBooks.staleConflict'));
        void fetchBooks();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songBooks.defaultFailed'));
        return;
      }

      await fetchBooks();
      toast.success(t('admin.songBooks.defaultSaved'));
    } catch {
      toast.error(t('admin.songBooks.defaultFailed'));
    } finally {
      setSettingDefaultCode(null);
    }
  };

  const handleDelete = async (book: SongBook) => {
    const ok = window.confirm(
      t('admin.songBooks.confirmDelete')
        .replace('{name}', book.name)
        .replace('{code}', book.bookCode)
    );
    if (!ok) return;

    setDeletingBookCode(book.bookCode);
    try {
      const res = await fetch(`/api/admin/song-books/${encodeURIComponent(book.bookCode)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedAt: book.updatedAt,
        }),
      });

      if (res.status === 409) {
        const errorData = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(
          errorData.error === 'Song book is still in use'
            ? t('admin.songBooks.inUseRefusal')
            : errorData.error || t('admin.songBooks.staleConflict')
        );
        void fetchBooks();
        return;
      }

      if (!res.ok) {
        toast.error(t('admin.songBooks.deleteFailed'));
        return;
      }

      await fetchBooks();
      toast.success(t('admin.songBooks.deleted').replace('{name}', book.name));
    } catch {
      toast.error(t('admin.songBooks.deleteFailed'));
    } finally {
      setDeletingBookCode(null);
    }
  };

  const hasAnyDefault = books.some((b) => b.isDefault);

  return (
    <div className="space-y-6">
      {/* Create new song book */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.songBooks.title')}</CardTitle>
          <CardDescription>{t('admin.songBooks.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground italic">
            {t('admin.songBooks.emptyBookNote')}
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <h3 className="text-sm font-semibold">{t('admin.songBooks.createTitle')}</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="new-book-code">{t('admin.songBooks.bookCode')}</Label>
                <Input
                  id="new-book-code"
                  placeholder="e.g. SDAH, PKJ, KJ"
                  value={newBookCode}
                  disabled={creating}
                  onChange={(e) => {
                    setNewBookCode(e.target.value);
                    if (bookCodeError) setBookCodeError(null);
                  }}
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">{t('admin.songBooks.bookCodeHint')}</p>
                {bookCodeError ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {bookCodeError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-book-name">{t('admin.songBooks.name')}</Label>
                <Input
                  id="new-book-name"
                  placeholder="e.g. Seventh-day Adventist Hymnal"
                  value={newName}
                  disabled={creating}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (nameError) setNameError(null);
                  }}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">{t('admin.songBooks.nameHint')}</p>
                {nameError ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {nameError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-book-locale">{t('admin.songBooks.locale')}</Label>
                <Input
                  id="new-book-locale"
                  placeholder="e.g. en, id"
                  value={newLocale}
                  disabled={creating}
                  onChange={(e) => {
                    setNewLocale(e.target.value);
                    if (localeError) setLocaleError(null);
                  }}
                  className="text-xs"
                />
                <p className="text-[11px] text-muted-foreground">{t('admin.songBooks.localeHint')}</p>
                {localeError ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {localeError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-book-licence">{t('admin.songBooks.licence')}</Label>
                <Input
                  id="new-book-licence"
                  placeholder="e.g. Public Domain / Copyright"
                  value={newLicence}
                  disabled={creating}
                  onChange={(e) => setNewLicence(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="new-book-provenance">{t('admin.songBooks.provenance')}</Label>
                <Input
                  id="new-book-provenance"
                  placeholder="e.g. Official Edition 1985"
                  value={newProvenance}
                  disabled={creating}
                  onChange={(e) => setNewProvenance(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Checkbox
                  id="new-book-default"
                  checked={newIsDefault}
                  onCheckedChange={(checked) => setNewIsDefault(Boolean(checked))}
                  disabled={creating}
                />
                <Label htmlFor="new-book-default" className="text-xs font-medium cursor-pointer">
                  {t('admin.songBooks.isDefaultLabel')}
                </Label>
              </div>
            </div>

            <Button type="submit" disabled={creating}>
              {creating ? t('admin.songBooks.adding') : t('admin.songBooks.add')}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Books List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">{t('admin.songBooks.listTitle')}</CardTitle>
              <CardDescription>{t('admin.songBooks.listDescription')}</CardDescription>
            </div>
            {!hasAnyDefault && books.length > 0 ? (
              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-500/30">
                {t('admin.songBooks.noDefaultWarning')}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2" />
              <span>Loading…</span>
            </div>
          ) : books.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('admin.songBooks.empty')}</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {books.map((book) => {
                const isEditing = editingBookCode === book.bookCode;
                const isDeleting = deletingBookCode === book.bookCode;
                const isSettingDefault = settingDefaultCode === book.bookCode;

                return (
                  <div key={book.bookCode} className="p-4 space-y-3">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {book.bookCode}
                          </Badge>
                          <span className="text-xs text-muted-foreground italic">
                            {t('admin.songBooks.codeImmutable')}
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1">
                            <Label className="text-xs">{t('admin.songBooks.name')}</Label>
                            <Input
                              value={editName}
                              disabled={editing}
                              onChange={(e) => {
                                setEditName(e.target.value);
                                if (editNameError) setEditNameError(null);
                              }}
                              className="text-xs"
                            />
                            {editNameError ? (
                              <p role="alert" className="text-xs font-medium text-destructive">
                                {editNameError}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">{t('admin.songBooks.locale')}</Label>
                            <Input
                              value={editLocale}
                              disabled={editing}
                              onChange={(e) => {
                                setEditLocale(e.target.value);
                                if (editLocaleError) setEditLocaleError(null);
                              }}
                              className="text-xs"
                            />
                            {editLocaleError ? (
                              <p role="alert" className="text-xs font-medium text-destructive">
                                {editLocaleError}
                              </p>
                            ) : null}
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">{t('admin.songBooks.licence')}</Label>
                            <Input
                              value={editLicence}
                              disabled={editing}
                              onChange={(e) => setEditLicence(e.target.value)}
                              className="text-xs"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-xs">{t('admin.songBooks.provenance')}</Label>
                            <Input
                              value={editProvenance}
                              disabled={editing}
                              onChange={(e) => setEditProvenance(e.target.value)}
                              className="text-xs"
                            />
                          </div>

                          <div className="flex items-center space-x-2 pt-6">
                            <Checkbox
                              id={`edit-book-default-${book.bookCode}`}
                              checked={editIsDefault}
                              onCheckedChange={(checked) => setEditIsDefault(Boolean(checked))}
                              disabled={editing}
                            />
                            <Label htmlFor={`edit-book-default-${book.bookCode}`} className="text-xs font-medium cursor-pointer">
                              {t('admin.songBooks.isDefaultLabel')}
                            </Label>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={editing}
                            onClick={() => void handleSaveEdit(book)}
                          >
                            {editing ? t('admin.songBooks.saving') : t('admin.songBooks.save')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={editing}
                            onClick={cancelEdit}
                          >
                            {t('admin.songBooks.cancel')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs font-bold">
                              {book.bookCode}
                            </Badge>
                            <span className="font-semibold text-sm text-foreground">
                              {book.name}
                            </span>
                            {book.isDefault ? (
                              <Badge variant="default" className="text-[11px] shadow-sm font-semibold">
                                <Check className="mr-1 h-3 w-3" />
                                {t('admin.songBooks.defaultBadge')}
                              </Badge>
                            ) : null}
                            <Badge variant="secondary" className="text-[11px]">
                              {book.locale}
                            </Badge>
                          </div>

                          {(book.licence || book.provenance) && (
                            <p className="text-xs text-muted-foreground">
                              {[book.licence, book.provenance].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 flex-wrap">
                          {!book.isDefault ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={isSettingDefault || isDeleting}
                              onClick={() => void handleMakeDefault(book)}
                            >
                              {isSettingDefault ? '…' : t('admin.songBooks.makeDefault')}
                            </Button>
                          ) : null}

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={isDeleting || isSettingDefault}
                            onClick={() => startEdit(book)}
                          >
                            {t('admin.songBooks.edit')}
                          </Button>

                          <Button
                            type="button"
                            variant="destructive"
                            size="icon-sm"
                            disabled={isDeleting || isSettingDefault}
                            title={t('admin.songBooks.delete')}
                            onClick={() => void handleDelete(book)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SongBooksPanel;
