import React, { useEffect, useState } from 'react';
import { History, Server, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { AuditEvent, Workspace } from '../types';

interface AuditSettingsPageProps {
  mode: 'audit' | 'settings';
  workspace: Workspace;
}

export const AuditSettingsPage: React.FC<AuditSettingsPageProps> = ({
  mode,
  workspace,
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [health, setHealth] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getAuditLogs(), api.getHealth()])
      .then(([logs, h]) => {
        setAuditLogs(logs);
        setHealth(h);
      })
      .finally(() => setLoading(false));
  }, [mode]);

  if (mode === 'audit') {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <span>Immutable Business Activity & Audit Trail ({auditLogs.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Every document upload, extraction review, discrepancy resolution, and draft approval is logged with actor identity and timestamp.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs text-slate-500">
            Loading audit timeline...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {auditLogs.map((ev) => (
              <div
                key={ev.id}
                className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      {ev.action}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {ev.summary}
                    </span>
                    {ev.is_demo && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-slate-500">
                    Actor: <strong>{ev.actor_name}</strong> • Entity: {ev.entity_type}{' '}
                    {ev.entity_id ? `#${ev.entity_id}` : ''}
                  </p>
                </div>
                <span className="text-slate-400 font-mono">
                  {new Date(ev.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Workspace Profile */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Business Workspace Isolation Profile
          </h2>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Workspace Name</span>
            <span className="font-bold text-slate-900">{workspace.name}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Tenant Slug</span>
            <span className="font-mono text-slate-700">{workspace.slug}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Configured Timezone</span>
            <span className="font-bold text-indigo-700">{workspace.timezone}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-500">Your Role</span>
            <span className="uppercase font-bold text-emerald-700">{workspace.role}</span>
          </div>
        </div>
      </div>

      {/* AI & Database Provider Status */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Active Backend & AI Provider Adapters (/api/v1/health)
          </h2>
        </div>

        {health ? (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Database Dialect</span>
              <span className="font-bold uppercase text-slate-900">
                {health.database_dialect}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Active Extraction & RAG Adapter</span>
              <span className="font-bold text-indigo-700">
                {health.ai_provider}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Speech-to-Text (STT) Adapter</span>
              <span className="font-bold text-slate-800">
                {health.stt_provider}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Google Gemini API Key Configured</span>
              <span className="font-bold">
                {health.gemini_configured ? '✅ Configured' : '⚪ Not Set (Using Deterministic Adapter)'}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">OpenAI API Key Configured</span>
              <span className="font-bold">
                {health.openai_configured ? '✅ Configured' : '⚪ Not Set'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-2">
              To enable live cloud LLM calls or voice transcription, set{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">GEMINI_API_KEY</code> or{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">OPENAI_API_KEY</code> in{' '}
              <code className="bg-slate-100 px-1 py-0.5 rounded">.env</code>. Keys are never exposed to the browser.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Loading provider status...</p>
        )}
      </div>
    </div>
  );
};
