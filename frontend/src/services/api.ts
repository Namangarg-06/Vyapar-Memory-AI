import {
  AIDraft,
  AssistantAskResponse,
  AuditEvent,
  AuthResponse,
  Commitment,
  DashboardSummary,
  Discrepancy,
  DocumentItem,
  ExtractedRecord,
  FollowUpTask,
  Order,
  Party,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const TOKEN_KEY = 'vyapar_memory_jwt';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      // Fallback to status text
    }
    throw new Error(errorDetail);
  }

  return response.json() as Promise<T>;
}

export const api = {
  // System Health
  getHealth: () => request<Record<string, any>>('/health'),

  // Auth
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    workspace_name: string;
    business_type?: string;
    city?: string;
    seed_demo_data?: boolean;
  }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () =>
    request<{ user: AuthResponse['user']; workspace: AuthResponse['workspace'] }>(
      '/auth/me'
    ),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),

  // Parties
  getParties: (partyType?: string, search?: string) => {
    const params = new URLSearchParams();
    if (partyType) params.set('party_type', partyType);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<Party[]>(`/parties${qs ? `?${qs}` : ''}`);
  },

  createParty: (payload: Partial<Party>) =>
    request<Party>('/parties', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Orders & Deliveries
  getOrders: (statusFilter?: string, search?: string) => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status_filter', statusFilter);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<Order[]>(`/orders${qs ? `?${qs}` : ''}`);
  },

  createOrder: (payload: Record<string, any>) =>
    request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  addDelivery: (orderId: number, payload: Record<string, any>) =>
    request<Order>(`/orders/${orderId}/deliveries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Commitments
  getCommitments: () => request<Commitment[]>('/commitments'),

  updateCommitmentStatus: (commitmentId: number, status: string) =>
    request<Commitment>(`/commitments/${commitmentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // Documents & Extractions
  getDocuments: () => request<DocumentItem[]>('/documents'),

  uploadDocument: (formData: FormData) =>
    request<DocumentItem>('/documents/upload', {
      method: 'POST',
      body: formData,
    }),

  reviewExtraction: (
    recordId: number,
    payload: {
      decision: 'approved' | 'rejected';
      edited_data?: Record<string, any>;
      comment?: string;
    }
  ) =>
    request<ExtractedRecord>(`/extractions/${recordId}/review`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Discrepancies
  getDiscrepancies: () => request<Discrepancy[]>('/discrepancies'),

  scanDiscrepancies: () =>
    request<Discrepancy[]>('/discrepancies/scan', { method: 'POST' }),

  updateDiscrepancyStatus: (
    discrepancyId: number,
    status: string,
    comment?: string
  ) =>
    request<Discrepancy>(`/discrepancies/${discrepancyId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, comment }),
    }),

  // Tasks & AI Drafts
  getTasks: () => request<FollowUpTask[]>('/tasks'),

  generateDraft: (
    taskId: number,
    language: 'english' | 'hindi' | 'hinglish',
    channel: 'whatsapp' | 'email' = 'whatsapp'
  ) =>
    request<AIDraft>(`/tasks/${taskId}/generate-draft`, {
      method: 'POST',
      body: JSON.stringify({ language, channel }),
    }),

  approveDraft: (
    draftId: number,
    payload: {
      decision: 'approved' | 'rejected';
      edited_body_text?: string;
      comment?: string;
    }
  ) =>
    request<AIDraft>(`/drafts/${draftId}/approve`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  completeTask: (taskId: number) =>
    request<FollowUpTask>(`/tasks/${taskId}/complete`, {
      method: 'PATCH',
    }),

  // RAG Assistant
  askAssistant: (question: string) =>
    request<AssistantAskResponse>('/assistant/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
    }),

  // Audit & Demo
  getAuditLogs: () => request<AuditEvent[]>('/audit-logs'),

  seedDemoData: () => request<Record<string, any>>('/demo/seed', { method: 'POST' }),

  resetDemoData: (reseed: boolean = true) =>
    request<Record<string, any>>(`/demo/reset?reseed=${reseed}`, {
      method: 'POST',
    }),
};
