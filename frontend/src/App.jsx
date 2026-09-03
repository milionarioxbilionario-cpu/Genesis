import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/SuperAdmin/Dashboard';
import OwnerDashboard from './pages/Owner/Dashboard';
import CashierDashboard from './pages/CashierDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/pos" element={<CashierDashboard />} />
        <Route path="/cashier" element={<CashierDashboard />} />
        <Route path="/onboarding" element={<OwnerDashboard />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
