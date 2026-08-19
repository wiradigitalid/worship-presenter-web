import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ProjectorClient from '@/app/(projected)/services/[id]/present/projector/ProjectorClient';

export default function ProjectorPage() {
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
    return <div style={{ background: '#000', minHeight: '100vh' }} />;
  }
  return (
    <ProjectorClient
      serviceId={data.id}
      slides={data.plan || []}
      transition={data.transition || 'fade'}
    />
  );
}
