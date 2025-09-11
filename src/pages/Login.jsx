import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function onSubmit(e) {
    e.preventDefault();
    // Simple mock auth
    if (form.email && form.password) {
      navigate('/dashboard');
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
          <p className="text-sm text-gray-300">Sign in to access your dashboard</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required value={form.email} onChange={onChange} className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/40 px-4 py-3 outline-none placeholder:text-gray-400" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required value={form.password} onChange={onChange} className="w-full rounded-xl bg-white/10 border border-white/20 focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/40 px-4 py-3 outline-none" placeholder="••••••••" />
          </div>
          <button type="submit" className="btn-primary w-full"><span>Login</span></button>
        </form>
        <p className="text-[11px] text-gray-400 mt-6 text-center">Demo only • any credentials work</p>
      </div>
    </div>
  );
}
