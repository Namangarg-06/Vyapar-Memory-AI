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
  'What is the discrepancy for Sharma Traders?',
  'Which orders are still pending?',
  'What commitments are due this week?',
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
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">AI Business Memory Assistant</h2>
        <p className="text-xs text-slate-500">
          Answers grounded strictly in verified orders, invoices, and delivery records.
        </p>
      </div>

      {/* Query Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => runQuery(s)}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition"
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about orders, delivery shortfalls, or deadlines..."
            className="flex-1 px-3.5 py-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{loading ? 'Searching...' : 'Ask'}</span>
          </button>
        </form>
      </div>

      {/* Answer Area */}
      {result && (
        <div className="space-y-4">
          {/* Missing / Conflicting evidence badge */}
          {result.uncertainty_notice && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{result.uncertainty_notice}</span>
            </div>
          )}

          {/* Clean Answer Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-sans">
              {result.answer_markdown}
            </div>

            {/* Citations Row */}
            {result.citations.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Referenced Evidence
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  {result.citations.map((c, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="font-semibold text-slate-800 text-[11px] flex items-center justify-between">
                        <span>
                          <FileText className="w-3 h-3 inline mr-1 text-slate-400" />
                          {c.filename}
                        </span>
                        <span className="text-slate-400">{c.page_or_line_ref}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 italic mt-1 truncate">
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
