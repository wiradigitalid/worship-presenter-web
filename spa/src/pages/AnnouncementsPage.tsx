import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import OperatorPageShell from '@/components/OperatorPageShell';
import AnnouncementsManager from '@/operator/AnnouncementsManager';

export default function AnnouncementsPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      setSession(await me.json());
      const res = await fetch('/api/announcements', { credentials: 'same-origin' });
      const data = await res.json();
      setItems(data.items || []);
    })();
  }, [navigate]);
  if (!session) return null;
  return (
    <OperatorPageShell>
      <Header isAdmin={session.role === 'admin'} username={session.username} />
      <AnnouncementsManager initialItems={items} />
    </OperatorPageShell>
  );
}
