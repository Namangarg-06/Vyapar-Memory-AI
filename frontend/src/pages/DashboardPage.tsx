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
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-20 bg-white/60 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white/60 rounded-3xl" />
          ))}
        </div>
        <div className="h-72 bg-white/60 rounded-3xl" />
      </div>
    );
  }

  const { open_discrepancies } = summary;
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
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* 1. Spacious Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600/10 to-pink-600/10 text-indigo-700 text-xs px-3.5 py-1 rounded-full font-bold mb-1 border border-indigo-200/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>AI Business Operations Guardian</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Good Morning, Naman! 👋
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            {isResolved
              ? 'All orders and delivery accounts are completely reconciled.'
              : 'You have 1 delivery shortfall that needs a quick WhatsApp reminder.'}
          </p>
        </div>

        <span className="self-start sm:self-center inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Tracking Active</span>
        </span>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-3xl text-xs font-bold flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{statusMessage}</span>
          </div>
          <button onClick={() => setStatusMessage('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-black">
            ✕
          </button>
        </div>
      )}

      {/* 2. Three Floating Candy Stat Cards (Vibrant, Colorful & Attractive) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Purple / Violet */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/15 space-y-3 transition transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">
              Discrepancies
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight">
              {isResolved ? '0' : '1 Case'}
            </div>
            <p className="text-xs text-indigo-200 mt-1 font-medium">
              {isResolved ? 'All accounts verified' : 'Requires attention today'}
            </p>
          </div>
        </div>

        {/* Card 2: Vibrant Rose / Red */}
        <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 p-6 rounded-3xl text-white shadow-xl shadow-rose-500/15 space-y-3 transition transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-200 uppercase tracking-wider">
              Missing Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight">
              {isResolved ? '0' : '5 Boxes'}
            </div>
            <p className="text-xs text-rose-100 mt-1 font-medium">
              {isResolved ? 'No missing units' : 'Pending second tempo delivery'}
            </p>
          </div>
        </div>

        {/* Card 3: Emerald / Teal */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 p-6 rounded-3xl text-white shadow-xl shadow-emerald-500/15 space-y-3 transition transform hover:-translate-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              Pending Value
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-black tracking-tight">
              {isResolved ? '₹0' : '₹12,500'}
            </div>
            <p className="text-xs text-emerald-100 mt-1 font-medium">
              {isResolved ? 'Full payment balanced' : 'Shortfall amount at risk'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. The Focal Action Card (Sharma Traders Case) */}
      {isResolved ? (
        <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl border border-slate-200 text-center space-y-3 shadow-md shadow-slate-200/50">
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-black text-slate-900">All Accounts 100% Reconciled</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Great job! No quantity mismatches or missing delivery challans exist in your business right now.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-indigo-100/80 p-6 md:p-8 space-y-6 shadow-xl shadow-indigo-500/5">
          {/* Card Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white font-black text-lg shadow-md shadow-indigo-500/20">
                ST
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">Sharma Traders</h2>
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                    ORD-2026-101
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Jaipur Godown • Premium Biscuits (₹2,500/box)
                </p>
              </div>
            </div>

            <span className="self-start sm:self-center text-xs font-black bg-rose-50 text-rose-700 border-2 border-rose-200 px-3 py-1 rounded-full animate-pulse">
              🚨 5-Box Delivery Shortfall
            </span>
          </div>

          {/* 3 Colorful Visual Pill Cards (Large & Easy to Read) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Pill 1 */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
              <span className="text-xs font-bold text-blue-700 block">1. Tax Invoice Billed</span>
              <div className="text-2xl font-black text-blue-950">50 Boxes</div>
              <p className="text-xs text-blue-800">INV-2026-042 (₹1,25,000)</p>
            </div>

            {/* Pill 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-xs font-bold text-amber-800 block">2. Tempo Delivered</span>
              <div className="text-2xl font-black text-amber-950">45 Boxes</div>
              <p className="text-xs text-amber-900">Challan DC-2026-069</p>
            </div>

            {/* Pill 3 */}
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-1 shadow-xs">
              <span className="text-xs font-bold text-rose-700 block">3. Missing Shortfall</span>
              <div className="text-2xl font-black text-rose-600">-5 Boxes</div>
              <p className="text-xs font-bold text-rose-800">₹12,500 Unfulfilled Value</p>
            </div>
          </div>

          {/* Big Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Choose an action below to resolve this transaction:
            </span>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProofModal(true)}
                className="px-4 py-3 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>View Evidence</span>
              </button>

              <button
                onClick={() => setShowWhatsAppModal(true)}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition transform hover:-translate-y-0.5 active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send WhatsApp Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Sleek AI Question Button */}
      <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-pink-500/10 p-5 rounded-3xl border border-indigo-200/60 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            🤖
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Need Answers on Orders or Deadlines?
            </h3>
            <p className="text-xs text-slate-500">
              Ask your AI Munim in natural English or Hindi anytime.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('assistant')}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
        >
          <span>Open AI Assistant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* POPUP MODAL: WhatsApp Reminder */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Send WhatsApp Reminder
                  </h3>
                  <p className="text-[11px] text-slate-400">Sharma Traders • ORD-2026-101</p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
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
                  className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition ${
                    language === lang
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'english' ? 'English' : lang === 'hinglish' ? 'Hinglish' : 'Hindi'}
                </button>
              ))}
            </div>

            {/* Message Box */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
              {currentMessage}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleWhatsAppSend}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition active:scale-95"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open WhatsApp</span>
                </button>
                <button
                  onClick={handleMarkResolved}
                  className="px-3 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition"
                >
                  Mark Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Proof Documents */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Source Evidence Verification
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Why 5 boxes are missing — verified from 3 separate original documents
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
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
                  ✓ Verified: Customer confirmed an order of 50 boxes.
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
                className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
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
