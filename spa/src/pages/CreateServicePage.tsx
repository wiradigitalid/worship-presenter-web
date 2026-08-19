import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import CreateForm from '@/operator/CreateForm';

export default function CreateServicePage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      setSession(await me.json());
    })();
  }, [navigate]);
  if (!session) return null;
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <Header isAdmin={session.role === 'admin'} username={session.username} />
        <CreateForm />
      </div>
    </div>
  );
}
