import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { User, Workspace } from '../types';
import { api } from '../services/api';

export type NavTab = 'dashboard' | 'discrepancies' | 'orders' | 'assistant';

interface LayoutProps {
  user: User;
  workspace: Workspace;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  hasDemoData: boolean;
  openDiscrepanciesCount: number;
  pendingReviewsCount: number;
  onDataMutated: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  user,
  workspace,
  activeTab,
  setActiveTab,
  openDiscrepanciesCount,
  onDataMutated,
  onLogout,
  children,
}) => {
  const [demoLoading, setDemoLoading] = useState(false);

  const handleResetDemo = async () => {
    setDemoLoading(true);
    try {
      await api.resetDemoData(true);
      onDataMutated();
    } finally {
      setDemoLoading(false);
    }
  };

  const navItems: {
    id: NavTab;
    label: string;
    sub: string;
    icon: React.FC<{ className?: string }>;
    emoji: string;
    badge?: number;
    activeColor: string;
    badgeColor?: string;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sub: 'Mukhya Page & 4-Step Story',
      icon: LayoutDashboard,
      emoji: '📊',
      activeColor: 'from-violet-600 to-indigo-600',
    },
    {
      id: 'discrepancies',
      label: '50 vs 45 Mismatch',
      sub: '5 Missing Boxes (Alert)',
      icon: AlertTriangle,
      emoji: '🚨',
      badge: openDiscrepanciesCount,
      activeColor: 'from-rose-500 to-red-600',
      badgeColor: 'bg-rose-500',
    },
    {
      id: 'orders',
      label: 'Orders & Bills',
      sub: 'Sabhi Orders aur Challans',
      icon: Package,
      emoji: '📦',
      activeColor: 'from-emerald-500 to-teal-600',
    },
    {
      id: 'assistant',
      label: 'AI Se Poocho',
      sub: 'Instant Answers in Hindi/Eng',
      icon: Bot,
      emoji: '🤖',
      activeColor: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-indigo-50/40 to-purple-50/30 text-slate-900 font-sans">
      {/* Colorful Sidebar */}
      <aside className="w-68 bg-white/95 backdrop-blur-md border-r border-indigo-100/80 flex flex-col justify-between shrink-0 shadow-lg">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-indigo-50 bg-gradient-to-b from-indigo-50/50 to-transparent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                V
              </div>
              <div>
                <span className="font-black text-base bg-gradient-to-r from-indigo-700 via-violet-700 to-pink-600 bg-clip-text text-transparent block leading-tight">
                  Vyapar Memory AI
                </span>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Smart Vyapar OS
                </span>
              </div>
            </div>

            {/* Shop info pill */}
            <div className="mt-4 p-2.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="font-extrabold text-slate-800 truncate">{workspace.name}</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                Delhi
              </span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${item.activeColor} text-white shadow-md shadow-indigo-500/20 scale-[1.02]`
                      : 'text-slate-700 hover:bg-indigo-50/60 hover:text-indigo-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{item.emoji}</span>
                    <div>
                      <p className="text-xs font-extrabold leading-tight">{item.label}</p>
                      <p
                        className={`text-[11px] font-medium ${
                          isActive ? 'text-white/80' : 'text-slate-400'
                        }`}
                      >
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-black animate-pulse ${
                        isActive
                          ? 'bg-white text-rose-600'
                          : 'bg-rose-500 text-white shadow-xs'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-50 bg-gradient-to-t from-slate-50/70 to-transparent flex items-center justify-between text-xs">
          <div className="truncate pr-2">
            <p className="font-bold text-slate-800 truncate">{user.full_name}</p>
            <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
              Owner Active
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Colorful Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100/70 px-6 py-3.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">
                {navItems.find((n) => n.id === activeTab)?.emoji}
              </span>
              <h1 className="text-base font-black text-slate-900">
                {navItems.find((n) => n.id === activeTab)?.label}
              </h1>
            </div>
            <span className="hidden sm:inline-block text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              Sharma & Sons Wholesale
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sharma Case Active</span>
            </span>

            <button
              onClick={handleResetDemo}
              disabled={demoLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-sm shadow-indigo-500/20 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
              <span>Reset Demo</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-6xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
