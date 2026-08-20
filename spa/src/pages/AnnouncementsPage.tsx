import { useEffect, useState } from 'react';
import AnnouncementsManager from '@/operator/AnnouncementsManager';

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch('/api/announcements', { credentials: 'same-origin' });
      const data = await res.json();
      setItems(data.items || []);
    })();
  }, []);
  return <AnnouncementsManager initialItems={items} />;
}
