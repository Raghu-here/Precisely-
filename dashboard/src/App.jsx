import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HRLogin from './pages/Auth/HRLogin';
import CandidateLogin from './pages/Auth/CandidateLogin';
import HRDashboard from './pages/HR/HRDashboard';
import CandidateDashboard from './pages/Candidate/CandidateDashboard';
import NotFound from './pages/NotFound';
import { ErrorBoundary } from './components/ErrorBoundary';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/auth/hr" element={<HRLogin />} />
          <Route path="/auth/candidate" element={<CandidateLogin />} />
          
          {/* Protected routes are protected by backend + basic frontend checks built into the Dashboards */}
          <Route path="/hr/dashboard" element={<ProtectedRoute requiredRole="HR"><HRDashboard /></ProtectedRoute>} />
          <Route path="/candidate/dashboard" element={<ProtectedRoute requiredRole="Candidate"><CandidateDashboard /></ProtectedRoute>} />
          
          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
