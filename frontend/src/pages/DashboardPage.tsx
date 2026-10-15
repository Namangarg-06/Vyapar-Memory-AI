import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  MessageSquare,
  Package,
  RefreshCw,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { NavTab } from '../components/Layout';
import { api } from '../services/api';

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
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [language, setLanguage] = useState<'english' | 'hinglish' | 'hindi'>('english');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
        <div className="h-64 bg-white rounded-2xl border border-slate-200" />
      </div>
    );
  }

  const { open_discrepancies, kpis } = summary;
  const isResolved = open_discrepancies.length === 0;
  const mainDisc = open_discrepancies[0];

  const drafts = {
    english: `Dear Sharma Traders, Tax Invoice INV-2026-042 was billed for 50 boxes (₹1,25,000) against Order ORD-2026-101. However, Delivery Challan DC-2026-069 records only 45 boxes received. Kindly confirm dispatch status for the remaining 5 balance boxes (worth ₹12,500). Thank you!`,
    hinglish: `Namaste Sharma ji! 🙏 Aapka Order ORD-2026-101 (50 boxes @ ₹2,500 = ₹1,25,000) ka bill (INV-2026-042) ban chuka hai. Lekin Delivery Challan DC-2026-069 ke mutabik tempo se sirf 45 boxes receive hue hain. Kripya bache hue 5 boxes (₹12,500) ka status confirm kar dijiye. Dhanyawad!`,
    hindi: `नमस्ते शर्मा जी! 🙏 आपके ऑर्डर ORD-2026-101 (50 बॉक्स @ ₹2,500 = ₹1,25,000) का टैक्स इनवॉइस (INV-2026-042) बन चुका है। परन्तु डिलीवरी चालान DC-2026-069 के अनुसार केवल 45 बॉक्स प्राप्त हुए हैं। कृपया शेष 5 बॉक्स (मूल्य ₹12,500) की पुष्टि करें। धन्यवाद!`,
  };

  const currentMessage = drafts[language];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppSend = () => {
    const encoded = encodeURIComponent(currentMessage);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleMarkResolved = async () => {
    if (mainDisc) {
      try {
        await api.updateDiscrepancyStatus(mainDisc.id, 'resolved', 'Follow-up sent via WhatsApp');
        setStatusMessage('Follow-up marked as completed! Discrepancy resolved.');
        setTimeout(() => setStatusMessage(''), 4000);
      } catch {
        // Fallback
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header Bar: Clean & Minimalist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            Executive Operations Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time cross-verification across WhatsApp orders, tax invoices, and delivery challans.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Reconciliation Engine Active
          </span>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* 2. Three Clean, Professional Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Active Discrepancy
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {isResolved ? '0' : '1 Case'}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${isResolved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {isResolved ? 'All Reconciled' : 'Attention Needed'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Sharma Traders (ORD-2026-101)</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Financial Shortfall
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-600">
                {isResolved ? '₹0' : '₹12,500'}
              </span>
              <span className="text-[11px] font-bold text-slate-400">At Risk</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">5 boxes unfulfilled @ ₹2,500/box</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Physical Fulfillment
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">45 / 50</span>
              <span className="text-[11px] font-bold text-slate-400">Boxes (90%)</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Delivery Challan: DC-2026-069</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. The Focal Action Card: Clear, Uncluttered, Launch-Ready */}
      {isResolved ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h2 className="text-base font-black text-slate-900">All Delivery Accounts Reconciled</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are no outstanding quantity mismatches or missing delivery confirmations. All customer records are in sync.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 md:p-8 space-y-6">
          {/* Card Top: Customer & Issue Summary */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">
                  Sharma Traders
                </h2>
                <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold">
                  ORD-2026-101
                </span>
                <span className="text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full">
                  5-Box Shortfall
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Location: Jaipur Warehouse • Item: Premium Biscuits (₹2,500 / box)
              </p>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-xs font-bold text-slate-400 block">Pending Impact</span>
              <span className="text-xl font-black text-rose-600">₹12,500</span>
            </div>
          </div>

          {/* 3-Part Simple Breakdown: Billed vs Received vs Shortfall */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                1. Invoiced in Tax Bill
              </span>
              <div className="text-lg font-black text-slate-900">50 Boxes</div>
              <p className="text-xs text-slate-500">
                Invoice <strong>INV-2026-042</strong> billed full ₹1,25,000 to customer.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                2. Received at Warehouse
              </span>
              <div className="text-lg font-black text-slate-900">45 Boxes</div>
              <p className="text-xs text-slate-500">
                Challan <strong>DC-2026-069</strong> confirms only 45 arrived by truck.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1">
              <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
                3. Unfulfilled Shortfall
              </span>
              <div className="text-lg font-black text-rose-600">5 Boxes Missing</div>
              <p className="text-xs text-rose-700 font-medium">
                ₹12,500 customer balance requires immediate reminder.
              </p>
            </div>
          </div>

          {/* Clean Action Bar: 2 Clear, Obvious Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Verify original documents or send pre-drafted WhatsApp follow-up.
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProofModal(true)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4 text-slate-500" />
                <span>View Evidence (Proof)</span>
              </button>

              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center justify-center gap-2 transition active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick AI Query Bar (Minimalist) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>AI Business Assistant</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Have questions about quantities, GST rates, or delivery dates? Ask the grounded assistant.
          </p>
        </div>

        <button
          onClick={() => onNavigate('assistant')}
          className="px-4 py-2 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 text-xs font-bold shrink-0 transition flex items-center justify-center gap-1.5"
        >
          <span>Ask Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MODAL: Clean WhatsApp Sender */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Send WhatsApp Reminder • Sharma Traders
                </h3>
                <p className="text-[11px] text-slate-400">Order Ref: ORD-2026-101 (Jaipur)</p>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Language:</span>
              {(['english', 'hinglish', 'hindi'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                    language === lang
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'english' ? 'English' : lang === 'hinglish' ? 'Hinglish' : 'Hindi'}
                </button>
              ))}
            </div>

            {/* Message Box */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
              {currentMessage}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsAppSend}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open WhatsApp</span>
                </button>
                <button
                  onClick={handleMarkResolved}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold"
                >
                  Mark Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Clean Evidence / Proof Viewer */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900">
                  Audit Evidence Trail • Sharma Traders
                </h3>
                <p className="text-[11px] text-slate-400">
                  Cross-document verification across WhatsApp chat, Tax Invoice, and Delivery Challan
                </p>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Proof Cards */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>📱 1. WhatsApp Order</span>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                    whatsapp_order_50boxes.txt
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200">
                  "Please dispatch 50 boxes of premium biscuits to Jaipur warehouse, final rate ₹2,500/box. Dispatch by tomorrow."
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Verified: Customer agreed to purchase 50 boxes.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                  <span>🧾 2. Tax Invoice</span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono">
                    tax_invoice_INV-2026-042.pdf
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-slate-200">
                  "Item: Premium Biscuits | Qty: 50 Boxes | Rate: ₹2,500.00 | Total Taxable: ₹1,25,000.00"
                </p>
                <p className="text-[11px] text-blue-700 font-semibold">
                  ✓ Verified: Full 50 boxes (₹1,25,000) billed to customer account.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                  <span>🚚 3. Physical Delivery Challan</span>
                  <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-mono">
                    delivery_challan_DC-2026-069.pdf
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-xl border border-rose-200">
                  "Delivered Quantity: 45 Boxes only. Balance 5 boxes pending for second tempo trip due to truck capacity."
                </p>
                <p className="text-[11px] text-rose-700 font-bold">
                  ⚠️ Discrepancy confirmed: Physical delivery was 5 boxes short!
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Evidence Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
