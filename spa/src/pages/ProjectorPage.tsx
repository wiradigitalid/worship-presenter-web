import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectorClient from '@/projected/ProjectorClient';
import ProjectedNotFound from '../projected/ProjectedNotFound';
import ProjectedError from '../projected/ProjectedError';

export default function ProjectorPage() {
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
    return <div style={{ background: '#000', minHeight: '100vh' }} />;
  }
  return (
    <ProjectorClient
      serviceId={data.id}
      slides={data.plan || []}
      planIdentity={typeof data.plan_identity === 'string' ? data.plan_identity : ''}
      transition={data.transition || 'fade'}
    />
  );
}
