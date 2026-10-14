import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  MessageSquare,
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

  const handleGenerate = async (taskId: number, lang: 'english' | 'hindi' | 'hinglish') => {
    setGeneratingId(taskId);
    try {
      await api.generateDraft(taskId, lang, 'whatsapp');
      await loadTasks();
      onDataMutated();
    } finally {
      setGeneratingId(null);
    }
  };

  const handleApprove = async (draftId: number, bodyText: string) => {
    await api.approveDraft(draftId, {
      decision: 'approved',
      edited_body_text: bodyText,
    });
    await loadTasks();
    onDataMutated();
  };

  const handleCopy = (draft: AIDraft) => {
    navigator.clipboard.writeText(draft.body_text);
    setCopiedId(draft.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">Follow-Up Tasks & Drafts</h2>
        <p className="text-xs text-slate-500">
          AI-generated WhatsApp drafts in Hinglish, Hindi, and English. Requires your approval before sending.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading drafts...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
          No pending follow-ups.
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{task.party_name}</span>
                    <span className="text-xs text-slate-400 font-mono">({task.order_number})</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      Due: {task.due_date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{task.title}</p>
                </div>

                {/* Generate New Draft Language Buttons */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-400 text-[11px] mr-1">New Draft:</span>
                  {(['hinglish', 'hindi', 'english'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => handleGenerate(task.id, lang)}
                      disabled={generatingId === task.id}
                      className="px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-slate-200 text-[11px] font-semibold uppercase transition"
                    >
                      + {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Drafts Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {task.drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          {draft.language} Draft
                        </span>
                        <span
                          className={`font-semibold ${
                            draft.status === 'approved' ? 'text-emerald-700' : 'text-amber-700'
                          }`}
                        >
                          {draft.status === 'approved' ? '✓ Approved' : 'Pending Approval'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 whitespace-pre-wrap mt-2 font-sans leading-relaxed">
                        {draft.body_text}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                      {draft.status !== 'approved' ? (
                        <button
                          onClick={() => handleApprove(draft.id, draft.body_text)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve Draft</span>
                        </button>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">
                          Ready to Send
                        </span>
                      )}

                      <button
                        onClick={() => handleCopy(draft)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedId === draft.id ? 'Copied!' : 'Copy for WhatsApp'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
