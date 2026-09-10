import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import CashierLogin from './pages/CashierLogin';
import ResetPassword from './pages/ResetPassword';
import RequestAccount from './pages/RequestAccount';
import AdminDashboard from './pages/SuperAdmin/Dashboard';
import OwnerDashboard from './pages/Owner/Dashboard';
import OnboardingWizard from './pages/OnboardingWizard';
import CashierDashboard from './pages/CashierDashboard';
import ProtectedRoute from './components/ProtectedRoute';

// CRM layout and demo UI assets
import CRMLayout from './layouts/CRMLayout';
import './ui/mockData.js';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/cashier/login" element={<CashierLogin />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/request-account" element={<RequestAccount />} />

        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="/super-admin" element={<Navigate to="/login" replace />} />
        <Route path="/owner/*" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><OwnerDashboard /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><OnboardingWizard /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/cashier" element={
          <ProtectedRoute requiredRole="cashier">
            <CRMLayout><CashierDashboard /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/pos" element={
          <ProtectedRoute requiredRole="cashier">
            <CRMLayout><CashierDashboard /></CRMLayout>
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
