import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ThemeProvider from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import OperatorDocumentLang from './OperatorDocumentLang';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CreateServicePage from './pages/CreateServicePage';
import RunSheetPage from './pages/RunSheetPage';
import PresentPage from './pages/PresentPage';
import SlideshowPage from './pages/SlideshowPage';
import ProjectorPage from './pages/ProjectorPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import AdminPage from './pages/AdminPage';
import AdminArtifactsPage from './pages/AdminArtifactsPage';

export default function App() {
  const loc = useLocation();
  const projected =
    loc.pathname.endsWith('/slideshow') || loc.pathname.endsWith('/projector');

  const routes = (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<DashboardPage />} />
      <Route path="/services/new" element={<CreateServicePage />} />
      <Route path="/services/:id" element={<RunSheetPage />} />
      <Route path="/services/:id/present" element={<PresentPage />} />
      <Route path="/services/:id/present/projector" element={<ProjectorPage />} />
      <Route path="/services/:id/slideshow" element={<SlideshowPage />} />
      <Route path="/announcements" element={<AnnouncementsPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/artifacts" element={<AdminArtifactsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );

  if (projected) {
    return <div className="projected-root">{routes}</div>;
  }
  return (
    <ThemeProvider>
      <OperatorDocumentLang />
      <Toaster />
      <div className="min-h-full">{routes}</div>
    </ThemeProvider>
  );
}
