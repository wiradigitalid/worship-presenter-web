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
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-end gap-3">
          <div className="shrink-0">
            <Label className="mb-1.5 block" htmlFor="slide-transition">
              {t('admin.transition.label')}
            </Label>
            <Select
              value={transition}
              onValueChange={(v) => setTransition(parseSlideTransition(v))}
              disabled={saving}
            >
              <SelectTrigger id="slide-transition" className="w-44">
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
          </div>
          <Button onClick={() => void save()} disabled={saving} className="shrink-0">
            {saving ? t('admin.transition.saving') : t('admin.transition.save')}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          {SLIDE_TRANSITION_SPECS[transition].hint}
        </p>
        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
}
