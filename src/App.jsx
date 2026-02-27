import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Wedding from './pages/Wedding';
import AddWedding from './pages/AddWedding';
import AddBirthday from './pages/AddBirthday';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RSVPReport from './pages/RSVPReport';
import Birthday from './pages/Birthday';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/w/:slug" element={<Wedding />} />
        <Route path="/report/:slug" element={<RSVPReport />} />
        <Route path="/login" element={<Login />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/addWedding" element={
          <ProtectedRoute>
            <AddWedding />
          </ProtectedRoute>
        } />
        <Route path="/editWedding/:id" element={
          <ProtectedRoute>
            <AddWedding />
          </ProtectedRoute>
        } />
        <Route path="/addBirthday" element={
          <ProtectedRoute>
            <AddBirthday />
          </ProtectedRoute>
        } />
        <Route path="/editBirthday/:id" element={
          <ProtectedRoute>
            <AddBirthday />
          </ProtectedRoute>
        } />

        {/* Public Routes */}
        <Route path="/w/:slug" element={<Wedding />} />
        <Route path="/wedding" element={<Wedding />} />
        <Route path="/wedding.html" element={<Wedding />} />
        <Route path="/b/:slug" element={<Birthday />} />
        <Route path="/birthday" element={<Birthday />} />
      </Routes>
    </Router>
  );
}

export default App;
