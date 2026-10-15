import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  Lock,
  Mail,
  MessageSquare,
  Package,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
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
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Dynamic ambient color glow orbs */}
      <div className="w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] absolute -top-40 -left-40 pointer-events-none" />
      <div className="w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] absolute -bottom-40 -right-40 pointer-events-none" />
      <div className="w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

      {/* Main Glass Card (Split Layout) */}
      <div className="relative z-10 max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden border border-white/10 shadow-2xl shadow-indigo-500/10 bg-slate-900/80 backdrop-blur-2xl">
        
        {/* LEFT COLUMN: The Visual Showcase & Value Story (7 cols) */}
        <div className="lg:col-span-7 p-8 md:p-10 flex flex-col justify-between bg-gradient-to-br from-indigo-950/80 via-purple-950/40 to-slate-950/90 border-b lg:border-b-0 lg:border-r border-white/10 space-y-8">
          {/* Header Brand */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/30">
                V
              </div>
              <div>
                <span className="font-black text-lg bg-gradient-to-r from-white via-indigo-200 to-pink-200 bg-clip-text text-transparent block leading-tight">
                  Vyapar Memory AI
                </span>
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  भारत का #1 AI व्यापार रक्षक (Digital Munim)
                </span>
              </div>
            </div>

            {/* Main Headline */}
            <div className="mt-8 space-y-3">
              <div className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs px-3.5 py-1 rounded-full font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Loss Guarantee • 100% Evidence Based</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                व्यापार का पक्का हिसाब, <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                  1 रुपये का भी नुकसान नहीं!
                </span>
              </h1>
              <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
                व्हाट्सएप आर्डर, जीएसटी टैक्स इनवॉइस और टेम्पो चालान का कंप्यूटर मिलान करता है।
                अगर 50 डिब्बे का बिल कटा और टेम्पो से सिर्फ 45 डिब्बे पहुंचे, तो यह तुरंत पकड़ लेता है!
              </p>
            </div>
          </div>

          {/* Floating Sharma Traders Case Card */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-indigo-400" />
                Live Demo Case: Sharma Traders
              </span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-2 py-0.5 rounded-full">
                🚨 5 Box Missing Alert
              </span>
            </div>

            {/* 3 mini step chips */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-xl">
                <span className="text-[10px] text-emerald-400 font-bold block">1. Order</span>
                <span className="font-black text-white text-xs">50 Boxes</span>
              </div>
              <div className="bg-blue-950/40 border border-blue-500/30 p-2 rounded-xl">
                <span className="text-[10px] text-blue-400 font-bold block">2. Bill</span>
                <span className="font-black text-white text-xs">50 Boxes</span>
              </div>
              <div className="bg-amber-950/40 border border-amber-500/30 p-2 rounded-xl">
                <span className="text-[10px] text-amber-400 font-bold block">3. Challan</span>
                <span className="font-black text-amber-300 text-xs">Sirf 45!</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
              <span>Shortfall: <strong>₹12,500 Missing</strong></span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> WhatsApp Draft Ready
              </span>
            </div>
          </div>

          {/* 3 Trust bullets */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>1-Click WhatsApp</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>3 Original Proofs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>AI Munim in Hindi</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 1-Click Fast Entry & Form (5 cols) */}
        <div className="lg:col-span-5 p-8 md:p-10 flex flex-col justify-center space-y-6 bg-slate-900/90">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block mb-1">
              ⚡ Instant Entry
            </span>
            <h2 className="text-xl font-black text-white">
              सीधा ऐप में प्रवेश करें
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              कोई पासवर्ड टाइप करने की ज़रूरत नहीं — नीचे 1-क्लिक बटन दबाएं:
            </p>
          </div>

          {/* THE BIG GLOWING 1-CLICK DEMO BUTTON */}
          <button
            type="button"
            onClick={handleQuickDemoLaunch}
            disabled={loading}
            className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-black text-xs md:text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-between transition-all transform hover:-translate-y-0.5 active:scale-95 border border-emerald-400/30 group disabled:opacity-50"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl group-hover:scale-110 transition">
                🚀
              </div>
              <div>
                <span className="block text-xs md:text-sm font-black leading-tight">
                  1-CLICK DIRECT DEMO
                </span>
                <span className="block text-[11px] text-emerald-100 font-medium">
                  Sharma Traders Case Live Kholein
                </span>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition" />
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[11px] text-slate-500 uppercase font-semibold">
            <div className="h-px bg-white/10 flex-1" />
            <span>या क्रेडेंशियल्स से खोलें</span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Aapka Naam (Your Name)
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Dukaan / Firm Ka Naam
                  </label>
                  <input
                    type="text"
                    required
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{loading ? 'Please wait...' : mode === 'login' ? 'Sign In (साइन इन करें)' : 'Create Account (खाता बनाएं)'}</span>
            </button>
          </form>

          {/* Toggle Register/Login */}
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition underline"
            >
              {mode === 'login'
                ? "Naya account banana hai? Register karein"
                : 'Pehle se account hai? Sign In karein'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
