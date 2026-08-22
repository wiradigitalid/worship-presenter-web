import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/operator';

export default function SyncArtifactButton({
  serviceId,
  updatedAt,
  onSuccess,
}: {
  serviceId: number;
  updatedAt: string;
  onSuccess?: (updatedAt: string) => Promise<void> | void;
}) {
  const { t } = useT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    if (!window.confirm(t('sync.confirm'))) {
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
        updated_at?: string;
      } | null;
      if (!res.ok) {
        const errorMsg =
          res.status === 409
            ? t('sync.conflict')
            : payload?.error || `${t('sync.failed')} (${res.status})`;
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }
      toast.success(t('sync.success'));
      if (onSuccess) {
        await onSuccess(payload?.updated_at || '');
      }
    } catch {
      const errorMsg = t('sync.failed');
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-stretch sm:items-end gap-1">
      <Button variant="outline" onClick={handleSync} disabled={busy}>
        {busy ? t('sync.syncing') : t('sync.label')}
      </Button>
      {error ? (
        <p className="text-xs text-destructive max-w-xs text-right">{error}</p>
      ) : null}
    </div>
  );
}
