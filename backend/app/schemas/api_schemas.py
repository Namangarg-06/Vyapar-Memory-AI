"""Pydantic v2 request, response, and structured LLM extraction schemas."""

from datetime import date, datetime
from typing import Any, Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ==============================================================================
# AUTHENTICATION & WORKSPACE SCHEMAS
# ==============================================================================
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=255)
    workspace_name: str = Field(default="Sharma & Sons Wholesale", min_length=2, max_length=255)
    business_type: str = Field(default="Wholesaler & Distributor", max_length=100)
    city: str | None = Field(default="Delhi", max_length=100)
    gstin: str | None = Field(default=None, max_length=32)
    seed_demo_data: bool = Field(default=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class WorkspaceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    business_type: str
    timezone: str
    gstin: str | None = None
    city: str | None = None
    role: str = "owner"


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: str
    is_active: bool
    created_at: datetime


class AuthTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    workspace: WorkspaceResponse


# ==============================================================================
# PARTY (CUSTOMER / SUPPLIER) SCHEMAS
# ==============================================================================
class PartyCreate(BaseModel):
    party_type: Literal["customer", "supplier"] = "customer"
    name: str = Field(..., min_length=2, max_length=255)
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    gstin: str | None = None
    city: str | None = None
    notes: str | None = None


class PartyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    party_type: str
    name: str
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    gstin: str | None = None
    city: str | None = None
    notes: str | None = None
    is_demo: bool
    created_at: datetime


# ==============================================================================
# ORDER, DELIVERY & COMMITMENT SCHEMAS
# ==============================================================================
class OrderCreate(BaseModel):
    party_id: int
    order_number: str = Field(..., min_length=2, max_length=64)
    item_name: str = Field(..., min_length=2, max_length=255)
    unit: str = Field(default="boxes", max_length=32)
    ordered_quantity: float = Field(..., gt=0)
    invoiced_quantity: float = Field(default=0.0, ge=0)
    delivered_quantity: float = Field(default=0.0, ge=0)
    unit_price: float = Field(default=0.0, ge=0)
    invoice_number: str | None = None
    order_date: date
    due_date: date
    assigned_owner: str = "Operations Team"
    notes: str | None = None


class DeliveryRecordCreate(BaseModel):
    challan_number: str = Field(..., min_length=2, max_length=64)
    delivered_quantity: float = Field(..., gt=0)
    delivery_date: date
    received_by: str | None = None
    confirmation_status: Literal["confirmed", "partial", "missing_confirmation"] = "confirmed"
    notes: str | None = None


class DeliveryRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int
    challan_number: str
    delivered_quantity: float
    delivery_date: date
    received_by: str | None = None
    confirmation_status: str
    source_document_id: int | None = None
    notes: str | None = None
    is_demo: bool
    created_at: datetime


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    party_id: int
    party_name: str = ""
    order_number: str
    status: str
    item_name: str
    unit: str
    ordered_quantity: float
    invoiced_quantity: float
    delivered_quantity: float
    pending_quantity: float = 0.0
    unit_price: float
    total_amount: float
    invoice_number: str | None = None
    order_date: date
    due_date: date
    source_document_id: int | None = None
    invoice_document_id: int | None = None
    assigned_owner: str
    notes: str | None = None
    is_demo: bool
    deliveries: list[DeliveryRecordResponse] = []
    open_discrepancy_count: int = 0
    created_at: datetime


class CommitmentStatusUpdate(BaseModel):
    status: Literal["pending", "due_soon", "overdue", "fulfilled", "dismissed"]


class CommitmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    order_id: int | None = None
    party_id: int
    party_name: str = ""
    source_document_id: int | None = None
    commitment_type: str
    title: str
    description: str
    promised_by: str
    due_date: date
    days_remaining: int = 0
    status: str
    priority_score: int
    priority_reason: str
    assigned_owner: str
    source_quote: str | None = None
    is_demo: bool
    created_at: datetime


# ==============================================================================
# STRUCTURED LLM EXTRACTION & DOCUMENT SCHEMAS
# ==============================================================================
class ExtractedCommitmentItem(BaseModel):
    title: str
    commitment_type: Literal["delivery", "payment", "dispatch", "replacement"] = "delivery"
    due_date: str | None = None
    verbatim_quote: str


class StructuredDocumentExtraction(BaseModel):
    """Pydantic schema enforced on LLM structured extraction output."""

    record_type: Literal["order", "invoice", "delivery", "commitment"] = "order"
    party_name: str = Field(..., description="Customer or supplier name mentioned in the record")
    party_type: Literal["customer", "supplier"] = "customer"
    order_number: str | None = None
    invoice_number: str | None = None
    challan_number: str | None = None
    item_name: str | None = None
    quantity: float | None = Field(default=None, ge=0)
    unit: str = "boxes"
    unit_price: float | None = Field(default=None, ge=0)
    total_amount: float | None = Field(default=None, ge=0)
    document_date: str | None = None
    due_date: str | None = None
    commitments: list[ExtractedCommitmentItem] = []
    confidence_score: float = Field(default=0.88, ge=0.0, le=1.0)
    source_snippet: str = Field(..., description="Exact verbatim quote from the document supporting extraction")
    source_page_or_line: str = Field(default="Page 1 / Line 1")


class ExtractionReviewRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    edited_data: dict[str, Any] | None = None
    comment: str | None = None


class ExtractedRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    document_filename: str = ""
    record_type: str
    extracted_json: dict[str, Any]
    confidence_score: float
    source_snippet: str | None = None
    source_page_or_line: str | None = None
    review_status: str
    reviewed_at: datetime | None = None
    is_demo: bool
    created_at: datetime


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    party_id: int | None = None
    party_name: str = ""
    order_id: int | None = None
    doc_type: str
    filename: str
    mime_type: str
    file_size_bytes: int
    sha256_hash: str
    raw_text: str | None = None
    job_status: str = "completed"
    provider_used: str = "deterministic_rule_assisted"
    extracted_records: list[ExtractedRecordResponse] = []
    is_demo: bool
    created_at: datetime


# ==============================================================================
# DISCREPANCY, FOLLOW-UP TASK & AI DRAFT APPROVAL SCHEMAS
# ==============================================================================
class DiscrepancyStatusUpdate(BaseModel):
    status: Literal["open", "investigating", "followup_drafted", "resolved", "dismissed"]
    comment: str | None = None


class DiscrepancyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    workspace_id: int
    order_id: int
    order_number: str = ""
    party_id: int
    party_name: str = ""
    discrepancy_type: str
    severity: str
    title: str
    expected_value: str
    actual_value: str
    delta_value: str
    explanation: str
    recommended_action: str
    evidence_refs: list[dict[str, Any]]
    status: str
    is_demo: bool
    created_at: datetime


class GenerateDraftRequest(BaseModel):
    language: Literal["english", "hindi", "hinglish"] = "hinglish"
    channel: Literal["whatsapp", "email"] = "whatsapp"


class ApproveDraftRequest(BaseModel):
    decision: Literal["approved", "rejected"]
    edited_body_text: str | None = None
    comment: str | None = None


class AIDraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    task_id: int
    party_id: int
    party_name: str = ""
    language: str
    subject: str
    body_text: str
    supporting_evidence: list[dict[str, Any]]
    status: str
    generated_by_provider: str
    approved_at: datetime | None = None
    is_demo: bool
    created_at: datetime


class FollowUpTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_id: int | None = None
    order_number: str = ""
    discrepancy_id: int | None = None
    commitment_id: int | None = None
    party_id: int
    party_name: str = ""
    task_type: str
    title: str
    description: str
    channel: str
    due_date: date
    status: str
    assigned_owner: str
    is_demo: bool
    drafts: list[AIDraftResponse] = []
    created_at: datetime


# ==============================================================================
# RAG ASSISTANT & AUDIT SCHEMAS
# ==============================================================================
class AssistantAskRequest(BaseModel):
    question: str = Field(..., min_length=3, max_length=1000)


class SourceCitation(BaseModel):
    document_id: int | None = None
    filename: str
    doc_type: str
    page_or_line_ref: str
    verbatim_quote: str
    relevance_score: float = 1.0


class AssistantAskResponse(BaseModel):
    question: str
    answer_markdown: str
    verified_facts: list[dict[str, Any]]
    citations: list[SourceCitation]
    uncertainty_notice: str | None = None
    provider_used: str


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    actor_name: str
    action: str
    entity_type: str
    entity_id: int | None = None
    summary: str
    details_json: dict[str, Any]
    is_demo: bool
    created_at: datetime
