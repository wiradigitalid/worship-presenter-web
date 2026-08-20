import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import OperatorPageShell from '@/components/OperatorPageShell';
import ArtifactEditor from '@/components/admin/ArtifactEditor';
import { NavigationBlockerProvider } from '@/components/navigation-blocker';

export default function AdminArtifactsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      const s = await me.json();
      if (s.role !== 'admin') {
        navigate('/');
        return;
      }
      setSession(s);
    })();
  }, [navigate]);
  if (!session) return null;
  return (
    <OperatorPageShell innerClassName="max-w-6xl">
      <NavigationBlockerProvider>
        <Header isAdmin username={session.username} />
        <ArtifactEditor />
      </NavigationBlockerProvider>
    </OperatorPageShell>
  );
}
