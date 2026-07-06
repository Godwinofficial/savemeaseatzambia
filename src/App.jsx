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
// Wedding Invitation Templates
import TropicalElegance from './templates/wedding/TropicalElegance';
import GoldenRomance from './templates/wedding/GoldenRomance';
import BotanicalOlive from './templates/wedding/BotanicalOlive';
import DefaultElegance from './templates/wedding/DefaultElegance';
import TerracottaEarth from './templates/wedding/TerracottaEarth';
import TemplatesGallery from './pages/TemplatesGallery/TemplatesGallery';
import TemplatePreviewWrapper from './components/TemplatePreviewWrapper';
import './App.css';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
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

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/addWedding" element={<ProtectedRoute><AddWedding /></ProtectedRoute>} />
        <Route path="/editWedding/:id" element={<ProtectedRoute><AddWedding /></ProtectedRoute>} />
        <Route path="/addBirthday" element={<ProtectedRoute><AddBirthday /></ProtectedRoute>} />
        <Route path="/editBirthday/:id" element={<ProtectedRoute><AddBirthday /></ProtectedRoute>} />
        <Route path="/addBridalShower" element={<ProtectedRoute><AddBridalShower /></ProtectedRoute>} />
        <Route path="/editBridalShower/:id" element={<ProtectedRoute><AddBridalShower /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
