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
import {
  parseSlideTransition,
  SLIDE_TRANSITIONS,
  SLIDE_TRANSITION_SPECS,
  type SlideTransition,
} from '@/lib/transitions';
import { useT } from '@/lib/i18n/operator';

export default function TransitionSettings({
  initialTransition,
}: {
  initialTransition: SlideTransition;
}) {
  const { t } = useT();
  const [transition, setTransition] = useState<SlideTransition>(
    initialTransition
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMessage(null);
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
      setMessage(saved);
      toast(saved);
    } catch {
      setMessage(t('admin.transition.failed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>{t('admin.transition.title')}</CardTitle>
        <CardDescription>{t('admin.transition.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-3">
        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            htmlFor="slide-transition"
          >
            {t('admin.transition.label')}
          </label>
          <select
            id="slide-transition"
            className="w-44 rounded-lg border bg-muted px-3 py-2 text-sm"
            value={transition}
            onChange={(e) => setTransition(parseSlideTransition(e.target.value))}
            disabled={saving}
          >
            {SLIDE_TRANSITIONS.map((id) => (
              <option key={id} value={id}>
                {SLIDE_TRANSITION_SPECS[id].label}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? t('admin.transition.saving') : t('admin.transition.save')}
        </Button>
        <p className="w-full text-sm text-muted-foreground">
          {SLIDE_TRANSITION_SPECS[transition].hint}
        </p>
        {message && (
          <p className="w-full text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
