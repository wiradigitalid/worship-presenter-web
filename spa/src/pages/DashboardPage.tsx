import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ServicesList from '@/app/(operator)/ServicesList';

type Session = { username: string; role: string };

export default function DashboardPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [services, setServices] = useState<
    { id: number; date: string; parsed_data: string | null; created_at: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      const s = (await me.json()) as Session;
      setSession(s);
      const res = await fetch('/api/services', { credentials: 'same-origin' });
      const data = (await res.json()) as {
        services: { id: number; date: string; parsed_data: unknown; created_at: string }[];
      };
      setServices(
        (data.services || []).map((svc) => ({
          id: svc.id,
          date: svc.date,
          created_at: svc.created_at,
          parsed_data:
            typeof svc.parsed_data === 'string'
              ? svc.parsed_data
              : svc.parsed_data
                ? JSON.stringify(svc.parsed_data)
                : null,
        }))
      );
    })();
  }, [navigate]);

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-5xl mx-auto">
        <Header isAdmin={session.role === 'admin'} username={session.username} />
        <ServicesList services={services} />
      </div>
    </div>
  );
}
