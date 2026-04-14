import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function ProtectedRoute({ children, requiredRole }) {
  const [status, setStatus] = useState('loading'); // loading | authorized | unauthorized | wrong-role
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/auth/me`)
      .then(res => {
        setUserRole(res.data.role);
        if (!requiredRole || res.data.role === requiredRole) {
          setStatus('authorized');
        } else {
          setStatus('wrong-role');
        }
      })
      .catch(() => setStatus('unauthorized'));
  }, []);

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#090a0f' }}>
      <span style={{ width: '28px', height: '28px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin 1s linear infinite', display: 'inline-block' }} />
    </div>
  );
  if (status === 'unauthorized') return <Navigate to="/" replace />;
  if (status === 'wrong-role') return <Navigate to={userRole === 'HR' ? '/hr/dashboard' : '/candidate/dashboard'} replace />;
  return children;
}
