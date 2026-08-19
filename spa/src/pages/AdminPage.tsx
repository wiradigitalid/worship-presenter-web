import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AccountsManager from '@/operator/admin/AccountsManager';
import RetentionSettings from '@/operator/admin/RetentionSettings';
import TransitionSettings from '@/operator/admin/TransitionSettings';
import UiLocaleSettings from '@/operator/admin/UiLocaleSettings';

export default function AdminPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401 || me.status === 403) {
        navigate('/login');
        return;
      }
      const s = await me.json();
      if (s.role !== 'admin') {
        navigate('/');
        return;
      }
      setSession(s);
      const acc = await fetch('/api/admin/accounts', { credentials: 'same-origin' });
      setAccounts(((await acc.json()) as { accounts: any[] }).accounts || []);
      const st = await fetch('/api/admin/settings', { credentials: 'same-origin' });
      setSettings(await st.json());
    })();
  }, [navigate]);
  if (!session || !settings) return null;
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <Header isAdmin username={session.username} />
        <AccountsManager initialAccounts={accounts} />
        <RetentionSettings initialDays={settings.pptx_retention_days} />
        <TransitionSettings initialTransition={settings.slide_transition} />
        <UiLocaleSettings initialLocale={settings.ui_locale} />
      </div>
    </div>
  );
}
