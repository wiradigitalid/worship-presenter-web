import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useT } from '@/lib/i18n/operator';

type BibleTranslation = {
  code: string;
  name: string;
  locale: string;
};

export default function BibleTranslationSettings({
  initialCode,
  initialInstalled,
}: {
  initialCode: string;
  initialInstalled: boolean;
}) {
  const { t } = useT();
  const [code, setCode] = useState(initialCode);
  const [installed, setInstalled] = useState(initialInstalled);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/bible-translations', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return;
        const body = (await res.json()) as {
          translations?: BibleTranslation[];
          default_bible_translation?: string;
          default_bible_translation_installed?: boolean;
        };
        setTranslations(body.translations ?? []);
        if (typeof body.default_bible_translation === 'string') {
          setCode(body.default_bible_translation);
        }
        if (typeof body.default_bible_translation_installed === 'boolean') {
          setInstalled(body.default_bible_translation_installed);
        }
      })
      .catch(() => {
        /* listing is optional for first paint; Save still talks to settings */
      });
  }, []);

  const options = [...translations];
  if (code && !options.some((row) => row.code === code)) {
    options.unshift({ code, name: code, locale: '' });
  }

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ default_bible_translation: code }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as {
        default_bible_translation: string;
        default_bible_translation_installed: boolean;
      };
      setCode(data.default_bible_translation);
      setInstalled(data.default_bible_translation_installed);
      const saved = t('admin.bibleTranslation.saved').replace(
        '{code}',
        data.default_bible_translation
      );
      setMessage(saved);
      toast(saved);
    } catch {
      setMessage(t('admin.bibleTranslation.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('admin.bibleTranslation.title')}</CardTitle>
        <CardDescription>
          {t('admin.bibleTranslation.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="default-bible-translation"
          >
            {t('admin.bibleTranslation.label')}
          </label>
          <select
            id="default-bible-translation"
            className="w-56 rounded-lg border bg-muted px-3 py-2 text-sm"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setInstalled(translations.some((row) => row.code === e.target.value));
            }}
            disabled={saving || options.length === 0}
          >
            {options.map((row) => (
              <option key={row.code} value={row.code}>
                {row.name ? `${row.name} (${row.code})` : row.code}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => void save()} disabled={saving || !code}>
          {saving
            ? t('admin.bibleTranslation.saving')
            : t('admin.bibleTranslation.save')}
        </Button>
        {!installed ? (
          <p className="w-full text-sm text-muted-foreground">
            {t('admin.bibleTranslation.notInstalled').replace('{code}', code)}
          </p>
        ) : null}
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
