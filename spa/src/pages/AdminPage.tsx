import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AccountsManager from '@/operator/admin/AccountsManager';
import RetentionSettings from '@/operator/admin/RetentionSettings';
import TransitionSettings from '@/operator/admin/TransitionSettings';
import BibleTranslationSettings from '@/operator/admin/BibleTranslationSettings';
import UiLocaleSettings from '@/operator/admin/UiLocaleSettings';
import { useSession } from '../lib/auth/SessionProvider';

export default function AdminPage() {
  const { session } = useSession();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    if (!session || session.role !== 'admin') return;
    (async () => {
      const acc = await fetch('/api/admin/accounts', { credentials: 'same-origin' });
      setAccounts(((await acc.json()) as { accounts: any[] }).accounts || []);
      const st = await fetch('/api/admin/settings', { credentials: 'same-origin' });
      setSettings(await st.json());
    })();
  }, [session]);
  if (!session) return null;
  if (session.role !== 'admin') return <Navigate to="/" replace />;
  if (!settings) return null;
  return (
    <div className="space-y-8">
      <AccountsManager initialAccounts={accounts} />
      <RetentionSettings initialDays={settings.pptx_retention_days} />
      <TransitionSettings initialTransition={settings.slide_transition} />
      <BibleTranslationSettings
        initialCode={settings.default_bible_translation}
        initialInstalled={Boolean(settings.default_bible_translation_installed)}
      />
      <UiLocaleSettings initialLocale={settings.ui_locale} />
    </div>
  );
}
