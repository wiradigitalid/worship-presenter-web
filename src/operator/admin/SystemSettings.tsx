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
import { Input } from '@/components/ui/input';
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
import { useT } from '@/lib/i18n/operator';
import { announceUiLocale } from '@/lib/ui-locale-document';
import SettingsRow from './SettingsRow';

export default function SystemSettings({
  initialDays,
  initialLocale,
}: {
  initialDays: number;
  initialLocale: UiLocale;
}) {
  const router = useRouter();
  const { t } = useT();

  const [days, setDays] = useState(initialDays);
  const [daysSaving, setDaysSaving] = useState(false);
  const [daysMessage, setDaysMessage] = useState<string | null>(null);

  const [displayLocale, setDisplayLocale] = useState<UiLocale>(initialLocale);
  const [pendingLocale, setPendingLocale] = useState<UiLocale>(initialLocale);
  const [localeSaving, setLocaleSaving] = useState(false);
  const [localeMessage, setLocaleMessage] = useState<string | null>(null);

  const localeT = (key: Parameters<typeof resolveString>[0]) =>
    resolveString(key, displayLocale);

  const saveRetention = async () => {
    setDaysSaving(true);
    setDaysMessage(null);
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
      setDaysMessage(saved);
      toast(saved);
    } catch {
      setDaysMessage(t('admin.retention.failed'));
    } finally {
      setDaysSaving(false);
    }
  };

  const saveLocale = async () => {
    setLocaleSaving(true);
    setLocaleMessage(null);
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
        `admin.uiLocale.saved.${data.ui_locale}` as Parameters<typeof resolveString>[0],
        data.ui_locale
      );
      setLocaleMessage(saved);
      toast(saved);
      announceUiLocale(data.ui_locale);
      // Only to re-render the root layout so `<html lang>` follows the new
      // setting. This component's own state is already correct above, which is
      // why there is no prop-sync effect: nothing else writes `ui_locale`.
      router.refresh();
    } catch {
      setLocaleMessage(localeT('admin.uiLocale.saveFailed'));
    } finally {
      setLocaleSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.section.system')}</CardTitle>
        <CardDescription>{t('admin.section.system.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsRow
          title={t('admin.retention.title')}
          description={t('admin.retention.description')}
        >
          <Label htmlFor="retention-days" className="sr-only">
            {t('admin.retention.label')}
          </Label>
          <Input
            id="retention-days"
            type="number"
            min={0}
            className="w-32"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            disabled={daysSaving}
          />
          <Button onClick={() => void saveRetention()} disabled={daysSaving}>
            {daysSaving ? t('admin.retention.saving') : t('admin.retention.save')}
          </Button>
          {daysMessage ? (
            <span className="text-xs text-muted-foreground">{daysMessage}</span>
          ) : null}
        </SettingsRow>

        <SettingsRow
          title={localeT('admin.uiLocale.title')}
          description={localeT('admin.uiLocale.description')}
        >
          <Label htmlFor="ui-locale" className="sr-only">
            {localeT('admin.uiLocale.label')}
          </Label>
          <Select
            value={pendingLocale}
            onValueChange={(v) => setPendingLocale(v as UiLocale)}
            disabled={localeSaving}
          >
            <SelectTrigger id="ui-locale" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UI_LOCALE_ORDER.map((code) => (
                <SelectItem key={code} value={code}>
                  {localeT(`admin.uiLocale.option.${code}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => void saveLocale()} disabled={localeSaving}>
            {localeSaving
              ? localeT('admin.uiLocale.saving')
              : localeT('admin.uiLocale.save')}
          </Button>
          {localeMessage ? (
            <span className="text-xs text-muted-foreground">{localeMessage}</span>
          ) : null}
        </SettingsRow>
      </CardContent>
    </Card>
  );
}
