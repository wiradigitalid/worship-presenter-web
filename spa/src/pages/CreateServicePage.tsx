import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import OperatorPageShell from '@/components/OperatorPageShell';
import CreateForm from '@/operator/CreateForm';

type AnnouncementSeed = {
  id?: number | string;
  image_url: string;
  service_id?: number | null;
};

export default function CreateServicePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementSeed[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      setSession(await me.json());
      const res = await fetch('/api/announcements', { credentials: 'same-origin' });
      if (res.ok) {
        const data = (await res.json()) as { items?: AnnouncementSeed[] };
        setAnnouncements(
          (data.items || []).filter((item) => item.service_id == null)
        );
      }
    })();
  }, [navigate]);

  if (!session) return null;

  return (
    <OperatorPageShell>
      <Header isAdmin={session.role === 'admin'} username={session.username} />
      <CreateForm initialAnnouncements={announcements} hymnIndex={[]} />
    </OperatorPageShell>
  );
}
