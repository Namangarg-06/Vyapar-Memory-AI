import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileCheck,
  FileText,
  MessageSquare,
  Package,
  RefreshCw,
  Send,
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
  // Modal states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [language, setLanguage] = useState<'hinglish' | 'hindi' | 'english'>('hinglish');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (loading || !summary) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-44 bg-white rounded-2xl border border-slate-200" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-28 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const { open_discrepancies } = summary;
  const mainDiscrepancy = open_discrepancies.find((d) => d.order_number === 'ORD-2026-101') || open_discrepancies[0];

  // Pre-formatted messages for WhatsApp follow-up
  const drafts = {
    hinglish: `Namaste Sharma ji, aapka Order ORD-2026-101 (50 boxes @ ₹2,500 = ₹1,25,000) ka bill (INV-2026-042) ban chuka hai.\n\nLekin Delivery Challan DC-2026-069 ke mutabik sirf 45 boxes receive hue hain.\n\nKripya bache hue 5 boxes (worth ₹12,500) ka delivery confirmation bhej dijiye. Dhanyawad!`,
    hindi: `नमस्ते शर्मा जी, आपके ऑर्डर ORD-2026-101 (50 बॉक्स @ ₹2,500 = ₹1,25,000) का टैक्स इनवॉइस (INV-2026-042) बन चुका है।\n\nपरन्तु डिलीवरी चालान DC-2026-069 के अनुसार केवल 45 बॉक्स प्राप्त हुए हैं।\n\nकृपया शेष 5 बॉक्स (मूल्य ₹12,500) की डिलीवरी की पुष्टि यथाशीघ्र करें। धन्यवाद!`,
    english: `Dear Sharma Traders, Tax Invoice INV-2026-042 was billed for 50 boxes (₹1,25,000) against Order ORD-2026-101.\n\nHowever, Delivery Challan DC-2026-069 records only 45 boxes delivered.\n\nKindly confirm dispatch status for the remaining 5 balance boxes (worth ₹12,500). Thank you!`,
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
    if (mainDiscrepancy) {
      try {
        await api.updateDiscrepancyStatus(mainDiscrepancy.id, 'resolved', 'Follow-up sent via WhatsApp');
        setStatusMessage('Follow-up recorded successfully!');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch (e) {
        // Fallback
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner: Simple, Clear, Indian Vyapar context */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-indigo-500/30 text-indigo-100 text-xs px-3 py-1 rounded-full font-semibold border border-indigo-400/30 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Demo Case • Sharma Traders
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight">
              Sharma Traders: 50 Box vs 45 Box Discrepancy
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl font-normal leading-relaxed">
              ऑर्डर 50 बॉक्स का था, बिल 50 बॉक्स का बना, लेकिन टेम्पो से सिर्फ 45 बॉक्स पहुंचे।
              यहाँ 5 बॉक्स (₹12,500) का नुकसान पकड़ा गया है।
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm text-xs flex items-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Reminder</span>
            </button>
            <button
              onClick={() => setShowProofModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <FileCheck className="w-4 h-4" />
              <span>Saboot Dekho</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. Visual Story Flow (Step-by-step: Order -> Bill -> Delivery -> Result) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <span>📊 बिजनेस प्रोसेस फ्लो (What Happened)</span>
          </h2>
          <span className="text-xs text-rose-600 font-bold bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
            ⚠️ 5 Boxes Mismatch Detected
          </span>
        </div>

        {/* 4 Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Step 1 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">1. Order Aaya</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                WhatsApp
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">50 Boxes</div>
            <p className="text-xs text-slate-600">Rate: ₹2,500/box</p>
            <p className="text-[11px] text-slate-400 italic">"Bhaiya 50 box dispatch kar dena..."</p>
          </div>

          {/* Step 2 */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-500">2. Bill Kata</span>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-mono">
                INV-2026-042
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900">50 Boxes</div>
            <p className="text-xs text-slate-600">Total: ₹1,25,000</p>
            <p className="text-[11px] text-slate-400">Full 50 boxes billed in invoice</p>
          </div>

          {/* Step 3 */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-800">3. Delivery Hui</span>
              <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-mono">
                DC-2026-069
              </span>
            </div>
            <div className="text-2xl font-black text-amber-900">45 Boxes</div>
            <p className="text-xs text-amber-800">Tempo Deliver Ho Chuka</p>
            <p className="text-[11px] text-amber-700 italic">"Delivered 45 boxes only, 5 balance pending"</p>
          </div>

          {/* Step 4: Result */}
          <div className="p-4 rounded-xl border border-rose-300 bg-rose-50/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-rose-700">4. AI Pakad Liya</span>
              <span className="text-[10px] bg-rose-200 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase">
                Shortfall
              </span>
            </div>
            <div className="text-2xl font-black text-rose-600">-5 Boxes</div>
            <p className="text-xs font-bold text-rose-700">₹12,500 Missing Value</p>
            <p className="text-[11px] text-rose-600">Sharma ji ko reminder bhejna hai</p>
          </div>
        </div>

        {/* Quick action bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            <strong>Next Action:</strong> Sharma Traders ko WhatsApp reminder bhejein taaki 5 box ka hisab clear ho sake.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProofModal(true)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
            >
              📄 Saboot (3 Documents) Dekhein
            </button>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Message Tayyar Hai</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Three Simple Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Kul Order (Total Ordered)</span>
            <Package className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">50 Boxes</div>
          <p className="text-xs text-slate-500">Party: Sharma Traders (Jaipur)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>Delivered Quantity</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">45 Boxes</div>
          <p className="text-xs text-slate-500">Challan DC-2026-069 dwara</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-600 text-xs font-bold">
            <span>Missing / Shortfall</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">5 Boxes</div>
          <p className="text-xs text-slate-500">Pending Value: ₹12,500</p>
        </div>
      </div>

      {/* 4. Ready-to-Send WhatsApp Box (Directly on Dashboard) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Sharma Traders ke liye WhatsApp Follow-Up Message</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              AI ne saboot ke sath message ready kiya hai — aap 1-click me copy ya send kar sakte hain.
            </p>
          </div>

          {/* Language selector */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            {(['hinglish', 'hindi', 'english'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  language === lang
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {lang === 'hinglish' ? 'Hinglish' : lang === 'hindi' ? 'हिंदी' : 'English'}
              </button>
            ))}
          </div>
        </div>

        {/* Message preview */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
          {currentMessage}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Message Copied!' : 'Copy Message (कॉपी करें)'}</span>
            </button>
            <button
              onClick={handleWhatsAppSend}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>WhatsApp Web Par Kholein</span>
            </button>
          </div>

          <button
            onClick={handleMarkResolved}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
          >
            Follow-up Ho Gaya (Mark Done)
          </button>
        </div>
      </div>

      {/* 5. Quick AI Ask Box */}
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            🤖 AI Se Sawal Poochhein (Business Memory)
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Kisi bhi order, bill ya payment ka hisab lene ke liye AI Assistant se poochhein.
          </p>
        </div>
        <button
          onClick={() => onNavigate('assistant')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shrink-0 transition"
        >
          <span>AI Assistant Kholein</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* POPUP MODAL: WhatsApp Reminder */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Send WhatsApp Reminder • Sharma Traders
                </h3>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language tabs */}
            <div className="flex items-center gap-2">
              {(['hinglish', 'hindi', 'english'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold capitalize ${
                    language === lang
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'hinglish' ? 'Hinglish' : lang === 'hindi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>

            {/* Message Box */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono whitespace-pre-wrap leading-relaxed">
              {currentMessage}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Message'}</span>
              </button>

              <button
                onClick={handleWhatsAppSend}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: Proof Documents */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Saboot / Evidence Documents (Sharma Traders)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Why 5 boxes are missing: verified across 3 separate original documents
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProofModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Proof Cards */}
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>📱 1. WhatsApp Order Confirmation</span>
                  <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-600">
                    whatsapp_order_50boxes.txt
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  "Bhaiya 50 box premium biscuits Jaipur godown bhej dena, rate ₹2,500/box final hai. Kal tak dispatch karwana."
                </p>
                <p className="text-[11px] text-emerald-700 font-semibold">
                  ✓ Verified: Sharma Traders confirmed 50 boxes order.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                  <span>🧾 2. Official Tax Invoice (INV-2026-042)</span>
                  <span className="text-[10px] bg-indigo-100 px-2 py-0.5 rounded text-indigo-700">
                    tax_invoice_INV-2026-042.pdf
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200">
                  "Item: Premium Biscuits | Qty: 50 Boxes | Rate: ₹2,500.00 | Total Taxable: ₹1,25,000.00"
                </p>
                <p className="text-[11px] text-indigo-700 font-semibold">
                  ✓ Verified: Invoice generated and billed for full 50 boxes (₹1,25,000).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span>🚚 3. Delivery Challan (DC-2026-069)</span>
                  <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded text-amber-900">
                    delivery_challan_DC-2026-069.pdf
                  </span>
                </div>
                <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded-lg border border-amber-200">
                  "Delivered Quantity: 45 Boxes only. Balance 5 boxes pending for second tempo trip due to capacity."
                </p>
                <p className="text-[11px] text-rose-700 font-bold">
                  ⚠️ Physical delivery was only 45 boxes! 5 boxes were not delivered.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Theek Hai (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
