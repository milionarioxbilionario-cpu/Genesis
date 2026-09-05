import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RequestAccount from './pages/RequestAccount';
import AdminDashboard from './pages/SuperAdmin/Dashboard';
import OwnerDashboard from './pages/Owner/Dashboard';
import DeviceKeys from './pages/Owner/DeviceKeys';
import CashierDashboard from './pages/CashierDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/request-account" element={<RequestAccount />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/owner/device-keys" element={<DeviceKeys />} />
        <Route path="/pos" element={<CashierDashboard />} />
        <Route path="/cashier" element={<CashierDashboard />} />
        <Route path="/onboarding" element={<OwnerDashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
