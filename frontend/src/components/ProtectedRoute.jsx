import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import api from '../utils/api';

// roleRedirects: where to redirect when role mismatch
const roleRedirects = {
  super_admin: '/admin-forbidden',
  owner: '/owner',
  cashier: '/pos',
};

export default function ProtectedRoute({ children, requiredRole }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ok' | 'unauthorized' | 'wrong-role'
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    api.get('/api/auth/me')
      .then((res) => {
        const role = res.data?.user?.role;
        setUserRole(role);
        if (!requiredRole || role === requiredRole) {
          setStatus('ok');
        } else {
          setStatus('wrong-role');
        }
      })
      .catch(() => {
        setStatus('unauthorized');
      });
  }, [requiredRole]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <Navigate to="/login" replace />;
  }

  if (status === 'wrong-role') {
    const redirect = roleRedirects[userRole] || '/login';
    return <Navigate to={redirect} replace />;
  }

  return children;
}
