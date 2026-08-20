import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import EditForm from '@/operator/EditForm';
import { useSession } from '../lib/auth/SessionProvider';

export default function RunSheetPage() {
  const { id } = useParams();
  const [svc, setSvc] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
      if (res.status === 404) {
        setSvc('missing');
        return;
      }
      const data = await res.json();
      setSvc(data);
      const anns = await fetch('/api/announcements', { credentials: 'same-origin' });
      const annData = await anns.json();
      setAnnouncements(annData.items || []);
    })();
  }, [id]);

  if (svc === 'missing') return <Navigate to="/" replace />;
  if (!svc) return null;
  const images = svc.images_payload && typeof svc.images_payload === 'object' ? svc.images_payload : {};
  const serviceAnns = announcements.filter(
    (a: { service_id: number | null }) => a.service_id == null || a.service_id === svc.id
  );

  return (
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
  );
}
