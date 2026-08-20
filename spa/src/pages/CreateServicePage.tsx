import { useEffect, useState } from 'react';
import CreateForm from '@/operator/CreateForm';

type AnnouncementSeed = {
  id?: number | string;
  image_url: string;
  service_id?: number | null;
};

export default function CreateServicePage() {
  const [announcements, setAnnouncements] = useState<AnnouncementSeed[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/announcements', { credentials: 'same-origin' });
      if (res.ok) {
        const data = (await res.json()) as { items?: AnnouncementSeed[] };
        setAnnouncements(
          (data.items || []).filter((item) => item.service_id == null)
        );
      }
    })();
  }, []);

  return <CreateForm initialAnnouncements={announcements} hymnIndex={[]} />;
}
