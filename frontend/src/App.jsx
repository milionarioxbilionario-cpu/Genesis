import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CashierLogin from './pages/CashierLogin';
import ResetPassword from './pages/ResetPassword';
import RequestAccount from './pages/RequestAccount';
import OwnerDashboard from './pages/Owner/Dashboard';
import Products from './pages/Owner/Products';
import Stock from './pages/Owner/Stock';
import Suppliers from './pages/Owner/Suppliers';
import DeviceKeys from './pages/Owner/DeviceKeys';
import Employees from './pages/Owner/Employees';
import Debts from './pages/Owner/Debts';
import Goals from './pages/Owner/Goals';
import Settings from './pages/Owner/Settings';
import AuditLogViewer from './pages/Owner/AuditLogViewer';
import DailyReport from './pages/Owner/Reports/DailyReport';
import WeeklyReport from './pages/Owner/Reports/WeeklyReport';
import MonthlyReport from './pages/Owner/Reports/MonthlyReport';
import OnboardingWizard from './pages/OnboardingWizard';
import ProtectedRoute from './components/ProtectedRoute';
import PosGate from './components/PosGate';
import Hub from './pages/Hub';
import { ToastProvider } from './components/ui';

// CRM layout and demo UI assets
import CRMLayout from './layouts/CRMLayout';
import './ui/mockData.js';

function App() {
  return (
    <Router>
      <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/cashier/login" element={<CashierLogin />} />
        <Route path="/admin/login" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ResetPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/request-account" element={<RequestAccount />} />

        <Route path="/admin" element={<Navigate to="/login" replace />} />
        <Route path="/super-admin" element={<Navigate to="/login" replace />} />
        <Route path="/owner" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><OwnerDashboard /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/products" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Products /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/stock" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Stock /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/suppliers" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Suppliers /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/cashiers" element={<Navigate to="/hub" replace />} />
        <Route path="/owner/device-keys" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><DeviceKeys /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/employees" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Employees /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/debts" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Debts /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/goals" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Goals /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/settings" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><Settings /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/audit" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><AuditLogViewer /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/reports" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><DailyReport /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/reports/daily" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><DailyReport /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/reports/weekly" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><WeeklyReport /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/owner/reports/monthly" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><MonthlyReport /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/onboarding" element={
          <ProtectedRoute requiredRole="owner">
            <CRMLayout><OnboardingWizard /></CRMLayout>
          </ProtectedRoute>
        } />
        <Route path="/cashier" element={<Navigate to="/pos" replace />} />
        <Route path="/pos" element={<PosGate />} />
        <Route path="/hub" element={<ProtectedRoute requiredRole="owner"><Hub /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
