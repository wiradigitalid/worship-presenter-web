import { toast } from 'sonner';
import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  resolveString,
  UI_LOCALE_ORDER,
  type UiLocale,
} from '@/lib/i18n';
import { announceUiLocale } from '@/lib/ui-locale-document';

export default function UiLocaleSettings({
  initialLocale,
}: {
  initialLocale: UiLocale;
}) {
  const router = useRouter();
  /** Persisted locale — drives card copy and matches SQLite until Save succeeds. */
  const [displayLocale, setDisplayLocale] = useState<UiLocale>(initialLocale);
  /** Pending select value — may differ from displayLocale until Save. */
  const [pendingLocale, setPendingLocale] = useState<UiLocale>(initialLocale);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const t = (key: Parameters<typeof resolveString>[0]) =>
    resolveString(key, displayLocale);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ui_locale: pendingLocale }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { ui_locale: UiLocale };
      setDisplayLocale(data.ui_locale);
      setPendingLocale(data.ui_locale);
      const saved = resolveString(
        `admin.uiLocale.saved.${data.ui_locale}`,
        data.ui_locale
      );
      setMessage(saved);
      toast(saved);
      announceUiLocale(data.ui_locale);
      // Only to re-render the root layout so `<html lang>` follows the new
      // setting. This component's own state is already correct above, which is
      // why there is no prop-sync effect: nothing else writes `ui_locale`.
      router.refresh();
    } catch {
      setMessage(t('admin.uiLocale.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('admin.uiLocale.title')}</CardTitle>
        <CardDescription>{t('admin.uiLocale.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="mb-1.5 block" htmlFor="ui-locale">
            {t('admin.uiLocale.label')}
          </Label>
          <Select
            value={pendingLocale}
            onValueChange={(v) => setPendingLocale(v as UiLocale)}
            disabled={saving}
          >
            <SelectTrigger id="ui-locale" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UI_LOCALE_ORDER.map((code) => (
                <SelectItem key={code} value={code}>
                  {t(`admin.uiLocale.option.${code}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? t('admin.uiLocale.saving') : t('admin.uiLocale.save')}
        </Button>
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
