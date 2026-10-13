import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  Building2,
  CheckSquare,
  ClipboardList,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
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
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const handleResetDemo = async (reseed: boolean) => {
    setDemoLoading(true);
    setBannerNotice(null);
    try {
      await api.resetDemoData(reseed);
      setBannerNotice(
        reseed
          ? 'Demo scenario reset to fresh state (Sharma Traders: 50 ordered, 50 invoiced, 45 delivered).'
          : 'Synthetic demo records cleared. Real workspace records preserved.'
      );
      onDataMutated();
    } catch (err: any) {
      setBannerNotice(`Error: ${err.message}`);
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
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    {
      id: 'discrepancies',
      label: 'Discrepancy Review',
      icon: AlertTriangle,
      badge: openDiscrepanciesCount,
      badgeColor: 'bg-rose-600 text-white',
    },
    { id: 'orders', label: 'Orders & Commitments', icon: ClipboardList },
    {
      id: 'documents',
      label: 'Documents & Voice',
      icon: FileText,
      badge: pendingReviewsCount,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'assistant', label: 'AI Business Memory', icon: Bot },
    { id: 'tasks', label: 'Tasks & Draft Approvals', icon: CheckSquare },
    { id: 'parties', label: 'Customers & Suppliers', icon: Users },
    { id: 'audit', label: 'Activity & Audit Logs', icon: History },
    { id: 'settings', label: 'Workspace & Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-68 bg-slate-900 text-slate-100 flex flex-col justify-between shrink-0 border-r border-slate-800">
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
                Vyapar Memory
                <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Commitment & Evidence OS</p>
            </div>
          </div>

          {/* Active Workspace Card */}
          <div className="mx-3 my-3 p-3 rounded-lg bg-slate-800/80 border border-slate-700/70">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
              <Building2 className="w-3.5 h-3.5" />
              <span className="truncate">{workspace.name}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span>{workspace.city || 'India'}</span>
              <span className="uppercase px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-semibold">
                {workspace.role}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        item.badgeColor || 'bg-indigo-500 text-white'
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

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">
                {user.full_name}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Demo Data Transparency Banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-amber-900">
            <span className="px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-amber-200 text-amber-950">
              {hasDemoData ? 'DEMO DATA ACTIVE' : 'LIVE WORKSPACE'}
            </span>
            <span>
              {hasDemoData
                ? 'Synthetic sample records (Sharma Traders: 50 ordered / 50 invoiced / 45 delivered) are clearly badged as DEMO and never mixed with real customer activity.'
                : 'No synthetic demo records are currently loaded. You can load the Sharma Traders 50-vs-45 box demo scenario anytime.'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleResetDemo(true)}
              disabled={demoLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${demoLoading ? 'animate-spin' : ''}`} />
              {hasDemoData ? 'Reset Demo Scenario' : 'Load Demo Scenario'}
            </button>
            {hasDemoData && (
              <button
                onClick={() => handleResetDemo(false)}
                disabled={demoLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-white text-slate-700 border border-amber-300 hover:bg-amber-100 disabled:opacity-50 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Clear Demo Data
              </button>
            )}
          </div>
        </div>

        {bannerNotice && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-6 py-2 text-xs text-indigo-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {bannerNotice}
            </span>
            <button
              onClick={() => setBannerNotice(null)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              {navItems.find((n) => n.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500">
              Deterministic rules for quantities & deadlines • Grounded RAG with verbatim source citations • Mandatory human approval gate
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
              Timezone: {workspace.timezone} (IST)
            </span>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
