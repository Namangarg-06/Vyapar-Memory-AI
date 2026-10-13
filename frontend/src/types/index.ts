export interface User {
  id: number;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  business_type: string;
  timezone: string;
  gstin?: string | null;
  city?: string | null;
  role: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  workspace: Workspace;
}

export interface Party {
  id: number;
  workspace_id: number;
  party_type: 'customer' | 'supplier';
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  gstin?: string | null;
  city?: string | null;
  notes?: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface DeliveryRecord {
  id: number;
  order_id: number;
  challan_number: string;
  delivered_quantity: number;
  delivery_date: string;
  received_by?: string | null;
  confirmation_status: 'confirmed' | 'partial' | 'missing_confirmation';
  source_document_id?: number | null;
  notes?: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface Order {
  id: number;
  workspace_id: number;
  party_id: number;
  party_name: string;
  order_number: string;
  status: string;
  item_name: string;
  unit: string;
  ordered_quantity: number;
  invoiced_quantity: number;
  delivered_quantity: number;
  pending_quantity: number;
  unit_price: number;
  total_amount: number;
  invoice_number?: string | null;
  order_date: string;
  due_date: string;
  source_document_id?: number | null;
  invoice_document_id?: number | null;
  assigned_owner: string;
  notes?: string | null;
  is_demo: boolean;
  deliveries: DeliveryRecord[];
  open_discrepancy_count: number;
  created_at: string;
}

export interface Commitment {
  id: number;
  workspace_id: number;
  order_id?: number | null;
  party_id: number;
  party_name: string;
  source_document_id?: number | null;
  commitment_type: string;
  title: string;
  description: string;
  promised_by: string;
  due_date: string;
  days_remaining: number;
  status: 'pending' | 'due_soon' | 'overdue' | 'fulfilled' | 'dismissed';
  priority_score: number;
  priority_reason: string;
  assigned_owner: string;
  source_quote?: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface ExtractedRecord {
  id: number;
  document_id: number;
  document_filename: string;
  record_type: string;
  extracted_json: Record<string, any>;
  confidence_score: number;
  source_snippet?: string | null;
  source_page_or_line?: string | null;
  review_status: 'pending_review' | 'approved' | 'rejected';
  reviewed_at?: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface DocumentItem {
  id: number;
  workspace_id: number;
  party_id?: number | null;
  party_name: string;
  order_id?: number | null;
  doc_type: string;
  filename: string;
  mime_type: string;
  file_size_bytes: number;
  sha256_hash: string;
  raw_text?: string | null;
  job_status: string;
  provider_used: string;
  extracted_records: ExtractedRecord[];
  is_demo: boolean;
  created_at: string;
}

export interface EvidenceRef {
  document_id?: number | null;
  filename: string;
  doc_type: string;
  location: string;
  quote: string;
  metric?: string;
}

export interface Discrepancy {
  id: number;
  workspace_id: number;
  order_id: number;
  order_number: string;
  party_id: number;
  party_name: string;
  discrepancy_type: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  expected_value: string;
  actual_value: string;
  delta_value: string;
  explanation: string;
  recommended_action: string;
  evidence_refs: EvidenceRef[];
  status: 'open' | 'investigating' | 'followup_drafted' | 'resolved' | 'dismissed';
  is_demo: boolean;
  created_at: string;
}

export interface AIDraft {
  id: number;
  task_id: number;
  party_id: number;
  party_name: string;
  language: 'english' | 'hindi' | 'hinglish';
  subject: string;
  body_text: string;
  supporting_evidence: EvidenceRef[];
  status: 'pending_approval' | 'approved' | 'rejected';
  generated_by_provider: string;
  approved_at?: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface FollowUpTask {
  id: number;
  order_id?: number | null;
  order_number: string;
  discrepancy_id?: number | null;
  commitment_id?: number | null;
  party_id: number;
  party_name: string;
  task_type: string;
  title: string;
  description: string;
  channel: string;
  due_date: string;
  status: string;
  assigned_owner: string;
  is_demo: boolean;
  drafts: AIDraft[];
  created_at: string;
}

export interface SourceCitation {
  document_id?: number | null;
  filename: string;
  doc_type: string;
  page_or_line_ref: string;
  verbatim_quote: string;
  relevance_score: number;
}

export interface AssistantAskResponse {
  question: string;
  answer_markdown: string;
  verified_facts: Record<string, any>[];
  citations: SourceCitation[];
  uncertainty_notice?: string | null;
  provider_used: string;
}

export interface AuditEvent {
  id: number;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  summary: string;
  details_json: Record<string, any>;
  is_demo: boolean;
  created_at: string;
}

export interface DashboardSummary {
  kpis: {
    pending_orders_count: number;
    upcoming_deadlines_count: number;
    overdue_tasks_count: number;
    open_discrepancies_count: number;
    pending_reviews_count: number;
    total_parties_count: number;
  };
  has_demo_data: boolean;
  open_discrepancies: Discrepancy[];
  priority_commitments: Commitment[];
  pending_tasks: FollowUpTask[];
  recent_activity: AuditEvent[];
}
