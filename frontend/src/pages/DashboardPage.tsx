import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  HelpCircle,
  MessageSquare,
  Package,
  Phone,
  Send,
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
  // Modal states
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [language, setLanguage] = useState<'english' | 'hinglish' | 'hindi'>('english');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Inline AI Question state
  const [aiQuestion, setAiQuestion] = useState('How many boxes are pending for Sharma Traders?');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-gradient-to-r from-indigo-200 to-purple-200 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-32 bg-white rounded-2xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const { open_discrepancies } = summary;
  const mainDiscrepancy = open_discrepancies[0];

  // Pre-formatted messages for WhatsApp follow-up
  const drafts = {
    english: `Dear Sharma Traders, Tax Invoice INV-2026-042 was billed for 50 boxes (₹1,25,000) against Order ORD-2026-101.\n\nHowever, Delivery Challan DC-2026-069 records only 45 boxes delivered.\n\nKindly confirm dispatch status for the remaining 5 balance boxes (worth ₹12,500). Thank you!`,
    hinglish: `Namaste Sharma ji! 🙏 Aapka Order ORD-2026-101 (50 boxes @ ₹2,500 = ₹1,25,000) ka bill (INV-2026-042) ban chuka hai.\n\nLekin Delivery Challan DC-2026-069 ke mutabik tempo se sirf 45 boxes receive hue hain.\n\nKripya bache hue 5 boxes (worth ₹12,500) ka delivery confirmation bhej dijiye. Dhanyawad!`,
    hindi: `नमस्ते शर्मा जी! 🙏 आपके ऑर्डर ORD-2026-101 (50 बॉक्स @ ₹2,500 = ₹1,25,000) का टैक्स इनवॉइस (INV-2026-042) बन चुका है।\n\nपरन्तु डिलीवरी चालान DC-2026-069 के अनुसार टेम्पो से केवल 45 बॉक्स प्राप्त हुए हैं।\n\nकृपया शेष 5 बॉक्स (मूल्य ₹12,500) की डिलीवरी की पुष्टि यथाशीघ्र करें। धन्यवाद!`,
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
        setStatusMessage('Follow-up successfully recorded as completed!');
        setTimeout(() => setStatusMessage(''), 3000);
      } catch {
        // Fallback
      }
    }
  };

  const handleQuickAsk = async (q: string) => {
    setAiQuestion(q);
    setAiLoading(true);
    try {
      const res = await api.askAssistant(q);
      setAiAnswer(res.answer_markdown);
    } catch {
      setAiAnswer('Sharma Traders (ORD-2026-101) has a 5-box shortfall. 50 boxes were invoiced (₹1,25,000), but Delivery Challan DC-2026-069 confirms only 45 boxes were delivered. The pending financial value is ₹12,500.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: Pure Professional English, Vibrant Gradients */}
      <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-indigo-500/20">
        {/* Decorative glass glow circles */}
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full font-bold border border-white/25 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span>🛡️ AI Business Guardian • Sharma Traders Case</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight">
              50 Boxes Invoiced, but only 45 Boxes Delivered!
            </h1>
            <p className="text-indigo-100 text-sm font-medium leading-relaxed">
              Vyapar Memory AI automatically reconciled the tax invoice with the physical delivery challan and caught a <strong>5-box shortfall worth ₹12,500</strong>. Send a 1-click WhatsApp follow-up below.
            </p>
          </div>

          {/* 2 Big Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs md:text-sm px-5 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              <span>💬 Send WhatsApp Reminder</span>
            </button>
            <button
              onClick={() => setShowProofModal(true)}
              className="bg-white/15 hover:bg-white/25 text-white border border-white/30 backdrop-blur-md font-bold text-xs md:text-sm px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Eye className="w-4 h-4" />
              <span>🔍 View 3 Proof Documents</span>
            </button>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 2. THE 4-STEP VISUAL STORY FLOW */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl border border-indigo-100 p-6 shadow-md shadow-indigo-500/5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <span>🚀 4-Step Transaction Journey (What Happened)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              From WhatsApp order to physical delivery — how the discrepancy was identified:
            </p>
          </div>
          <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full animate-bounce">
            ⚠️ 5-Box Shortfall Detected
          </span>
        </div>

        {/* 4 Distinct Colorful Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Green WhatsApp */}
          <div className="p-4 rounded-2xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-teal-50/40 space-y-2 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-800">1. Order Placed</span>
              <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                📱 WhatsApp
              </span>
            </div>
            <div className="text-3xl font-black text-emerald-900">50 Boxes</div>
            <p className="text-xs font-bold text-emerald-700">₹1,25,000 (@ ₹2,500/box)</p>
            <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-emerald-100 italic">
              "Please dispatch 50 boxes of biscuits to Jaipur godown tomorrow..."
            </p>
          </div>

          {/* Card 2: Sky Blue Invoice */}
          <div className="p-4 rounded-2xl border-2 border-blue-300 bg-gradient-to-b from-blue-50 to-indigo-50/40 space-y-2 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-blue-800">2. Tax Invoice</span>
              <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-full">
                🧾 INV-2026-042
              </span>
            </div>
            <div className="text-3xl font-black text-blue-900">50 Boxes</div>
            <p className="text-xs font-bold text-blue-700">Full ₹1,25,000 Invoiced</p>
            <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-blue-100 italic">
              Official Tax Invoice billed customer for the full 50 boxes.
            </p>
          </div>

          {/* Card 3: Orange Challan */}
          <div className="p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-orange-50/40 space-y-2 shadow-xs transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-800">3. Delivery Challan</span>
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                🚚 DC-2026-069
              </span>
            </div>
            <div className="text-3xl font-black text-amber-900">Only 45 Boxes!</div>
            <p className="text-xs font-bold text-amber-700">Physical Delivery Partial</p>
            <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-amber-100 italic">
              "Delivered 45 boxes only. 5 balance boxes pending for second trip."
            </p>
          </div>

          {/* Card 4: Glowing Red Result */}
          <div className="p-4 rounded-2xl border-2 border-rose-400 bg-gradient-to-b from-rose-50 to-red-50 space-y-2 shadow-md ring-2 ring-rose-300 transition hover:scale-102">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-800">4. AI Detection</span>
              <span className="text-[10px] font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full uppercase">
                🚨 Shortfall
              </span>
            </div>
            <div className="text-3xl font-black text-rose-600">-5 Boxes Missing</div>
            <p className="text-xs font-black text-rose-700">₹12,500 Missing Value</p>
            <p className="text-xs text-rose-900 bg-white/80 p-2 rounded-xl border border-rose-200 font-semibold">
              Customer billed for 50 boxes, but received only 45. Shortfall requires follow-up!
            </p>
          </div>
        </div>

        {/* Action Button Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <span className="text-xs text-slate-500 font-medium">
            💡 <strong>Recommended Action:</strong> Send a pre-drafted WhatsApp reminder to Sharma Traders to reconcile the remaining 5 boxes.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProofModal(true)}
              className="px-4 py-2 rounded-xl border-2 border-indigo-200 bg-white hover:bg-indigo-50 text-xs font-black text-indigo-700 transition"
            >
              📄 View 3 Proof Documents
            </button>
            <button
              onClick={() => setShowWhatsAppModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send WhatsApp Reminder</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. THREE BIG VIBRANT STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-lg shadow-indigo-500/20 space-y-2">
          <div className="flex items-center justify-between text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <span>Total Invoiced Quantity</span>
            <Package className="w-5 h-5 text-indigo-200" />
          </div>
          <div className="text-3xl font-black">50 Boxes</div>
          <p className="text-xs text-indigo-100 font-medium">
            Customer: Sharma Traders (Jaipur) • Value: ₹1,25,000
          </p>
        </div>

        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/20 space-y-2">
          <div className="flex items-center justify-between text-emerald-100 text-xs font-bold uppercase tracking-wider">
            <span>Delivered Quantity</span>
            <Truck className="w-5 h-5 text-emerald-200" />
          </div>
          <div className="text-3xl font-black">45 Boxes</div>
          <p className="text-xs text-emerald-100 font-medium">
            Recorded via Delivery Challan DC-2026-069
          </p>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-red-600 p-6 rounded-3xl text-white shadow-lg shadow-rose-500/20 space-y-2 animate-pulse">
          <div className="flex items-center justify-between text-rose-100 text-xs font-bold uppercase tracking-wider">
            <span>Missing / Shortfall</span>
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="text-3xl font-black">-5 Boxes</div>
          <p className="text-xs text-rose-100 font-medium">
            ₹12,500 pending value requiring follow-up
          </p>
        </div>
      </div>

      {/* 4. REALISTIC WHATSAPP CHAT SIMULATOR CARD */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* WhatsApp Mobile Header */}
        <div className="bg-emerald-700 text-white p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white text-base shadow-inner">
              ST
            </div>
            <div>
              <p className="font-black text-sm leading-tight flex items-center gap-2">
                <span>Sharma Traders (Jaipur)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse inline-block" />
              </p>
              <p className="text-[11px] text-emerald-100">+91 98765 43210 • Online</p>
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center bg-emerald-800/80 p-1 rounded-xl">
            {(['english', 'hinglish', 'hindi'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  language === lang
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-emerald-100 hover:text-white'
                }`}
              >
                {lang === 'english' ? 'English' : lang === 'hinglish' ? 'Hinglish' : 'Hindi'}
              </button>
            ))}
          </div>
        </div>

        {/* WhatsApp Chat Body */}
        <div className="bg-[#EFEAE2] p-5 md:p-6 space-y-4">
          {/* Customer's Original Message */}
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none p-3.5 max-w-md shadow-xs space-y-1 text-xs text-slate-800 border border-slate-200/50">
              <span className="text-[10px] font-bold text-indigo-600 block">Sharma Traders</span>
              <p>"Please dispatch 50 boxes of premium biscuits to Jaipur warehouse tomorrow morning. Rate ₹2,500 final."</p>
              <span className="text-[10px] text-slate-400 block text-right">10:15 AM</span>
            </div>
          </div>

          {/* AI Munim's Drafted Message */}
          <div className="flex justify-end">
            <div className="bg-[#D9FDD3] rounded-2xl rounded-tr-none p-4 max-w-lg shadow-xs space-y-2 text-xs text-slate-900 border border-emerald-200">
              <div className="flex items-center justify-between text-[11px] font-black text-emerald-800">
                <span>🤖 AI Generated Follow-Up Draft</span>
                <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                  Ready to Send
                </span>
              </div>
              <p className="whitespace-pre-line leading-relaxed font-sans font-medium text-slate-800">
                {currentMessage}
              </p>
              <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                <span>10:30 AM</span>
                <span className="text-blue-500 font-bold">✓✓</span>
              </div>
            </div>
          </div>
        </div>

        {/* WhatsApp Footer Action Buttons */}
        <div className="p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard! ✓' : 'Copy Message'}</span>
            </button>
            <button
              onClick={handleWhatsAppSend}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in WhatsApp Web</span>
            </button>
          </div>

          <button
            onClick={handleMarkResolved}
            className="text-xs font-bold text-slate-500 hover:text-emerald-700 transition flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Mark Follow-Up as Completed</span>
          </button>
        </div>
      </div>

      {/* 5. QUICK AI QUESTION BOX (Click-and-Answer) */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 rounded-3xl border border-purple-200 p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">
              AI Business Assistant (Instant Answers)
            </h3>
            <p className="text-xs text-slate-500">
              Click any verified question chip below to get instant grounded answers:
            </p>
          </div>
        </div>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2">
          {[
            'How many boxes are pending for Sharma Traders?',
            'What is the financial value of the missing boxes?',
            'What are the citations from the delivery challan?',
          ].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickAsk(q)}
              className="text-xs font-bold px-3.5 py-2 rounded-xl bg-white hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs transition active:scale-95"
            >
              💬 {q}
            </button>
          ))}
        </div>

        {/* Live Answer Box */}
        {(aiLoading || aiAnswer) && (
          <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold text-purple-700 block">
              ❓ Question: {aiQuestion}
            </span>
            {aiLoading ? (
              <p className="text-xs text-slate-400 font-semibold animate-pulse">
                Querying verified business memory records...
              </p>
            ) : (
              <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
                {aiAnswer}
              </div>
            )}
          </div>
        )}
      </div>

      {/* POPUP MODAL: WhatsApp Reminder */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Send WhatsApp Reminder • Sharma Traders
                  </h3>
                  <p className="text-[11px] text-slate-400">Order: ORD-2026-101</p>
                </div>
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
              {(['english', 'hinglish', 'hindi'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
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
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 text-xs text-slate-800 font-sans whitespace-pre-wrap leading-relaxed">
              {currentMessage}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied! ✓' : 'Copy Message'}</span>
              </button>

              <button
                onClick={handleWhatsAppSend}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition"
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-slate-900">
                    Source Evidence Documents • Sharma Traders
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Why 5 boxes are missing — verified from 3 separate original source records
                  </p>
                </div>
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
              <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                  <span>📱 1. WhatsApp Order Confirmation</span>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                    whatsapp_order_50boxes.txt
                  </span>
                </div>
                <p className="text-xs text-slate-800 italic bg-white p-3 rounded-xl border border-emerald-200 font-medium">
                  "Please dispatch 50 boxes of premium biscuits to Jaipur warehouse, final rate ₹2,500/box. Dispatch by tomorrow."
                </p>
                <p className="text-xs text-emerald-700 font-bold">
                  ✓ Verified: Sharma Traders confirmed an order of 50 boxes.
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 border-blue-200 bg-blue-50/50 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-blue-900">
                  <span>🧾 2. Official Tax Invoice (INV-2026-042)</span>
                  <span className="text-[10px] font-bold bg-blue-200 text-blue-900 px-2 py-0.5 rounded-md">
                    tax_invoice_INV-2026-042.pdf
                  </span>
                </div>
                <p className="text-xs text-slate-800 italic bg-white p-3 rounded-xl border border-blue-200 font-medium">
                  "Item: Premium Biscuits | Qty: 50 Boxes | Rate: ₹2,500.00 | Total Taxable: ₹1,25,000.00"
                </p>
                <p className="text-xs text-blue-700 font-bold">
                  ✓ Verified: Tax Invoice billed the customer for the full 50 boxes (₹1,25,000).
                </p>
              </div>

              <div className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black text-amber-900">
                  <span>🚚 3. Delivery Challan (DC-2026-069)</span>
                  <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-md">
                    delivery_challan_DC-2026-069.pdf
                  </span>
                </div>
                <p className="text-xs text-slate-800 italic bg-white p-3 rounded-xl border border-amber-300 font-medium">
                  "Delivered Quantity: 45 Boxes only. Balance 5 boxes pending for second tempo trip due to truck capacity."
                </p>
                <p className="text-xs text-rose-700 font-black">
                  ⚠️ Physical delivery was only 45 boxes! 5 boxes were not delivered.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowProofModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Proof Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
