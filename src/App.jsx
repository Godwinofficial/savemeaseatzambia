import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/w/:slug" element={<Wedding />} />
        <Route path="/wedding" element={<Wedding />} />
        <Route path="/wedding.html" element={<Wedding />} />
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
