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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  parseSlideTransition,
  SLIDE_TRANSITIONS,
  SLIDE_TRANSITION_SPECS,
  type SlideTransition,
} from '@/lib/transitions';
import { useT } from '@/lib/i18n/operator';
import SettingsRow, { SETTINGS_CONTROL_CLASS } from './SettingsRow';

type BibleTranslation = {
  code: string;
  name: string;
  locale: string;
};

export default function WorshipSettings({
  initialTransition,
  initialBibleCode,
  initialBibleInstalled,
}: {
  initialTransition: SlideTransition;
  initialBibleCode: string;
  initialBibleInstalled: boolean;
}) {
  const { t } = useT();
  const [transition, setTransition] = useState<SlideTransition>(
    initialTransition
  );
  const [transitionSaving, setTransitionSaving] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  const [code, setCode] = useState(initialBibleCode);
  const [installed, setInstalled] = useState(initialBibleInstalled);
  const [translations, setTranslations] = useState<BibleTranslation[]>([]);
  const [bibleSaving, setBibleSaving] = useState(false);
  const [bibleMessage, setBibleMessage] = useState<string | null>(null);

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

  const saveTransition = async () => {
    setTransitionSaving(true);
    setTransitionMessage(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slide_transition: transition }),
      });
      if (!res.ok) throw new Error('save failed');
      const data = (await res.json()) as { slide_transition: SlideTransition };
      setTransition(data.slide_transition);
      const saved = t('admin.transition.saved').replace(
        '{label}',
        SLIDE_TRANSITION_SPECS[data.slide_transition].label
      );
      setTransitionMessage(saved);
      toast(saved);
    } catch {
      setTransitionMessage(t('admin.transition.failed'));
    } finally {
      setTransitionSaving(false);
    }
  };

  const saveBible = async () => {
    setBibleSaving(true);
    setBibleMessage(null);
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
      setBibleMessage(saved);
      toast(saved);
    } catch {
      setBibleMessage(t('admin.bibleTranslation.failed'));
    } finally {
      setBibleSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('admin.section.worship')}</CardTitle>
        <CardDescription>{t('admin.section.worship.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <SettingsRow
          title={t('admin.transition.title')}
          description={t('admin.transition.description')}
        >
          <Select
            value={transition}
            onValueChange={(v) => setTransition(parseSlideTransition(v))}
            disabled={transitionSaving}
          >
            <SelectTrigger
              id="slide-transition"
              className={SETTINGS_CONTROL_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLIDE_TRANSITIONS.map((id) => (
                <SelectItem key={id} value={id}>
                  {SLIDE_TRANSITION_SPECS[id].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => void saveTransition()}
            disabled={transitionSaving}
          >
            {transitionSaving
              ? t('admin.transition.saving')
              : t('admin.transition.save')}
          </Button>
          {transitionMessage ? (
            <span className="text-xs text-muted-foreground">
              {transitionMessage}
            </span>
          ) : null}
        </SettingsRow>

        <SettingsRow
          title={t('admin.bibleTranslation.title')}
          description={t('admin.bibleTranslation.description')}
        >
          <Label htmlFor="default-bible-translation" className="sr-only">
            {t('admin.bibleTranslation.label')}
          </Label>
          <Select
            value={code}
            onValueChange={(v) => {
              setCode(v);
              setInstalled(translations.some((row) => row.code === v));
            }}
            disabled={bibleSaving || options.length === 0}
          >
            <SelectTrigger
              id="default-bible-translation"
              className={SETTINGS_CONTROL_CLASS}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map((row) => (
                <SelectItem key={row.code} value={row.code}>
                  {row.name ? `${row.name} (${row.code})` : row.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => void saveBible()}
            disabled={bibleSaving || !code}
          >
            {bibleSaving
              ? t('admin.bibleTranslation.saving')
              : t('admin.bibleTranslation.save')}
          </Button>
          {bibleMessage ? (
            <span className="text-xs text-muted-foreground">{bibleMessage}</span>
          ) : !installed ? (
            <span className="text-xs text-muted-foreground">
              {t('admin.bibleTranslation.notInstalled').replace('{code}', code)}
            </span>
          ) : null}
        </SettingsRow>
      </CardContent>
    </Card>
  );
}
