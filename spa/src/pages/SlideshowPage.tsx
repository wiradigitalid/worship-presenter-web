import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import SlideshowClient from '@/projected/SlideshowClient';
import ProjectedNotFound from '../projected/ProjectedNotFound';
import ProjectedError from '../projected/ProjectedError';

export default function SlideshowPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [unavailable, setUnavailable] = useState<'missing' | 'error' | null>(null);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
      if (res.status === 404) {
        setUnavailable('missing');
        return;
      }
      if (!res.ok) {
        setUnavailable('error');
        return;
      }
      setData(await res.json());
    })();
  }, [id, navigate]);

  if (unavailable === 'missing') return <ProjectedNotFound />;
  if (unavailable === 'error') return <ProjectedError />;
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
