import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  FileText,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantAskResponse } from '../types';

const SUGGESTIONS = [
  'How many boxes are pending for Sharma Traders?',
  'What is the financial value of the missing boxes?',
  'What are the details recorded in Delivery Challan DC-2026-069?',
  'Summarize the complete Sharma Traders transaction history',
];

export const AssistantPage: React.FC = () => {
  const [question, setQuestion] = useState(SUGGESTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantAskResponse | null>(null);

  const runQuery = async (q: string) => {
    setQuestion(q);
    setLoading(true);
    try {
      const res = await api.askAssistant(q);
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) runQuery(question.trim());
  };

  return (
    <div className="space-y-6">
      {/* Colorful Header */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 rounded-3xl p-6 text-white shadow-lg space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Grounded RAG Intelligence</span>
        </div>
        <h2 className="text-xl md:text-2xl font-black">
          🤖 AI Business Memory Assistant
        </h2>
        <p className="text-purple-100 text-xs md:text-sm">
          Answers grounded strictly in verified orders, invoices, and delivery challans with source citations.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-indigo-100 shadow-md space-y-4">
        <div>
          <span className="text-xs font-bold text-slate-500 block mb-2">
            💡 Choose a Verified Question or Type Below:
          </span>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => runQuery(s)}
                className="text-xs font-bold px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 transition active:scale-95"
              >
                💬 {s}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about orders, delivery shortfalls, deadlines, or invoices..."
            className="flex-1 px-4 py-3 rounded-2xl border border-indigo-200 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs md:text-sm font-black hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-md shadow-purple-500/20 active:scale-95 transition"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Searching Records...' : 'Ask Assistant'}</span>
          </button>
        </form>
      </div>

      {/* Answer Area */}
      {result && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Missing / Conflicting evidence badge */}
          {result.uncertainty_notice && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 flex items-start gap-2.5 text-xs text-amber-950 font-bold">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <span>{result.uncertainty_notice}</span>
            </div>
          )}

          {/* Clean Answer Card */}
          <div className="bg-white rounded-3xl border-2 border-purple-200 shadow-md p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-black text-purple-700 uppercase tracking-wider">
              <Bot className="w-4 h-4" />
              <span>AI Verified Answer:</span>
            </div>

            <div className="text-xs md:text-sm text-slate-800 whitespace-pre-line leading-relaxed font-sans font-medium bg-purple-50/40 p-4 rounded-2xl border border-purple-100">
              {result.answer_markdown}
            </div>

            {/* Citations Row */}
            {result.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider block">
                  📄 Source Document Citations:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {result.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                        <span>
                          <FileText className="w-3.5 h-3.5 inline mr-1 text-indigo-500" />
                          {c.filename}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">{c.page_or_line_ref}</span>
                      </div>
                      <p className="text-xs text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                        "{c.verbatim_quote}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
