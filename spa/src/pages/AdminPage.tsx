import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AccountsManager from '@/operator/admin/AccountsManager';
import WorshipSettings from '@/operator/admin/WorshipSettings';
import SystemSettings from '@/operator/admin/SystemSettings';
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
      <WorshipSettings
        initialTransition={settings.slide_transition}
        initialBibleCode={settings.default_bible_translation}
        initialBibleInstalled={Boolean(settings.default_bible_translation_installed)}
      />
      <SystemSettings
        initialDays={settings.pptx_retention_days}
        initialLocale={settings.ui_locale}
      />
    </div>
  );
}
