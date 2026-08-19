import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import AnnouncementsManager from '@/app/(operator)/announcements/AnnouncementsManager';

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <Header isAdmin={session.role === 'admin'} username={session.username} />
        <AnnouncementsManager initialItems={items} />
      </div>
    </div>
  );
}
