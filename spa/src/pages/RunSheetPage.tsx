import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import OperatorPageShell from '@/components/OperatorPageShell';
import EditForm from '@/operator/EditForm';

export default function RunSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [svc, setSvc] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      setSession(await me.json());
      const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
      if (res.status === 404) {
        navigate('/');
        return;
      }
      setSvc(await res.json());
      const anns = await fetch('/api/announcements', { credentials: 'same-origin' });
      const data = await anns.json();
      setAnnouncements(data.items || []);
    })();
  }, [id, navigate]);

  if (!session || !svc) return null;

  const images = svc.images_payload && typeof svc.images_payload === 'object' ? svc.images_payload : {};
  const serviceAnns = announcements.filter(
    (a: { service_id: number | null }) => a.service_id == null || a.service_id === svc.id
  );

  return (
    <OperatorPageShell>
      <Header isAdmin={session.role === 'admin'} username={session.username} />
      <EditForm
        id={svc.id}
        initialPayload={svc.raw_payload || ''}
        initialParsed={svc.parsed_data}
        initialSermonGraphicUrl={images.sermonGraphicUrl || ''}
        initialFamilyPhotoUrl={images.familyPhotoUrl || ''}
        initialYouthPhotoUrl={images.youthPhotoUrl || ''}
        initialAnnouncements={serviceAnns}
        initialUpdatedAt={svc.updated_at}
      />
    </OperatorPageShell>
  );
}
