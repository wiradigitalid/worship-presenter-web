import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/Header';
import Link from '@/components/Link';
import OperatorPageShell from '@/components/OperatorPageShell';
import EditForm from '@/operator/EditForm';
import SyncArtifactButton from '@/operator/SyncArtifactButton';
import { Button, buttonVariants } from '@/components/ui/button';
import { useT } from '@/lib/i18n/operator';

export default function RunSheetPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useT();
  const [session, setSession] = useState<{ username: string; role: string } | null>(null);
  const [svc, setSvc] = useState<any>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch('/api/session', { credentials: 'same-origin' });
      if (me.status === 401) {
        navigate('/login');
        return;
      }
      setSession(await me.json());
      const res = await fetch(`/api/services/${id}`, { credentials: 'same-origin' });
      if (res.status === 404) {
        navigate('/');
        return;
      }
      setSvc(await res.json());
      const anns = await fetch('/api/announcements', { credentials: 'same-origin' });
      const data = await anns.json();
      setAnnouncements(data.items || []);
    })();
  }, [id, navigate]);

  if (!session || !svc) return null;

  const isAdmin = session.role === 'admin';
  const images = svc.images_payload && typeof svc.images_payload === 'object' ? svc.images_payload : {};
  const serviceAnns = announcements.filter(
    (a: { service_id: number | null }) => a.service_id == null || a.service_id === svc.id
  );

  return (
    <OperatorPageShell>
      <Header isAdmin={isAdmin} username={session.username} />
      <div className="mb-6">
        <Link href="/" className={buttonVariants({ variant: 'link' })}>
          {t('edit.actions.back')}
        </Link>
      </div>
      <header className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-end border-b border-border/80 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Run-Sheet: {svc.date || svc.id}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Service ID: {svc.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            render={
              <Link
                href={`/services/${svc.id}/slideshow`}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            {t('edit.actions.preview')}
          </Button>
          <Button
            variant="outline"
            render={<Link href={`/services/${svc.id}/present`} />}
          >
            {t('edit.actions.present')}
          </Button>
          {isAdmin ? (
            <SyncArtifactButton
              serviceId={svc.id}
              updatedAt={svc.updated_at}
            />
          ) : null}
          <Button
            render={
              <a
                href={`/api/services/${svc.id}/pptx`}
                download
                aria-label={t('edit.actions.downloadPptx')}
              />
            }
          >
            {t('edit.actions.downloadPptx')}
          </Button>
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
    </OperatorPageShell>
  );
}
