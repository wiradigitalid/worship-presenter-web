import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SlideshowClient from '@/app/(projected)/services/[id]/slideshow/SlideshowClient';

export default function SlideshowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
      if (!res.ok) {
        navigate('/');
        return;
      }
      setData(await res.json());
    })();
  }, [id, navigate]);

  if (!data) {
    return <div style={{ background: '#000', color: '#fff', minHeight: '100vh' }} />;
  }
  return (
    <SlideshowClient
      serviceId={data.id}
      serviceDate={data.date}
      slides={data.plan || []}
      transition={data.transition || 'fade'}
    />
  );
}
