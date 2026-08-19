import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PresenterOperator from '@/operator/present/PresenterOperator';

export default function PresentPage() {
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

  if (!data) return null;
  const parsed = data.parsed_data || {};
  return (
    <PresenterOperator
      serviceId={data.id}
      serviceDate={data.date}
      slides={data.plan || []}
      runSheetItems={parsed.items || []}
      transition={data.transition || 'fade'}
    />
  );
}
