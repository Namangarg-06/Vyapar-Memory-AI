import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Languages,
  MessageSquare,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { AIDraft, FollowUpTask } from '../types';

interface TasksDraftsPageProps {
  onDataMutated: () => void;
}

export const TasksDraftsPage: React.FC<TasksDraftsPageProps> = ({
  onDataMutated,
}) => {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<AIDraft | null>(null);
  const [editedBody, setEditedBody] = useState('');
  const [approvalComment, setApprovalComment] = useState(
    'Verified quantities against Invoice INV-2026-1042 and Challan DC-2026-089.'
  );
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const data = await api.getTasks();
      setTasks(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleGenerateLanguageDraft = async (
    taskId: number,
    lang: 'english' | 'hindi' | 'hinglish'
  ) => {
    setGeneratingId(taskId);
    try {
      const draft = await api.generateDraft(taskId, lang, 'whatsapp');
      await loadTasks();
      setSelectedDraft(draft);
      setEditedBody(draft.body_text);
      onDataMutated();
    } finally {
      setGeneratingId(null);
    }
  };

  const handleDecision = async (decision: 'approved' | 'rejected') => {
    if (!selectedDraft) return;
    await api.approveDraft(selectedDraft.id, {
      decision,
      edited_body_text: editedBody,
      comment: approvalComment,
    });
    setSelectedDraft(null);
    await loadTasks();
    onDataMutated();
  };

  const handleCompleteTask = async (taskId: number) => {
    await api.completeTask(taskId);
    await loadTasks();
    onDataMutated();
  };

  const copyApprovedText = (draft: AIDraft) => {
    navigator.clipboard.writeText(draft.body_text);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Safety Banner */}
      <div className="bg-indigo-950 text-white p-5 rounded-xl border border-indigo-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold">
              Mandatory Owner Approval Gate for External Follow-Ups
            </h2>
            <p className="text-xs text-indigo-200 mt-0.5">
              Vyapar Memory AI never sends external WhatsApp messages or emails autonomously. Generate a draft in{' '}
              <strong>Hinglish, Hindi, or English</strong>, inspect its supporting evidence, edit if needed, and explicitly approve before copying/exporting.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading follow-up tasks and drafts...
        </div>
      ) : (
        <div className="space-y-5">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Task Header */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">
                      {task.title}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        task.status === 'approved_ready' || task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                    {task.is_demo && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1 mr-1">
                    <Languages className="w-3.5 h-3.5" />
                    Generate Draft:
                  </span>
                  {(['hinglish', 'english', 'hindi'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleGenerateLanguageDraft(task.id, lang)}
                      disabled={generatingId === task.id}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 uppercase"
                    >
                      + {lang}
                    </button>
                  ))}
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                    >
                      Mark Task Completed
                    </button>
                  )}
                </div>
              </div>

              {/* Drafts List */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {task.drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`p-4 rounded-xl border flex flex-col justify-between ${
                      draft.status === 'approved'
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : draft.status === 'rejected'
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-600 text-white">
                            {draft.language}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                              draft.status === 'approved'
                                ? 'bg-emerald-200 text-emerald-950'
                                : draft.status === 'rejected'
                                ? 'bg-rose-200 text-rose-950'
                                : 'bg-amber-200 text-amber-950'
                            }`}
                          >
                            {draft.status.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Provider: {draft.generated_by_provider}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-slate-900 mb-1.5">
                        Subject: {draft.subject}
                      </p>
                      <pre className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                        {draft.body_text}
                      </pre>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setSelectedDraft(draft);
                          setEditedBody(draft.body_text);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Review / Edit / Approve</span>
                      </button>

                      {draft.status === 'approved' ? (
                        <button
                          onClick={() => copyApprovedText(draft)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>
                            {copiedId === draft.id
                              ? 'Copied for WhatsApp!'
                              : 'Copy Approved Message'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-amber-800 font-semibold">
                          🔒 Approval required before export
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Edit & Approve / Reject Draft */}
      {selectedDraft && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                {selectedDraft.language} follow-up draft
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Review, Edit & Approve Follow-Up Message
              </h3>
              <p className="text-xs text-slate-500">
                Party: {selectedDraft.party_name} • External messaging provider is not connected; approving unlocks verified copy/export and logs an immutable ApprovalRecord.
              </p>
            </div>

            {/* Supporting Evidence */}
            {selectedDraft.supporting_evidence &&
              selectedDraft.supporting_evidence.length > 0 && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 block">
                    Supporting Evidence Linked to This Draft:
                  </span>
                  {selectedDraft.supporting_evidence.map((ev, i) => (
                    <div key={i} className="text-slate-700">
                      • <strong>{ev.filename}</strong> ({ev.location}): "{ev.quote}"
                    </div>
                  ))}
                </div>
              )}

            <div className="space-y-2 text-xs">
              <label className="font-semibold block text-slate-700">
                Editable Message Text
              </label>
              <textarea
                rows={7}
                value={editedBody}
                onChange={(e) => setEditedBody(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-300 text-xs leading-relaxed"
              />
              <label className="font-semibold block text-slate-700 pt-1">
                Approval Audit Note
              </label>
              <input
                type="text"
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedDraft(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDecision('rejected')}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject Draft</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision('approved')}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Draft</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
