import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { api, setStoredToken } from '../services/api';
import { AuthResponse } from '../types';

interface AuthPageProps {
  onAuthenticated: (auth: AuthResponse) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('owner@sharmawholesale.in');
  const [password, setPassword] = useState('VyaparDemo123!');
  const [fullName, setFullName] = useState('Naman Garg');
  const [workspaceName, setWorkspaceName] = useState('Sharma & Sons Wholesale');
  const [city, setCity] = useState('Delhi');
  const [seedDemo, setSeedDemo] = useState(true);
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
            city,
            seed_demo_data: seedDemo,
          });
        } catch (regErr: any) {
          // If the demo account already exists, seamlessly log in
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
          full_name: 'Naman Garg (Owner)',
          workspace_name: 'Sharma & Sons Wholesale Hub',
          city: 'Chawri Bazar, Delhi',
          seed_demo_data: true,
        });
      }
      setStoredToken(res.access_token);
      onAuthenticated(res);
    } catch (err: any) {
      setError(err.message || 'Failed to launch demo workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row">
      {/* Left Value Proposition Panel */}
      <div className="lg:w-7/12 p-8 lg:p-14 flex flex-col justify-between text-white bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">Vyapar Memory AI</span>
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 font-semibold">
                v1.0 Production MVP
              </span>
            </div>
          </div>

          <h2 className="mt-10 text-3xl lg:text-4xl font-extrabold leading-tight text-white">
            Turn scattered WhatsApp orders, invoices & challans into a{' '}
            <span className="text-indigo-400">connected business memory.</span>
          </h2>
          <p className="mt-4 text-slate-300 text-base leading-relaxed max-w-2xl">
            Built for Indian wholesalers, distributors, and small manufacturers.
            Vyapar Memory AI never guesses financial statuses—deterministic rules
            catch quantity shortfalls, every answer shows verbatim source evidence,
            and every follow-up requires owner approval.
          </p>

          {/* Featured Case Study Card */}
          <div className="mt-8 p-5 rounded-xl bg-slate-800/70 border border-slate-700/80 max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Included End-to-End Demo Scenario (Sharma Traders)
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700">
                <span className="text-slate-400">1. WhatsApp Order</span>
                <p className="text-sm font-bold text-white mt-0.5">50 Boxes Ordered</p>
                <p className="text-slate-400 mt-0.5">ORD-2026-101 • Due Friday</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-700">
                <span className="text-slate-400">2. Tax Invoice PDF</span>
                <p className="text-sm font-bold text-white mt-0.5">50 Boxes Billed</p>
                <p className="text-slate-400 mt-0.5">INV-2026-1042 • ₹1,25,000</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-700/60">
                <span className="text-rose-300">3. Delivery Challan</span>
                <p className="text-sm font-bold text-rose-200 mt-0.5">45 Boxes Delivered</p>
                <p className="text-rose-300 mt-0.5">5 Boxes Shortfall Flagged!</p>
              </div>
            </div>
          </div>

          <ul className="mt-8 space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Multi-tenant workspace isolation & bcrypt + JWT authentication</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Human-in-the-loop review before extracted records enter trusted tables</span>
            </li>
            <li className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Follow-up drafts in English, Hindi & Hinglish with mandatory owner approval</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 text-xs text-slate-400">
          Stack: React 18 • TypeScript • Tailwind CSS • FastAPI • SQLAlchemy 2.0 • Alembic • Hybrid RAG
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="lg:w-5/12 p-8 lg:p-14 flex items-center justify-center bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-200">
          {/* Instant Demo Button */}
          <button
            type="button"
            onClick={handleQuickDemoLaunch}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>Launch Instant Demo Workspace (50 vs 45 Boxes)</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-xs text-slate-400 font-medium uppercase">
              Or use workspace credentials
            </span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`py-2 text-xs font-semibold rounded-md transition ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Workspace
            </button>
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`py-2 text-xs font-semibold rounded-md transition ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Workspace
                    </label>
                    <input
                      type="text"
                      required
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {mode === 'register' && (
              <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={seedDemo}
                  onChange={(e) => setSeedDemo(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span>
                  Pre-load synthetic <strong>Sharma Traders 50-vs-45 Box Discrepancy</strong> demo scenario (clearly labeled as DEMO DATA)
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {loading
                  ? 'Authenticating...'
                  : mode === 'register'
                  ? 'Create Workspace & Continue'
                  : 'Sign In to Workspace'}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
