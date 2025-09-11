import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center p-6">
      <div>
        <h1 className="text-6xl font-bold gradient-title mb-4">404</h1>
        <p className="text-gray-300 mb-8">The page you're looking for doesn't exist.</p>
        <a href="/login" className="btn-primary"><span>Go Home</span></a>
      </div>
    </div>
  );
}
