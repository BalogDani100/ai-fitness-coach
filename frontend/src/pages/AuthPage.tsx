import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest, registerRequest } from '../api';
import { useAuth } from '../auth/AuthContext';

export const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = mode === 'login' ? 'Sign in' : 'Create account';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fn = mode === 'login' ? loginRequest : registerRequest;
      const res = await fn(email, password);
      login(res.token, res.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Something went wrong');
      } else {
        setError('Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-md p-8 rounded-2xl bg-slate-900 border border-slate-700 shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-center">
          AI Fitness Coach
        </h1>
        <p className="text-sm text-slate-400 mb-6 text-center">
          {mode === 'login'
            ? 'Sign in to your account'
            : 'Start your fitness journey'}
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              mode === 'login'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-300'
            }`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${
              mode === 'register'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-800 text-slate-300'
            }`}
            onClick={() => setMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1 text-slate-200">Email</label>
            <input
              type="email"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm mb-1 text-slate-200">Password</label>
            <input
              type="password"
              className="w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 transition-colors"
          >
            {loading ? 'Please wait…' : title}
          </button>
        </form>
      </div>
    </div>
  );
};
