import React, { useState } from 'react';
import {
  AlertCircle,
  Bot,
  Database,
  FileSearch,
  Send,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { AssistantAskResponse } from '../types';

const SUGGESTED_QUESTIONS = [
  'What is the discrepancy for Sharma Traders Order ORD-2026-101 and what evidence supports it?',
  'Which orders are still pending or partially delivered?',
  'Which deliveries have missing confirmation?',
  'Which customer commitments are due this week or overdue?',
  'What should I follow up on today?',
];

export const AssistantPage: React.FC = () => {
  const [question, setQuestion] = useState(SUGGESTED_QUESTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AssistantAskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runQuery = async (q: string) => {
    setQuestion(q);
    setLoading(true);
    setError(null);
    try {
      const res = await api.askAssistant(q);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Query failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    runQuery(question.trim());
  };

  return (
    <div className="space-y-6">
      {/* Query Box */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-indigo-600" />
              <span>Hybrid SQL + Vector RAG Business Memory Assistant</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Queries structured SQL tables for exact quantities, rupees & IST deadlines, and retrieves verbatim document chunks for source proof.
            </p>
          </div>
        </div>

        {/* Preset Query Chips */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((sq) => (
            <button
              key={sq}
              type="button"
              onClick={() => runQuery(sq)}
              className="text-xs px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-medium transition text-left"
            >
              <Sparkles className="w-3 h-3 inline mr-1" />
              {sq}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about orders, discrepancies, invoices, deliveries, or commitments..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Searching Memory...' : 'Ask Memory'}</span>
          </button>
        </form>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            {error}
          </div>
        )}
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6">
          {/* Missing / Conflicting Evidence Notice */}
          {result.uncertainty_notice && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-950">
                <span className="font-bold uppercase tracking-wider block">
                  Missing or Conflicting Evidence Flagged by Deterministic Rules
                </span>
                <p className="mt-1 font-medium">{result.uncertainty_notice}</p>
              </div>
            </div>
          )}

          {/* Grounded Answer + Citations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Synthesized Answer & Verified SQL Facts */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                    Grounded Business Memory Response
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    Engine: {result.provider_used}
                  </span>
                </div>
                <div className="text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium">
                  {result.answer_markdown}
                </div>
              </div>

              {/* Structured SQL Facts Table */}
              {result.verified_facts && result.verified_facts.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Exact Structured Database Facts (SQL Ground Truth)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                          <th className="p-3 font-semibold">Order</th>
                          <th className="p-3 font-semibold">Party</th>
                          <th className="p-3 font-semibold">Ordered</th>
                          <th className="p-3 font-semibold">Invoiced</th>
                          <th className="p-3 font-semibold">Delivered</th>
                          <th className="p-3 font-semibold">Pending</th>
                          <th className="p-3 font-semibold">Due Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {result.verified_facts.map((fact, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-indigo-700">
                              {fact.reference}
                            </td>
                            <td className="p-3 font-medium text-slate-900">
                              {fact.party}
                            </td>
                            <td className="p-3">{fact.ordered}</td>
                            <td className="p-3">{fact.invoiced}</td>
                            <td className="p-3 font-semibold text-emerald-700">
                              {fact.delivered}
                            </td>
                            <td className="p-3 font-extrabold text-rose-600">
                              {fact.pending}
                            </td>
                            <td className="p-3 text-slate-600">{fact.due_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Retrieved Verbatim Document Citations */}
            <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileSearch className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Source Document Citations ({result.citations.length})
                </h3>
              </div>

              <div className="space-y-3">
                {result.citations.map((cit, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        📄 {cit.filename}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 shrink-0">
                        {cit.page_or_line_ref}
                      </span>
                    </div>
                    <blockquote className="text-xs text-slate-700 italic border-l-2 border-indigo-500 pl-3 py-1 bg-white rounded-r">
                      "{cit.verbatim_quote}"
                    </blockquote>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Type: {cit.doc_type}</span>
                      <span>Match Score: {Math.round(cit.relevance_score * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
