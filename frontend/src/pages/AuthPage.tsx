import React, { useState } from 'react';
import { ArrowRight, Lock, Sparkles } from 'lucide-react';
import { api, setStoredToken } from '../services/api';
import { AuthResponse } from '../types';

interface AuthPageProps {
  onAuthenticated: (auth: AuthResponse) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('owner@sharmawholesale.in');
  const [password, setPassword] = useState('VyaparDemo123!');
  const [fullName, setFullName] = useState('Naman Garg');
  const [workspaceName, setWorkspaceName] = useState('Sharma & Sons Wholesale');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let res: AuthResponse;
      if (mode === 'register') {
        try {
          res = await api.register({
            email,
            password,
            full_name: fullName,
            workspace_name: workspaceName,
            seed_demo_data: true,
          });
        } catch (regErr: any) {
          if (regErr.message?.includes('already exists')) {
            res = await api.login({ email, password });
          } else {
            throw regErr;
          }
        }
      } else {
        res = await api.login({ email, password });
      }
      setStoredToken(res.access_token);
      onAuthenticated(res);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLaunch = async () => {
    setLoading(true);
    setError(null);
    const demoEmail = 'owner@sharmawholesale.in';
    const demoPassword = 'VyaparDemo123!';
    try {
      let res: AuthResponse;
      try {
        res = await api.login({ email: demoEmail, password: demoPassword });
      } catch {
        res = await api.register({
          email: demoEmail,
          password: demoPassword,
          full_name: 'Naman Garg',
          workspace_name: 'Sharma & Sons Wholesale',
          city: 'Delhi',
          seed_demo_data: true,
        });
      }
      setStoredToken(res.access_token);
      onAuthenticated(res);
    } catch (err: any) {
      setError(err.message || 'Failed to start demo workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Clean Logo */}
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black text-lg flex items-center justify-center mx-auto shadow-sm">
            V
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Vyapar Memory AI
          </h1>
          <p className="text-xs text-slate-500">
            Commitment & Discrepancy Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          {/* 1-Click Instant Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemoLaunch}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Demo Workspace (50 vs 45 Boxes)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 uppercase font-semibold">
            <div className="h-px bg-slate-200 flex-1" />
            <span>or sign in</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Lock className="w-3 h-3" />
              <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            </button>
          </form>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              {mode === 'login'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
