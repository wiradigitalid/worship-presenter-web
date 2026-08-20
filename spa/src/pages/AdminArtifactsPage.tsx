import { Navigate } from 'react-router-dom';
import ArtifactEditor from '@/components/admin/ArtifactEditor';
import { useSession } from '../lib/auth/SessionProvider';

export default function AdminArtifactsPage() {
  const { session } = useSession();
  if (!session) return null;
  if (session.role !== 'admin') return <Navigate to="/" replace />;
  return <ArtifactEditor />;
}
