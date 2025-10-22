import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { user, userProfile, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500 mb-4"></div>
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If onboarding is required and not completed, redirect to onboarding
  if (requireOnboarding && !userProfile?.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // If onboarding is not required but user already completed it, redirect to dashboard
  if (!requireOnboarding && userProfile?.onboarding_completed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
