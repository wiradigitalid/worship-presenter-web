import { toast } from 'sonner';
import { useState } from 'react';
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
import { useT } from '@/lib/i18n/operator';

export default function RetentionSettings({
  initialDays,
}: {
  initialDays: number;
}) {
  const { t } = useT();
  const [days, setDays] = useState(initialDays);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pptx_retention_days: days }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as {
        pptx_retention_days: number;
        cache_files_removed: number;
      };
      setDays(data.pptx_retention_days);
      const saved = t('admin.retention.saved').replace(
        '{n}',
        String(data.cache_files_removed)
      );
      setMessage(saved);
      toast(saved);
    } catch {
      setMessage(t('admin.retention.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('admin.retention.title')}</CardTitle>
        <CardDescription>{t('admin.retention.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="mb-1.5 block" htmlFor="retention-days">
            {t('admin.retention.label')}
          </Label>
          <Input
            id="retention-days"
            type="number"
            min={0}
            className="w-32"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={saving}
          />
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? t('admin.retention.saving') : t('admin.retention.save')}
        </Button>
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
