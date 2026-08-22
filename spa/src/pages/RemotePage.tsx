import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import RemoteOperator from '@/operator/present/RemoteOperator';

export default function RemotePage() {
  const { id } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
        if (!active) return;
        if (!res.ok) {
          setData('missing');
          setLoading(false);
          return;
        }
        const json = await res.json();
        if (!active) return;
        setData(json);
        setLoading(false);
      } catch {
        if (!active) return;
        setData('missing');
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (data === 'missing') return <Navigate to="/" replace />;
  if (loading || !data) {
    return (
      <div className="dark min-h-dvh bg-background text-foreground flex items-center justify-center p-4">
        <p className="text-xs text-muted-foreground font-mono">Loading service…</p>
      </div>
    );
  }

  return (
    <RemoteOperator
      serviceId={data.id}
      serviceDate={data.date}
      slides={data.plan || []}
      planIdentity={typeof data.plan_identity === 'string' ? data.plan_identity : ''}
      transition={data.transition || 'fade'}
    />
  );
}
