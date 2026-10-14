import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  RefreshCw,
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
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Detected Business Discrepancies
          </h2>
          <p className="text-xs text-slate-500">
            Automated comparison between ordered quantities, invoiced amounts, and delivery challans
          </p>
        </div>
        <button
          onClick={handleRescan}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>Re-scan Records</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading discrepancies...</div>
      ) : discrepancies.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">All Records Reconciled</h3>
          <p className="text-xs text-slate-500">No quantity or billing mismatches detected.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discrepancies.map((disc) => (
            <div
              key={disc.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="font-bold text-sm text-slate-900">{disc.party_name}</span>
                  <span className="text-xs font-mono text-slate-500">({disc.order_number})</span>
                  <span className="text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded">
                    {disc.delta_value}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={disc.status}
                    onChange={(e) => handleStatusChange(disc.id, e.target.value)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium bg-slate-50"
                  >
                    <option value="open">Status: Open</option>
                    <option value="investigating">Investigating</option>
                    <option value="followup_drafted">Follow-Up Drafted</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>
              </div>

              {/* Clean Summary Metric Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 bg-slate-50 p-3 rounded-lg text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Expected (Order / Invoice)</span>
                  <span className="font-bold text-slate-800">{disc.expected_value}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Actual (Challan Delivered)</span>
                  <span className="font-bold text-slate-800">{disc.actual_value}</span>
                </div>
                <div>
                  <span className="text-rose-500 font-semibold block text-[11px]">Discrepancy</span>
                  <span className="font-extrabold text-rose-600">{disc.delta_value}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{disc.explanation}</p>

              {/* Evidence Chain */}
              {disc.evidence_refs && disc.evidence_refs.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Source Document Citations
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    {disc.evidence_refs.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800 truncate">
                            <FileText className="w-3 h-3 inline mr-1 text-slate-400" />
                            {ev.filename}
                          </span>
                          <span className="text-slate-400 font-mono">{ev.location}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 italic truncate">"{ev.quote}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={() => onNavigate('tasks')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Review & Approve WhatsApp Follow-Up</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
