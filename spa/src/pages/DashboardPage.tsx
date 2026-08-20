import { useEffect, useState } from 'react';
import ServicesList from '@/operator/ServicesList';

type ServiceRow = {
  id: number;
  date: string;
  parsed_data: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);

  useEffect(() => {
    (async () => {
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
  }, []);

  return <ServicesList services={services} />;
}
