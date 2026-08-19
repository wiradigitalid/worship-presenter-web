import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SyncArtifactButton({
  serviceId,
  updatedAt,
}: {
  serviceId: number;
  updatedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (
      !window.confirm(
        'Replace this Service’s frozen deck structure with the live Artifact Registry? Entered hymn numbers, names, and verses stay. Announcement flyers stay this Service’s list.'
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/services/${serviceId}/sync-artifact`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ updated_at: updatedAt }),
      });
      const payload = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      if (!res.ok) {
        setError(payload?.error || `Sync failed (${res.status})`);
        if (res.status === 409) router.refresh();
        return;
      }
      router.refresh();
    } catch {
      setError('Sync failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1">
      <Button variant="outline" onClick={handleSync} disabled={busy}>
        {busy ? 'Syncing…' : 'Sync Artifact'}
      </Button>
      {error ? (
        <p className="text-xs text-destructive max-w-xs text-right">{error}</p>
      ) : null}
    </div>
  );
}
