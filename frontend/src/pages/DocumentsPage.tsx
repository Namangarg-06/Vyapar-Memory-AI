import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Mic,
  ShieldCheck,
  Upload,
  XCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { DocumentItem, ExtractedRecord } from '../types';

interface DocumentsPageProps {
  onDataMutated: () => void;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ onDataMutated }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('order_message');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Quick Sample Text Upload state
  const [sampleText, setSampleText] = useState(
    'Customer: Verma Sanitaryware\nOrder ORD-2026-309: Bhai 80 boxes CPVC Solvent Cement (250ml) @ Rs. 1,500/box (Total Rs. 1,20,000) is Saturday tak bhejna hai.'
  );
  const [sampleFilename, setSampleFilename] = useState(
    'WhatsApp_Verma_Sanitaryware_ORD-2026-309.txt'
  );

  // Review Modal state
  const [reviewRecord, setReviewRecord] = useState<ExtractedRecord | null>(null);
  const [editedPartyName, setEditedPartyName] = useState('');
  const [editedOrderNumber, setEditedOrderNumber] = useState('');
  const [editedItemName, setEditedItemName] = useState('');
  const [editedQuantity, setEditedQuantity] = useState<number>(0);
  const [editedTotalAmount, setEditedTotalAmount] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState(
    'Reviewed & verified against original document.'
  );

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await api.getDocuments();
      setDocuments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      await api.uploadDocument(formData);
      await loadDocuments();
      onDataMutated();
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleQuickTextIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setUploadError(null);
    try {
      const blob = new Blob([sampleText], { type: 'text/plain' });
      const file = new File([blob], sampleFilename, { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('doc_type', docType);
      await api.uploadDocument(formData);
      await loadDocuments();
      onDataMutated();
    } catch (err: any) {
      setUploadError(err.message || 'Ingestion failed');
    } finally {
      setUploading(false);
    }
  };

  const openReviewModal = (rec: ExtractedRecord) => {
    setReviewRecord(rec);
    const j = rec.extracted_json || {};
    setEditedPartyName(j.party_name || '');
    setEditedOrderNumber(j.order_number || '');
    setEditedItemName(j.item_name || '');
    setEditedQuantity(Number(j.quantity || 0));
    setEditedTotalAmount(Number(j.total_amount || 0));
  };

  const submitReview = async (decision: 'approved' | 'rejected') => {
    if (!reviewRecord) return;
    await api.reviewExtraction(reviewRecord.id, {
      decision,
      edited_data: {
        party_name: editedPartyName,
        order_number: editedOrderNumber,
        item_name: editedItemName,
        quantity: Number(editedQuantity),
        total_amount: Number(editedTotalAmount),
      },
      comment: reviewComment,
    });
    setReviewRecord(null);
    await loadDocuments();
    onDataMutated();
  };

  return (
    <div className="space-y-6">
      {/* Ingestion Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Upload Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Invoice, Challan, Ledger or Voice Note</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Supports PDF (PyMuPDF), CSV, TXT, PNG/JPG (Vision OCR), and WAV/MP3/M4A Voice Notes (Max 15 MB)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold text-slate-700 shrink-0">
              Document Type:
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white flex-1"
            >
              <option value="order_message">WhatsApp Order / Message (.txt)</option>
              <option value="invoice">Tax Invoice (.pdf / .png / .jpg)</option>
              <option value="delivery_challan">Delivery Challan (.pdf / .txt)</option>
              <option value="voice_note">Voice Note Audio (.wav / .mp3 / .m4a)</option>
              <option value="ledger_csv">Party Ledger (.csv)</option>
            </select>
          </div>

          <label className="block border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl p-6 text-center cursor-pointer bg-indigo-50/40 transition">
            <input
              type="file"
              accept=".pdf,.txt,.csv,.png,.jpg,.jpeg,.wav,.mp3,.m4a"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className="flex justify-center gap-2 text-indigo-600 mb-2">
              <FileText className="w-6 h-6" />
              <Mic className="w-6 h-6" />
            </div>
            <p className="text-xs font-bold text-slate-800">
              {uploading
                ? 'Validating, extracting & indexing chunks...'
                : 'Click to select a PDF, TXT, CSV, Image, or Audio Voice Note'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              SHA-256 duplicate detection + Prompt-injection defense active
            </p>
          </label>

          {uploadError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {uploadError}
            </div>
          )}
        </div>

        {/* Instant WhatsApp / Transcript Paste Tester */}
        <form
          onSubmit={handleQuickTextIngest}
          className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3"
        >
          <h2 className="text-sm font-bold text-slate-900">
            Quick WhatsApp Export / Voice Transcript Simulator
          </h2>
          <p className="text-xs text-slate-500">
            Paste any customer WhatsApp message or voice note transcript below to test Pydantic structured extraction and the human review queue.
          </p>
          <input
            type="text"
            required
            value={sampleFilename}
            onChange={(e) => setSampleFilename(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium"
            placeholder="Filename (e.g. WhatsApp_Order.txt)"
          />
          <textarea
            rows={3}
            required
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono"
          />
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            Extract Structured Entities (Enters Human Review Queue)
          </button>
        </form>
      </div>

      {/* Documents & Extraction Queue List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Uploaded Source Documents & Human-in-the-Loop Verification Queue ({documents.length})
            </h2>
            <p className="text-xs text-slate-500">
              Uncertain or newly extracted records stay in <strong>Pending Review</strong> until approved by an authorized user.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading documents...
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-slate-900">
                      📄 {doc.filename}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {doc.doc_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      SHA256: {doc.sha256_hash.slice(0, 10)}...
                    </span>
                    {doc.is_demo && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-200 text-amber-950">
                        DEMO
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500">
                    Pipeline: <strong>{doc.provider_used}</strong> • Job Status:{' '}
                    <span className="font-bold text-indigo-700">{doc.job_status}</span>
                  </div>
                </div>

                {doc.raw_text && (
                  <pre className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap font-mono">
                    {doc.raw_text}
                  </pre>
                )}

                {/* Extracted Candidate Records */}
                {doc.extracted_records && doc.extracted_records.length > 0 && (
                  <div className="space-y-2">
                    {doc.extracted_records.map((er) => (
                      <div
                        key={er.id}
                        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
                          er.review_status === 'pending_review'
                            ? 'bg-amber-50/70 border-amber-300'
                            : er.review_status === 'approved'
                            ? 'bg-emerald-50/50 border-emerald-200'
                            : 'bg-rose-50/50 border-rose-200'
                        }`}
                      >
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold uppercase text-[10px] px-2 py-0.5 rounded bg-white border">
                              Extracted {er.record_type}
                            </span>
                            <span className="font-semibold text-slate-700">
                              Confidence: {Math.round(er.confidence_score * 100)}%
                            </span>
                            <span
                              className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                                er.review_status === 'pending_review'
                                  ? 'bg-amber-200 text-amber-950'
                                  : er.review_status === 'approved'
                                  ? 'bg-emerald-200 text-emerald-950'
                                  : 'bg-rose-200 text-rose-950'
                              }`}
                            >
                              {er.review_status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-slate-800">
                            Party: <strong>{er.extracted_json.party_name}</strong> • Order:{' '}
                            <strong>{er.extracted_json.order_number || 'Auto'}</strong> • Item:{' '}
                            <strong>{er.extracted_json.item_name}</strong> • Qty:{' '}
                            <strong>
                              {er.extracted_json.quantity} {er.extracted_json.unit}
                            </strong>{' '}
                            • Amount: <strong>₹{er.extracted_json.total_amount}</strong>
                          </p>
                          {er.extracted_json.duplicate_warning && (
                            <p className="text-rose-700 font-semibold">
                              ⚠️ {er.extracted_json.duplicate_warning}
                            </p>
                          )}
                        </div>

                        <button
                          onClick={() => openReviewModal(er)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {er.review_status === 'pending_review'
                              ? 'Review, Edit & Approve'
                              : 'Inspect / Re-Verify'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Human Review & Edit of Extracted Record */}
      {reviewRecord && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Human-in-the-Loop Extraction Verification
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify or correct the extracted fields below before promoting this record into trusted Orders & Commitments.
              </p>
            </div>

            {reviewRecord.source_snippet && (
              <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">
                  Source Quote ({reviewRecord.source_page_or_line})
                </span>
                <p className="italic text-slate-800 mt-1">
                  "{reviewRecord.source_snippet}"
                </p>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Party Name</label>
                  <input
                    type="text"
                    value={editedPartyName}
                    onChange={(e) => setEditedPartyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Order Number</label>
                  <input
                    type="text"
                    value={editedOrderNumber}
                    onChange={(e) => setEditedOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Item Name</label>
                <input
                  type="text"
                  value={editedItemName}
                  onChange={(e) => setEditedItemName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Quantity</label>
                  <input
                    type="number"
                    value={editedQuantity}
                    onChange={(e) => setEditedQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Total Amount (₹)</label>
                  <input
                    type="number"
                    value={editedTotalAmount}
                    onChange={(e) => setEditedTotalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold block mb-1">Reviewer Audit Note</label>
                <input
                  type="text"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setReviewRecord(null)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => submitReview('rejected')}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-rose-100 text-rose-800 text-xs font-bold hover:bg-rose-200"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => submitReview('approved')}
                  className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve into Business Memory</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
