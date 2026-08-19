import { useRouter } from '@/lib/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n/operator';

export default function DeleteButton({
  id,
  updatedAt,
}: {
  id: number;
  updatedAt: string;
}) {
  const { t } = useT();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(t('service.delete.confirm'))) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated_at: updatedAt }),
      });
      if (res.status === 409) {
        throw new Error(t('service.delete.conflict'));
      }
      if (!res.ok) {
        throw new Error(t('service.delete.failed'));
      }
      router.push('/');
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('service.delete.failed'));
      console.error(e);
      setIsDeleting(false);
    }
  };

  return (
    <Button
      onClick={handleDelete}
      disabled={isDeleting}
      variant="destructive"
    >
      {isDeleting ? t('service.delete.deleting') : t('service.delete.label')}
    </Button>
  );
}
