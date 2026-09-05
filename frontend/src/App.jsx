import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import RequestAccount from './pages/RequestAccount';
import AdminDashboard from './pages/SuperAdmin/Dashboard';
import OwnerDashboard from './pages/Owner/Dashboard';
import OnboardingWizard from './pages/OnboardingWizard';
import CashierDashboard from './pages/CashierDashboard';

// CRM layout and demo UI assets
import CRMLayout from './layouts/CRMLayout';
import './ui/mockData.js';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/request-account" element={<RequestAccount />} />
        <Route path="/admin" element={<CRMLayout><AdminDashboard /></CRMLayout>} />
        <Route path="/owner" element={<CRMLayout><OwnerDashboard /></CRMLayout>} />
        <Route path="/onboarding" element={<CRMLayout><OnboardingWizard /></CRMLayout>} />
        <Route path="/pos" element={<CRMLayout><CashierDashboard /></CRMLayout>} />
        <Route path="/cashier" element={<CRMLayout><CashierDashboard /></CRMLayout>} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
