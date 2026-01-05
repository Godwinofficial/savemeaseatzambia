import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Wedding from './pages/Wedding';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/wedding" element={<Wedding />} />
        {/* Support the old wedding.html matching if possible, but standard routes are better */}
        <Route path="/wedding.html" element={<Wedding />} />
      </Routes>
    </Router>
  );
}

export default App;
