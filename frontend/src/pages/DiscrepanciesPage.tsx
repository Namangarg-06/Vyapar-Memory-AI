import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FileCheck,
  FileText,
  MessageSquare,
  RefreshCw,
  Sparkles,
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

  return (
    <div className="space-y-6">
      {/* Header bar with gradient */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>Mismatch & Shortfall Engine</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black">
            🚨 Detected Business Discrepancies
          </h2>
          <p className="text-rose-100 text-xs md:text-sm mt-1">
            Automated cross-document reconciliation comparing WhatsApp orders, tax invoices, and delivery challans.
          </p>
        </div>

        <button
          onClick={handleRescan}
          disabled={scanning}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-rose-700 hover:bg-rose-50 text-xs font-black shadow-md transition active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>Re-scan Business Records</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs font-bold text-slate-400">
          Scanning business records across orders, invoices, and challans...
        </div>
      ) : discrepancies.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="text-base font-black text-slate-900">All Records Reconciled!</h3>
          <p className="text-xs text-slate-500">
            No quantity or billing mismatches detected in your workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {discrepancies.map((disc) => (
            <div
              key={disc.id}
              className="bg-white rounded-3xl border-2 border-rose-200 shadow-md p-6 space-y-5 transition hover:shadow-lg"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base text-slate-900">
                        {disc.party_name}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {disc.order_number}
                      </span>
                    </div>
                    <p className="text-xs text-rose-600 font-bold mt-0.5">
                      {disc.title}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 px-3 py-1 rounded-full">
                    {disc.delta_value}
                  </span>

                  <select
                    value={disc.status}
                    onChange={(e) => handleStatusChange(disc.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
                  >
                    <option value="open">Status: Open (Action Required)</option>
                    <option value="investigating">Investigating</option>
                    <option value="followup_drafted">Follow-Up Drafted</option>
                    <option value="resolved">Resolved (Cleared)</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              {/* 3 Colorful Metric Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-1">
                  <span className="text-blue-600 block text-xs font-bold">
                    1. Expected (Order / Invoice)
                  </span>
                  <span className="text-xl font-black text-blue-950">
                    {disc.expected_value}
                  </span>
                  <p className="text-[11px] text-blue-700 font-medium">Billed in Tax Invoice</p>
                </div>

                <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl space-y-1">
                  <span className="text-amber-700 block text-xs font-bold">
                    2. Actual Delivered (Challan)
                  </span>
                  <span className="text-xl font-black text-amber-950">
                    {disc.actual_value}
                  </span>
                  <p className="text-[11px] text-amber-800 font-medium">Received by Customer</p>
                </div>

                <div className="bg-rose-50 border border-rose-300 p-4 rounded-2xl space-y-1">
                  <span className="text-rose-600 block text-xs font-bold">
                    3. Shortfall / Discrepancy
                  </span>
                  <span className="text-xl font-black text-rose-600">
                    {disc.delta_value}
                  </span>
                  <p className="text-[11px] text-rose-700 font-bold">Pending Delivery</p>
                </div>
              </div>

              {/* Explanation */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                {disc.explanation}
              </div>

              {/* Evidence Chain */}
              {disc.evidence_refs && disc.evidence_refs.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider block">
                    📄 Original Source Documents (Evidence Chain):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    {disc.evidence_refs.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-1.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span className="truncate">
                            <FileText className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                            {ev.filename}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                          "{ev.quote}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Bar */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <span className="text-xs text-slate-500 font-semibold">
                  Send a pre-formatted WhatsApp reminder directly from the Dashboard.
                </span>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 transition active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp Follow-Up (Dashboard)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
