import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  FileText,
  MessageSquare,
  Package,
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { NavTab } from '../components/Layout';

interface DashboardPageProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  loading,
  onNavigate,
}) => {
  if (loading || !summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-white rounded-xl border border-slate-200" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-xl border border-slate-200" />
      </div>
    );
  }

  const { kpis, open_discrepancies, priority_commitments, pending_tasks } = summary;

  return (
    <div className="space-y-6">
      {/* 4 Clean Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigate('discrepancies')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 text-left transition shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Discrepancies</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600">
              {kpis.open_discrepancies_count}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">attention needed</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 text-left transition shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Active Orders</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">
              {kpis.pending_orders_count}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">in fulfillment</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-amber-300 text-left transition shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Commitments Due</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">
              {kpis.upcoming_deadlines_count}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">IST deadlines</span>
          </div>
        </button>

        <button
          onClick={() => onNavigate('documents')}
          className="bg-white p-4 rounded-xl border border-slate-200 hover:border-emerald-300 text-left transition shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Documents to Review</span>
            <FileText className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">
              {kpis.pending_reviews_count}
            </span>
            <span className="text-xs text-slate-400 ml-1.5 font-medium">verification queue</span>
          </div>
        </button>
      </div>

      {/* Clean Discrepancy Action Card */}
      {open_discrepancies.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h2 className="text-sm font-bold text-slate-900">
                Active Discrepancies Requiring Action
              </h2>
            </div>
            <button
              onClick={() => onNavigate('discrepancies')}
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>View Evidence Chain</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {open_discrepancies.map((d) => (
              <div key={d.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{d.party_name}</span>
                    <span className="text-xs font-mono text-slate-500">{d.order_number}</span>
                    <span className="text-[10px] font-bold uppercase bg-rose-50 text-rose-700 px-2 py-0.5 rounded">
                      {d.delta_value}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{d.title}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('discrepancies')}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View Proof
                  </button>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Draft WhatsApp</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Clean Summary Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Commitments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Upcoming Commitments</h3>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              All Commitments
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {priority_commitments.slice(0, 4).map((c) => (
              <div key={c.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-800 truncate">{c.title}</p>
                  <p className="text-[11px] text-slate-400">{c.party_name}</p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 uppercase ${
                    c.status === 'overdue'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {c.status.replace('_', ' ')} • {c.due_date}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Follow-Ups */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Follow-Up Actions</h3>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              All Tasks
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {pending_tasks.slice(0, 4).map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="truncate pr-2">
                  <p className="font-semibold text-slate-800 truncate">{t.title}</p>
                  <p className="text-[11px] text-slate-400">
                    Party: {t.party_name} • {t.drafts.length} draft(s)
                  </p>
                </div>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold text-xs hover:bg-indigo-100 shrink-0"
                >
                  Open Draft
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
