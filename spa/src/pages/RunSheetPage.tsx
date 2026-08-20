import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Link from '@/components/Link';
import EditForm from '@/operator/EditForm';
import SyncArtifactButton from '@/operator/SyncArtifactButton';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n/operator';
import { useSession } from '../lib/auth/SessionProvider';

export default function RunSheetPage() {
  const { id } = useParams();
  const { session } = useSession();
  const { t } = useT();
  const [svc, setSvc] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
      if (res.status === 404) {
        setSvc('missing');
        return;
      }
      const data = await res.json();
      setSvc(data);
      const anns = await fetch('/api/announcements', { credentials: 'same-origin' });
      const annData = await anns.json();
      setAnnouncements(annData.items || []);
    })();
  }, [id]);

  if (svc === 'missing') return <Navigate to="/" replace />;
  if (!svc || !session) return null;

  const isAdmin = session.role === 'admin';
  const images = svc.images_payload && typeof svc.images_payload === 'object' ? svc.images_payload : {};
  const serviceAnns = announcements.filter(
    (a: { service_id: number | null }) => a.service_id == null || a.service_id === svc.id
  );

  const actionClass = cn(buttonVariants({ variant: 'outline' }), 'h-auto px-3 py-2');

  return (
    <>
      <div className="mb-6">
        <Link href="/" className={buttonVariants({ variant: 'link' })}>
          {t('edit.actions.back')}
        </Link>
      </div>
      <header className="mb-8 flex flex-col gap-4 border-b border-border/80 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Run-Sheet: {svc.date || svc.id}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">Service ID: {svc.id}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/services/${svc.id}/slideshow`}
            target="_blank"
            rel="noreferrer"
            className={actionClass}
          >
            {t('edit.actions.preview')}
          </Link>
          <Link href={`/services/${svc.id}/present`} className={actionClass}>
            {t('edit.actions.present')}
          </Link>
          {isAdmin ? (
            <SyncArtifactButton serviceId={svc.id} updatedAt={svc.updated_at} />
          ) : null}
          <a
            href={`/api/services/${svc.id}/pptx`}
            download
            aria-label={t('edit.actions.downloadPptx')}
            className={cn(buttonVariants({ variant: 'default' }), 'h-auto px-3 py-2')}
          >
            {t('edit.actions.downloadPptx')}
          </a>
        </div>
      </header>
      <EditForm
        id={svc.id}
        initialPayload={svc.raw_payload || ''}
        initialParsed={svc.parsed_data}
        initialSermonGraphicUrl={images.sermonGraphicUrl || ''}
        initialFamilyPhotoUrl={images.familyPhotoUrl || ''}
        initialYouthPhotoUrl={images.youthPhotoUrl || ''}
        initialAnnouncements={serviceAnns}
        initialUpdatedAt={svc.updated_at}
      />
    </>
  );
}
