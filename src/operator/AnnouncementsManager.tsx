import { useT } from '@/lib/i18n/operator';
import { useRouter } from '@/lib/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type AnnouncementRow = {
  id: number;
  image_url: string;
  service_id: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export default function AnnouncementsManager({
  initialItems,
}: {
  initialItems: AnnouncementRow[];
}) {
  const router = useRouter();
  const { t } = useT();
  const [items, setItems] = useState(initialItems);
  const [url, setUrl] = useState('');
  const [scope, setScope] = useState<'recurring' | 'one_off'>('recurring');
  const [serviceId, setServiceId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refresh = (next: AnnouncementRow[]) => {
    setItems(next);
    router.refresh();
  };

  const handleAdd = async () => {
    setBusy(true);
    setError(null);
    try {
      const body: {
        image_url: string;
        service_id?: number | null;
      } = { image_url: url.trim() };

      if (scope === 'one_off') {
        const sid = Number(serviceId);
        if (!Number.isInteger(sid) || sid <= 0) {
          throw new Error('Enter a valid service id for one-off items');
        }
        body.service_id = sid;
      } else {
        body.service_id = null;
      }

      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add');
      }
      setUrl('');
      refresh([...items, data.item]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: number) => {
    const row = items.find((i) => i.id === id);
    if (!row) return;
    if (!confirm(t('announcements.confirmRemove'))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated_at: row.updated_at }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      refresh(items.filter((i) => i.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete');
    } finally {
      setBusy(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    const [row] = next.splice(index, 1);
    next.splice(target, 0, row);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: next.map((item, sort_order) => ({
            image_url: item.image_url,
            service_id: item.service_id,
            sort_order,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reorder');
      }
      refresh(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to reorder');
    } finally {
      setBusy(false);
    }
  };

  const handleReplaceAll = async () => {
    const text = prompt(
      'Paste image URLs (one per line) to replace the entire list.\nLeave blank to clear.',
      items.map((i) => i.image_url).join('\n')
    );
    if (text === null) return;

    const urls = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: urls.map((image_url, sort_order) => ({
            image_url,
            // Preserve scope when URL still matches prior row at same index.
            service_id:
              items[sort_order]?.image_url === image_url
                ? items[sort_order].service_id
                : null,
            sort_order,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to replace');
      }
      refresh(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to replace');
    } finally {
      setBusy(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setUrl(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold">{t('announcements.addTitle')}</CardTitle>
          <CardDescription>
            {t('announcements.addDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="mb-2 block">{t('announcements.imageUrl')}</Label>
              <Input
                className="font-mono text-sm"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t('announcements.imagePlaceholder')}
                disabled={busy}
              />
            </div>
            <div>
              <Label className="mb-2 block">{t('announcements.uploadLocal')}</Label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-muted-foreground bg-background border border-border/80 rounded-xl file:mr-3 file:py-2 file:px-3 file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary file:hover:bg-primary/20 cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
                onChange={handleFileUpload}
                disabled={busy}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-4 items-end pt-2">
            <div>
              <Label className="mb-2 block">{t('announcements.scope')}</Label>
              <Select
                value={scope}
                onValueChange={(v) => setScope(v as 'recurring' | 'one_off')}
                disabled={busy}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recurring">{t('announcements.scope.recurring')}</SelectItem>
                  <SelectItem value="one_off">{t('announcements.scope.oneOff')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {scope === 'one_off' && (
              <div>
                <Label className="mb-2 block">
                  {t('announcements.serviceId')}
                </Label>
                <Input
                  className="w-28 font-mono text-sm"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  placeholder="e.g. 5"
                  disabled={busy}
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={busy || !url.trim()}>
                {busy ? t('announcements.working') : t('announcements.add')}
              </Button>
              <Button variant="outline" onClick={handleReplaceAll} disabled={busy}>
                {t('announcements.replaceAll')}
              </Button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium animate-pulse" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-md bg-card/60 backdrop-blur-md">
        <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="text-xl font-bold">{t('announcements.listTitle')}</CardTitle>
            <CardDescription>
              {items.length === 0
                ? t('announcements.listEmptyHint')
                : items.length === 1
                  ? t('announcements.listCountOne')
                  : t('announcements.listCount').replace('{n}', String(items.length))}
            </CardDescription>
          </div>
          {items.length > 1 && (
            <span className="text-xs text-muted-foreground bg-primary/5 border border-primary/10 px-3 py-1.5 rounded-lg font-medium">
              {t('announcements.reorderTip')}
            </span>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-muted-foreground italic text-sm text-center py-6">{t('announcements.noneYet')}</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
                >
                  <div className="flex gap-4 items-center min-w-0 flex-1">
                    <a
                      href={item.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 block h-20 w-28 border border-border/80 rounded-xl overflow-hidden shadow-sm hover:border-primary/50 transition-colors"
                    >
                      <img
                        src={item.image_url}
                        alt={t('announcements.alt').replace('{n}', String(index + 1))}
                        className="h-full w-full object-cover"
                      />
                    </a>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs break-all text-muted-foreground bg-background/50 border border-border/50 rounded-lg p-2 max-h-16 overflow-y-auto">
                        {item.image_url}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {/* The `-600` shades were picked against a white card. This page
                            became dark-switchable in Story 17.1, and at `text-[10px]` the
                            4.5:1 small-text floor applies — emerald measured 4.23:1 on the
                            dark card. The dark halves are the same ones
                            `SlidePreviewList` ports from `PRESENTER_TONE_CLASS`. */}
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          item.service_id == null
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-400/15 dark:text-emerald-200 dark:border-emerald-400/40'
                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/15 dark:text-amber-200 dark:border-amber-400/40'
                        }`}>
                          {item.service_id == null
                            ? t('announcements.recurring')
                            : t('announcements.oneOffService').replace(
                                '{id}',
                                String(item.service_id)
                              )}
                        </span>
                        <span className="text-[10px] font-semibold text-muted-foreground">
                          {t('announcements.order').replace('{n}', String(item.sort_order))}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0 justify-end">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      title={t('announcements.moveUp')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                      </svg>
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      disabled={busy || index === items.length - 1}
                      onClick={() => move(index, 1)}
                      title={t('announcements.moveDown')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                      </svg>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={busy}
                      onClick={() => handleDelete(item.id)}
                    >
                      {t('announcements.remove')}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
