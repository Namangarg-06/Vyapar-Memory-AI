import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Building2,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
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
  hasDemoData,
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
    badge?: number;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      sub: 'Mukhya Page',
      icon: LayoutDashboard,
    },
    {
      id: 'discrepancies',
      label: 'Pending Issues (50 vs 45)',
      sub: 'Quantity Mismatch',
      icon: AlertTriangle,
      badge: openDiscrepanciesCount,
    },
    {
      id: 'orders',
      label: 'Orders & Challans',
      sub: 'All Bills & Records',
      icon: Package,
    },
    {
      id: 'assistant',
      label: 'AI Se Poocho (RAG)',
      sub: 'Ask Anything',
      icon: Bot,
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-100 text-slate-900 font-sans">
      {/* Super Simple 4-Tab Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-xs">
        <div>
          {/* Brand Header */}
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm">
                V
              </div>
              <div>
                <span className="font-extrabold text-sm text-slate-900 block leading-tight">
                  Vyapar Memory AI
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Business Operations</span>
              </div>
            </div>

            {/* Shop info */}
            <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 truncate">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-800 truncate">{workspace.name}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Delhi</span>
            </div>
          </div>

          {/* Clean Menu (Only 4 Easy Tabs) */}
          <nav className="p-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <div>
                      <p className="text-xs font-bold leading-tight">{item.label}</p>
                      <p className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {item.sub}
                      </p>
                    </div>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-black ${
                        isActive ? 'bg-white text-indigo-700' : 'bg-rose-500 text-white'
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
        <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="truncate pr-2">
            <p className="font-bold text-slate-800 truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-400">Owner Login</p>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-50"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Simple Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-extrabold text-slate-900">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <span className="text-xs text-slate-400">• Sharma & Sons Wholesale</span>
          </div>

          <button
            onClick={handleResetDemo}
            disabled={demoLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
            <span>Reset Sharma Traders Demo</span>
          </button>
        </header>

        {/* Body */}
        <main className="flex-1 p-6 overflow-y-auto max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
