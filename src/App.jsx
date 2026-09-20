import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home/Home';
import Wedding from './pages/Wedding/Wedding';
import AddWedding from './pages/Wedding/AddWedding';
import AddBirthday from './pages/Birthday/AddBirthday';
import Login from './pages/Admin/Login';
import AdminDashboard from './pages/Admin/AdminDashboard';
import RSVPReport from './pages/Wedding/RSVPReport';
import BirthdayReport from './pages/Birthday/BirthdayReport';
import Birthday from './pages/Birthday/Birthday';
import BridalShower from './pages/BridalShower/BridalShower';
import AddBridalShower from './pages/BridalShower/AddBridalShower';
import BridalShowerReport from './pages/BridalShower/BridalShowerReport';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
// Wedding Invitation Templates
import TropicalElegance from './templates/wedding/TropicalElegance';
import GoldenRomance from './templates/wedding/GoldenRomance';
import BotanicalOlive from './templates/wedding/BotanicalOlive';
import DefaultElegance from './templates/wedding/DefaultElegance';
import TerracottaEarth from './templates/wedding/TerracottaEarth';
import ClientCreateWedding from './pages/Wedding/ClientCreateWedding';
import TemplatesGallery from './pages/TemplatesGallery/TemplatesGallery';
import TemplatePreviewWrapper from './components/TemplatePreviewWrapper';
import MyEvents from './pages/MyEvents/MyEvents';
import EventManage from './pages/MyEvents/EventManage';
import { supabase } from './supabaseClient';
import { isDraftMeaningful, pushDraftToUserAccount } from './utils/draftManager';
import NotificationListener from './components/NotificationListener';
import { Toaster } from 'sonner';
import './App.css';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function App() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user) {
        if (isDraftMeaningful()) {
          console.log('[App] Global login detected with pending draft, syncing to user account...');
          await pushDraftToUserAccount(session.user);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <NotificationListener />
      <Toaster />
      <ErrorBoundary>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/create-event" element={<ClientCreateWedding />} />
          <Route path="/create-wedding" element={<ClientCreateWedding />} />
          <Route path="/create-invitation" element={<ClientCreateWedding />} />
          <Route path="/w/:slug" element={<Wedding />} />
          <Route path="/wedding" element={<Wedding />} />
          <Route path="/wedding.html" element={<Wedding />} />
          {/* Wedding Invitation Template Demos */}
          <Route path="/templates" element={<TemplatesGallery />} />
          <Route path="/templates/tropical-elegance" element={<TemplatePreviewWrapper slug="sasha-chris-2026-10-10-1779303772193"><TropicalElegance /></TemplatePreviewWrapper>} />
          <Route path="/templates/golden-romance" element={<TemplatePreviewWrapper slug="sasha-chris-2026-10-10-1779303772193"><GoldenRomance /></TemplatePreviewWrapper>} />
          <Route path="/templates/botanical-olive" element={<TemplatePreviewWrapper slug="sasha-chris-2026-10-10-1779303772193"><BotanicalOlive /></TemplatePreviewWrapper>} />
          <Route path="/templates/terracotta-earth" element={<TemplatePreviewWrapper slug="sasha-chris-2026-10-10-1779303772193"><TerracottaEarth /></TemplatePreviewWrapper>} />
          <Route path="/templates/default-elegance" element={<TemplatePreviewWrapper slug="sasha-chris-2026-10-10-1779303772193"><DefaultElegance /></TemplatePreviewWrapper>} />
          <Route path="/b/:slug" element={<Birthday />} />
          <Route path="/birthday" element={<Birthday />} />
          <Route path="/bridal-shower/:slug" element={<BridalShower />} />
          <Route path="/bs-report/:slug" element={<BridalShowerReport />} />
          <Route path="/report/:slug" element={<RSVPReport />} />
          <Route path="/b-report/:slug" element={<BirthdayReport />} />
          <Route path="/login" element={<Login />} />

          {/* Protected User Routes */}
          <Route path="/my-events" element={<ProtectedRoute><MyEvents /></ProtectedRoute>} />
          <Route path="/my-events/:slug" element={<ProtectedRoute><EventManage /></ProtectedRoute>} />
          <Route path="/my-events/:slug/edit" element={<ProtectedRoute><ClientCreateWedding /></ProtectedRoute>} />
          <Route path="/edit-event/:slug" element={<ProtectedRoute><ClientCreateWedding /></ProtectedRoute>} />

          {/* Protected Admin Routes (Super Admin Only) */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="super_admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/addWedding" element={<ProtectedRoute requiredRole="super_admin"><AddWedding /></ProtectedRoute>} />
          <Route path="/editWedding/:id" element={<ProtectedRoute requiredRole="super_admin"><AddWedding /></ProtectedRoute>} />
          <Route path="/addBirthday" element={<ProtectedRoute requiredRole="super_admin"><AddBirthday /></ProtectedRoute>} />
          <Route path="/editBirthday/:id" element={<ProtectedRoute requiredRole="super_admin"><AddBirthday /></ProtectedRoute>} />
          <Route path="/addBridalShower" element={<ProtectedRoute requiredRole="super_admin"><AddBridalShower /></ProtectedRoute>} />
          <Route path="/editBridalShower/:id" element={<ProtectedRoute requiredRole="super_admin"><AddBridalShower /></ProtectedRoute>} />
        </Routes>
      </ErrorBoundary>
    </Router>
  );
}

export default App;
