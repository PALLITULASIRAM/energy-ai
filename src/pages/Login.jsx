import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { user, userProfile, signIn, signUp, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      if (userProfile?.onboarding_completed) {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    }
  }, [user, userProfile, authLoading, navigate]);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setSuccessMessage('');
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await signUp(form.email, form.password);
        if (signUpError) throw signUpError;
        
        // Show success message for signup
        setSuccessMessage(
          '✅ Account created! Please check your email to verify your account before signing in.'
        );
        setForm({ email: '', password: '' });
        // Switch to sign in mode after successful signup
        setTimeout(() => setIsSignUp(false), 3000);
      } else {
        const { error: signInError } = await signIn(form.email, form.password);
        if (signInError) {
          // Check if it's an email verification error
          if (signInError.message?.includes('Email not confirmed') || 
              signInError.message?.includes('email') && signInError.message?.includes('confirm')) {
            throw new Error('Please verify your email address before signing in. Check your inbox for the verification link.');
          }
          throw signInError;
        }
        // Navigation handled by useEffect based on profile status
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="pointer-events-none select-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse [animation-delay:4s]" />
      </div>

      <div className="relative z-10 w-full max-w-md card animate-fade-in">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold gradient-title float-soft mb-2">🤖 AI Energy Oracle</h1>
          <p className="text-sm text-gray-300">{isSignUp ? 'Create your account' : 'Sign in to access your dashboard'}</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3 text-sm text-green-400">
              {successMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              required 
              value={form.email} 
              onChange={onChange}
              disabled={loading || authLoading}
              className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 px-4 py-3 outline-none placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="you@example.com" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input 
              id="password" 
              name="password" 
              type="password" 
              required 
              value={form.password} 
              onChange={onChange}
              disabled={loading || authLoading}
              className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/40 px-4 py-3 outline-none disabled:opacity-50 disabled:cursor-not-allowed" 
              placeholder="••••••••" 
            />
            {isSignUp && (
              <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters</p>
            )}
          </div>
          <button 
            type="submit" 
            disabled={loading || authLoading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Login')}</span>
          </button>
        </form>
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccessMessage('');
            }}
            disabled={loading || authLoading}
            className="text-sm text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
        
        {!isSignUp && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400">
              💡 Tip: Make sure to verify your email after signing up
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
