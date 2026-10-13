import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  MessageSquarePlus,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { api } from '../services/api';
import { Discrepancy } from '../types';
import { NavTab } from '../components/Layout';

interface DiscrepanciesPageProps {
  onNavigate: (tab: NavTab) => void;
  onDataMutated: () => void;
}

export const DiscrepanciesPage: React.FC<DiscrepanciesPageProps> = ({
  onNavigate,
  onDataMutated,
}) => {
  const [discrepancies, setDiscrepancies] = useState<Discrepancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchDiscrepancies = async () => {
    setLoading(true);
    try {
      const data = await api.getDiscrepancies();
      setDiscrepancies(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscrepancies();
  }, []);

  const handleRescan = async () => {
    setScanning(true);
    try {
      const data = await api.scanDiscrepancies();
      setDiscrepancies(data);
      onDataMutated();
    } finally {
      setScanning(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await api.updateDiscrepancyStatus(id, newStatus);
    await fetchDiscrepancies();
    onDataMutated();
  };

  const filtered = discrepancies.filter((d) =>
    statusFilter === 'all' ? true : d.status === statusFilter
  );

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>Deterministic Quantity & Invoice Discrepancy Engine</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatically compares Ordered Qty vs. Invoiced Qty vs. Delivered Challan Qty and attaches verbatim document citations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold bg-white"
          >
            <option value="all">All Statuses ({discrepancies.length})</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>

          <button
            onClick={handleRescan}
            disabled={scanning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>Re-Scan All Orders</span>
          </button>
        </div>
      </div>

      {/* Discrepancy Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm text-slate-500">
          Loading discrepancy records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">
            No Discrepancies Matching Filter
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            All orders, invoices, and delivery challans are currently reconciled.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filtered.map((disc) => (
            <div
              key={disc.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`text-xs font-bold uppercase px-2.5 py-0.5 rounded ${
                      disc.severity === 'high'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {disc.severity} risk
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Order: {disc.order_number}
                  </span>
                  <span className="text-xs font-semibold text-slate-700">
                    Party: {disc.party_name}
                  </span>
                  {disc.is_demo && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-200 text-amber-950">
                      DEMO DATA
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Status:</span>
                  <select
                    value={disc.status}
                    onChange={(e) => handleStatusChange(disc.id, e.target.value)}
                    className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="open">Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="followup_drafted">Follow-Up Drafted</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-3xl">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{disc.title}</span>
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {disc.explanation}
                    </p>
                    <p className="text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-3 py-1.5 rounded-lg inline-block">
                      Recommended Next Action: {disc.recommended_action}
                    </p>
                  </div>

                  {/* Comparison Matrix */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center shrink-0">
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                        Expected (Order/Invoice)
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {disc.expected_value}
                      </span>
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase text-slate-400 font-semibold block">
                        Actual (Delivery Record)
                      </span>
                      <span className="text-xs font-bold text-slate-800 mt-1 block">
                        {disc.actual_value}
                      </span>
                    </div>
                    <div className="p-2 bg-rose-50 rounded-lg border border-rose-200">
                      <span className="text-[10px] uppercase text-rose-600 font-bold block">
                        Detected Discrepancy
                      </span>
                      <span className="text-xs font-extrabold text-rose-700 mt-1 block">
                        {disc.delta_value}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Verbatim Source Document Evidence Grid */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                    <FileSearch className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Supporting Verbatim Evidence Chain ({disc.evidence_refs.length} Connected Records)</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {disc.evidence_refs.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              📄 {ev.filename}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700 shrink-0">
                              {ev.location}
                            </span>
                          </div>
                          <blockquote className="mt-2 text-xs text-slate-600 italic border-l-2 border-indigo-400 pl-2.5 py-0.5">
                            "{ev.quote}"
                          </blockquote>
                        </div>
                        {ev.metric && (
                          <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                            <span className="text-slate-400">Extracted Metric:</span>
                            <span className="font-bold text-indigo-700">{ev.metric}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Footer */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    onClick={() => onNavigate('assistant')}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Ask AI Assistant About This Evidence
                  </button>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span>Review & Approve Follow-Up Draft</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
