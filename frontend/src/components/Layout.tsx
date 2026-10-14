import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckSquare,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  RefreshCw,
  Settings,
  Users,
} from 'lucide-react';
import { User, Workspace } from '../types';
import { api } from '../services/api';

export type NavTab =
  | 'dashboard'
  | 'discrepancies'
  | 'orders'
  | 'documents'
  | 'assistant'
  | 'tasks'
  | 'parties'
  | 'audit'
  | 'settings';

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
  pendingReviewsCount,
  onDataMutated,
  onLogout,
  children,
}) => {
  const [demoLoading, setDemoLoading] = useState(false);

  const handleResetDemo = async (reseed: boolean) => {
    setDemoLoading(true);
    try {
      await api.resetDemoData(reseed);
      onDataMutated();
    } catch {
      //
    } finally {
      setDemoLoading(false);
    }
  };

  const navItems: {
    id: NavTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      id: 'discrepancies',
      label: 'Discrepancies',
      icon: AlertTriangle,
      badge: openDiscrepanciesCount,
      badgeColor: 'bg-rose-500 text-white',
    },
    { id: 'orders', label: 'Orders & Challans', icon: Package },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      badge: pendingReviewsCount,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'assistant', label: 'AI Memory (RAG)', icon: Bot },
    { id: 'tasks', label: 'Follow-Ups & Drafts', icon: CheckSquare },
    { id: 'parties', label: 'Parties', icon: Users },
    { id: 'audit', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 font-sans">
      {/* Sleek Minimalist Sidebar */}
      <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 shadow-sm">
        <div>
          {/* Brand */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">
                V
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                  Vyapar Memory
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Operations AI</span>
              </div>
            </div>
          </div>

          {/* Business Workspace Badge */}
          <div className="mx-3 my-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{workspace.name}</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500 uppercase bg-slate-200/60 px-1.5 py-0.5 rounded">
              {workspace.city || 'DELHI'}
            </span>
          </div>

          {/* Navigation */}
          <nav className="px-2 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        item.badgeColor || 'bg-slate-200 text-slate-700'
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

        {/* User Profile Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-slate-800 truncate">{user.full_name}</p>
            <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean, Non-intrusive Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold text-slate-900">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            {hasDemoData && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full">
                Demo Data
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResetDemo(true)}
              disabled={demoLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
            >
              <RefreshCw className={`w-3 h-3 ${demoLoading ? 'animate-spin' : ''}`} />
              <span>{hasDemoData ? 'Reset Demo' : 'Load Demo'}</span>
            </button>
            {hasDemoData && (
              <button
                onClick={() => handleResetDemo(false)}
                disabled={demoLoading}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
              >
                Clear
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
