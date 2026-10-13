import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Clock,
  FileCheck2,
  FileWarning,
  Sparkles,
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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 p-4" />
          ))}
        </div>
        <div className="h-72 bg-white rounded-xl border border-slate-200 p-6" />
      </div>
    );
  }

  const { kpis, open_discrepancies, priority_commitments, pending_tasks, recent_activity } =
    summary;

  const kpiCards = [
    {
      label: 'Open Discrepancies',
      value: kpis.open_discrepancies_count,
      sub: 'Requires evidence review',
      icon: AlertTriangle,
      color: 'text-rose-600 bg-rose-50 border-rose-200',
      tab: 'discrepancies' as NavTab,
    },
    {
      label: 'Pending Orders',
      value: kpis.pending_orders_count,
      sub: 'Active fulfillment tracking',
      icon: ClipboardList,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
      tab: 'orders' as NavTab,
    },
    {
      label: 'Upcoming Deadlines',
      value: kpis.upcoming_deadlines_count,
      sub: 'Calculated in IST',
      icon: CalendarClock,
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      tab: 'orders' as NavTab,
    },
    {
      label: 'Overdue Commitments',
      value: kpis.overdue_tasks_count,
      sub: 'Immediate follow-up needed',
      icon: Clock,
      color: 'text-red-600 bg-red-50 border-red-200',
      tab: 'orders' as NavTab,
    },
    {
      label: 'Extractions Pending Review',
      value: kpis.pending_reviews_count,
      sub: 'Human verification gate',
      icon: FileCheck2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      tab: 'documents' as NavTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => onNavigate(card.tab)}
              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition text-left flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  {card.label}
                </span>
                <div className={`p-2 rounded-lg border ${card.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900">
                  {card.value}
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">{card.sub}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* High-Priority Discrepancy Spotlight */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-sm overflow-hidden">
        <div className="bg-rose-50/80 border-b border-rose-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-rose-600" />
            <h2 className="text-sm font-bold text-rose-950">
              Deterministic Discrepancy Alerts (Order vs. Invoice vs. Delivery Challan)
            </h2>
          </div>
          <button
            onClick={() => onNavigate('discrepancies')}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1"
          >
            <span>Inspect Evidence & Resolve</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {open_discrepancies.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              No active quantity or invoice discrepancies detected in this workspace.
            </div>
          ) : (
            open_discrepancies.map((disc) => (
              <div key={disc.id} className="p-5 hover:bg-slate-50/80 transition">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                          disc.severity === 'high'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {disc.severity} severity
                      </span>
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {disc.order_number}
                      </span>
                      {disc.is_demo && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                          DEMO
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 text-sm font-bold text-slate-900">
                      {disc.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {disc.explanation}
                    </p>
                  </div>

                  {/* Expected vs Actual vs Delta Pill Box */}
                  <div className="flex items-center gap-2 text-xs bg-slate-100 p-2.5 rounded-lg border border-slate-200 shrink-0">
                    <div className="px-2">
                      <span className="text-[10px] uppercase text-slate-500 block">
                        Expected
                      </span>
                      <span className="font-bold text-slate-800">
                        {disc.expected_value}
                      </span>
                    </div>
                    <div className="h-7 w-px bg-slate-300" />
                    <div className="px-2">
                      <span className="text-[10px] uppercase text-slate-500 block">
                        Delivered / Actual
                      </span>
                      <span className="font-bold text-slate-800">
                        {disc.actual_value}
                      </span>
                    </div>
                    <div className="h-7 w-px bg-slate-300" />
                    <div className="px-2">
                      <span className="text-[10px] uppercase text-rose-600 font-semibold block">
                        Discrepancy Delta
                      </span>
                      <span className="font-extrabold text-rose-700">
                        {disc.delta_value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supporting Evidence Chips */}
                {disc.evidence_refs && disc.evidence_refs.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Supporting Evidence:
                    </span>
                    {disc.evidence_refs.map((ev, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                        title={ev.quote}
                      >
                        📄 {ev.filename} ({ev.location}) — <strong>{ev.metric}</strong>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Two-Column Grid: Explainable Priority Commitments & Follow-Up Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Commitments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Explainable Commitment Priority Queue
              </h2>
              <p className="text-xs text-slate-500">
                Ranked deterministically by IST deadline urgency & linked discrepancies
              </p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-indigo-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {priority_commitments.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No commitments recorded yet.
              </div>
            ) : (
              priority_commitments.map((comm) => (
                <div key={comm.id} className="p-4 hover:bg-slate-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {comm.title}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase ${
                        comm.status === 'overdue'
                          ? 'bg-red-100 text-red-800'
                          : comm.status === 'due_soon'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {comm.status.replace('_', ' ')} • Due {comm.due_date}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{comm.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded border border-indigo-100">
                    <span className="font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {comm.priority_reason}
                    </span>
                    <span className="text-slate-500">{comm.party_name}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Follow-Up Tasks & Audit Feed */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Actionable Follow-Up Tasks & Drafts
                </h2>
                <p className="text-xs text-slate-500">
                  Drafts require explicit owner approval before sending
                </p>
              </div>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Review & Approve Drafts</span>
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {pending_tasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No follow-up tasks pending.
                </div>
              ) : (
                pending_tasks.map((task) => (
                  <div key={task.id} className="p-4 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          {task.title}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {task.drafts.length} draft(s)
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Party: {task.party_name} • Due: {task.due_date} • Status:{' '}
                        <strong>{task.status.replace('_', ' ')}</strong>
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigate('tasks')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shrink-0"
                    >
                      Open Drafts
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Audit Activity */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">
                Recent Business Memory & Audit Trail
              </h2>
              <button
                onClick={() => onNavigate('audit')}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                Full Timeline
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {recent_activity.map((ev) => (
                <div key={ev.id} className="px-5 py-2.5 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{ev.summary}</span>
                    <span className="ml-2 text-[11px] text-slate-400">
                      ({ev.action})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {new Date(ev.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
