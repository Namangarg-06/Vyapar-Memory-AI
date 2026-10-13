"""REST API v1 routes for Vyapar Memory AI."""

from datetime import datetime, timezone
import re
from typing import Any
from uuid import uuid4
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import WorkspaceContext, get_current_context
from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models import (
    AIDraft,
    AuditEvent,
    Commitment,
    DeliveryRecord,
    Discrepancy,
    Document,
    DocumentChunk,
    DocumentProcessingJob,
    ExtractedRecord,
    FollowUpTask,
    Order,
    Party,
    User,
    Workspace,
    WorkspaceMembership,
)
from app.schemas import (
    AIDraftResponse,
    ApproveDraftRequest,
    AssistantAskRequest,
    AssistantAskResponse,
    AuditEventResponse,
    AuthTokenResponse,
    CommitmentResponse,
    CommitmentStatusUpdate,
    DeliveryRecordCreate,
    DeliveryRecordResponse,
    DiscrepancyResponse,
    DiscrepancyStatusUpdate,
    DocumentResponse,
    ExtractedRecordResponse,
    ExtractionReviewRequest,
    FollowUpTaskResponse,
    GenerateDraftRequest,
    LoginRequest,
    OrderCreate,
    OrderResponse,
    PartyCreate,
    PartyResponse,
    RegisterRequest,
    UserResponse,
    WorkspaceResponse,
)
from app.services.ai.drafter import generate_followup_draft
from app.services.ai.extractor import extract_structured_record
from app.services.ai.parser import (
    ALLOWED_EXTENSIONS,
    extract_text_from_bytes,
    save_uploaded_bytes,
    validate_upload_file,
)
from app.services.ai.provider import generate_embedding
from app.services.ai.rag import answer_business_question
from app.services.business.approvals import (
    approve_or_reject_draft,
    log_audit_event,
    review_extracted_record,
)
from app.services.business.commitments import (
    get_workspace_today,
    refresh_workspace_commitments,
)
from app.services.business.demo_seed import clear_demo_data, seed_demo_workspace_data
from app.services.business.rules import (
    evaluate_order_discrepancies,
    scan_workspace_discrepancies,
)

api_router = APIRouter()


# ==============================================================================
# 1. HEALTH & PROVIDER CAPABILITY CHECK
# ==============================================================================
@api_router.get("/health", tags=["System"])
def health_check() -> dict[str, Any]:
    """Return service status and configured AI/STT provider adapters (never exposes secrets)."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "timezone": settings.DEFAULT_TIMEZONE,
        "database_dialect": "postgresql" if "postgresql" in settings.DATABASE_URL else "sqlite",
        "ai_provider": settings.active_llm_provider,
        "stt_provider": settings.active_stt_provider,
        "ocr_enabled": settings.OCR_ENABLED,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "openai_configured": bool(settings.OPENAI_API_KEY),
    }


# ==============================================================================
# 2. AUTHENTICATION & WORKSPACES
# ==============================================================================
def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "workspace"
    return f"{slug}-{uuid4().hex[:6]}"


@api_router.post("/auth/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED, tags=["Auth"])
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    """Register a user, create an isolated business workspace, and optionally seed demo data."""
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=payload.email.lower(),
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        is_active=True,
    )
    db.add(user)
    db.flush()

    workspace = Workspace(
        name=payload.workspace_name.strip(),
        slug=_slugify(payload.workspace_name),
        business_type=payload.business_type,
        timezone=settings.DEFAULT_TIMEZONE,
        city=payload.city,
        gstin=payload.gstin,
    )
    db.add(workspace)
    db.flush()

    membership = WorkspaceMembership(
        user_id=user.id,
        workspace_id=workspace.id,
        role="owner",
    )
    db.add(membership)
    db.commit()
    db.refresh(user)
    db.refresh(workspace)

    if payload.seed_demo_data:
        seed_demo_workspace_data(db, workspace.id, actor=user)

    token = create_access_token(subject=user.id, workspace_id=workspace.id, role="owner")
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        workspace=WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            business_type=workspace.business_type,
            timezone=workspace.timezone,
            gstin=workspace.gstin,
            city=workspace.city,
            role="owner",
        ),
    )


@api_router.post("/auth/login", response_model=AuthTokenResponse, tags=["Auth"])
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    """Authenticate user with email & password and issue a workspace-scoped JWT token."""
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    membership = (
        db.query(WorkspaceMembership)
        .filter(WorkspaceMembership.user_id == user.id)
        .first()
    )
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User has no assigned business workspace.",
        )

    workspace = db.query(Workspace).filter(Workspace.id == membership.workspace_id).first()
    token = create_access_token(
        subject=user.id,
        workspace_id=workspace.id,
        role=membership.role,
    )
    return AuthTokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        workspace=WorkspaceResponse(
            id=workspace.id,
            name=workspace.name,
            slug=workspace.slug,
            business_type=workspace.business_type,
            timezone=workspace.timezone,
            gstin=workspace.gstin,
            city=workspace.city,
            role=membership.role,
        ),
    )


@api_router.get("/auth/me", tags=["Auth"])
def get_me(ctx: WorkspaceContext = Depends(get_current_context)) -> dict[str, Any]:
    """Return currently authenticated user and active workspace details."""
    return {
        "user": UserResponse.model_validate(ctx.user),
        "workspace": WorkspaceResponse(
            id=ctx.workspace.id,
            name=ctx.workspace.name,
            slug=ctx.workspace.slug,
            business_type=ctx.workspace.business_type,
            timezone=ctx.workspace.timezone,
            gstin=ctx.workspace.gstin,
            city=ctx.workspace.city,
            role=ctx.role,
        ),
    }


# ==============================================================================
# 3. DASHBOARD SUMMARY
# ==============================================================================
@api_router.get("/dashboard/summary", tags=["Dashboard"])
def get_dashboard_summary(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Return executive dashboard KPIs, priority commitments, open discrepancies, and recent audit activity."""
    ws_id = ctx.workspace.id
    today = get_workspace_today(ctx.workspace.timezone)
    commitments = refresh_workspace_commitments(db, ws_id, ctx.workspace.timezone)

    parties = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ws_id).all()
    }
    orders = (
        db.query(Order)
        .filter(Order.workspace_id == ws_id)
        .order_by(Order.due_date.asc())
        .all()
    )
    discrepancies = (
        db.query(Discrepancy)
        .filter(Discrepancy.workspace_id == ws_id)
        .order_by(Discrepancy.created_at.desc())
        .all()
    )
    pending_extractions = (
        db.query(ExtractedRecord)
        .filter(
            ExtractedRecord.workspace_id == ws_id,
            ExtractedRecord.review_status == "pending_review",
        )
        .count()
    )
    tasks = (
        db.query(FollowUpTask)
        .filter(FollowUpTask.workspace_id == ws_id)
        .order_by(FollowUpTask.due_date.asc())
        .all()
    )
    recent_audit = (
        db.query(AuditEvent)
        .filter(AuditEvent.workspace_id == ws_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(8)
        .all()
    )

    pending_orders = [o for o in orders if o.status in ("confirmed", "partially_delivered", "disputed")]
    open_discrepancies = [d for d in discrepancies if d.status in ("open", "investigating", "followup_drafted")]
    overdue_commitments = [c for c in commitments if c.status == "overdue"]
    upcoming_commitments = [c for c in commitments if c.status in ("due_soon", "pending")]
    has_demo_data = any(o.is_demo for o in orders) or any(d.is_demo for d in discrepancies)

    return {
        "kpis": {
            "pending_orders_count": len(pending_orders),
            "upcoming_deadlines_count": len(upcoming_commitments),
            "overdue_tasks_count": len(overdue_commitments),
            "open_discrepancies_count": len(open_discrepancies),
            "pending_reviews_count": pending_extractions,
            "total_parties_count": len(parties),
        },
        "has_demo_data": has_demo_data,
        "open_discrepancies": [
            _serialize_discrepancy(d, parties, orders) for d in open_discrepancies[:5]
        ],
        "priority_commitments": [
            _serialize_commitment(c, parties, today) for c in commitments[:6]
        ],
        "pending_tasks": [
            _serialize_task(t, parties, orders) for t in tasks[:5]
        ],
        "recent_activity": [
            AuditEventResponse.model_validate(ev) for ev in recent_audit
        ],
    }


# ==============================================================================
# 4. CUSTOMERS & SUPPLIERS (PARTIES)
# ==============================================================================
@api_router.get("/parties", response_model=list[PartyResponse], tags=["Parties"])
def list_parties(
    party_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[PartyResponse]:
    query = db.query(Party).filter(Party.workspace_id == ctx.workspace.id)
    if party_type in ("customer", "supplier"):
        query = query.filter(Party.party_type == party_type)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            (Party.name.ilike(pattern))
            | (Party.city.ilike(pattern))
            | (Party.contact_person.ilike(pattern))
        )
    rows = query.order_by(Party.created_at.desc()).all()
    return [PartyResponse.model_validate(r) for r in rows]


@api_router.post("/parties", response_model=PartyResponse, status_code=status.HTTP_201_CREATED, tags=["Parties"])
def create_party(
    payload: PartyCreate,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> PartyResponse:
    party = Party(
        workspace_id=ctx.workspace.id,
        party_type=payload.party_type,
        name=payload.name.strip(),
        contact_person=payload.contact_person,
        phone=payload.phone,
        email=payload.email,
        gstin=payload.gstin,
        city=payload.city,
        notes=payload.notes,
        is_demo=False,
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="party.created",
        entity_type="party",
        entity_id=party.id,
        summary=f"Added {party.party_type} '{party.name}'",
        actor=ctx.user,
    )
    return PartyResponse.model_validate(party)


# ==============================================================================
# 5. ORDERS, DELIVERIES & COMMITMENTS
# ==============================================================================
def _serialize_order(order: Order, parties_map: dict[int, str], open_disc_map: dict[int, int]) -> OrderResponse:
    pending_qty = max(0.0, order.ordered_quantity - order.delivered_quantity)
    return OrderResponse(
        id=order.id,
        workspace_id=order.workspace_id,
        party_id=order.party_id,
        party_name=parties_map.get(order.party_id, "Party"),
        order_number=order.order_number,
        status=order.status,
        item_name=order.item_name,
        unit=order.unit,
        ordered_quantity=order.ordered_quantity,
        invoiced_quantity=order.invoiced_quantity,
        delivered_quantity=order.delivered_quantity,
        pending_quantity=pending_qty,
        unit_price=order.unit_price,
        total_amount=order.total_amount,
        invoice_number=order.invoice_number,
        order_date=order.order_date,
        due_date=order.due_date,
        source_document_id=order.source_document_id,
        invoice_document_id=order.invoice_document_id,
        assigned_owner=order.assigned_owner,
        notes=order.notes,
        is_demo=order.is_demo,
        deliveries=[DeliveryRecordResponse.model_validate(d) for d in order.deliveries],
        open_discrepancy_count=open_disc_map.get(order.id, 0),
        created_at=order.created_at,
    )


@api_router.get("/orders", response_model=list[OrderResponse], tags=["Orders"])
def list_orders(
    status_filter: str | None = Query(default=None),
    search: str | None = Query(default=None),
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[OrderResponse]:
    ws_id = ctx.workspace.id
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ws_id).all()
    }
    open_discs = (
        db.query(Discrepancy)
        .filter(
            Discrepancy.workspace_id == ws_id,
            Discrepancy.status.in_(["open", "investigating", "followup_drafted"]),
        )
        .all()
    )
    open_disc_map: dict[int, int] = {}
    for d in open_discs:
        open_disc_map[d.order_id] = open_disc_map.get(d.order_id, 0) + 1

    query = db.query(Order).filter(Order.workspace_id == ws_id)
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter(
            (Order.order_number.ilike(pattern))
            | (Order.item_name.ilike(pattern))
            | (Order.invoice_number.ilike(pattern))
        )
    rows = query.order_by(Order.due_date.asc(), Order.created_at.desc()).all()
    return [_serialize_order(o, parties_map, open_disc_map) for o in rows]


@api_router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED, tags=["Orders"])
def create_order(
    payload: OrderCreate,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> OrderResponse:
    party = (
        db.query(Party)
        .filter(Party.id == payload.party_id, Party.workspace_id == ctx.workspace.id)
        .first()
    )
    if not party:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer or supplier not found in workspace.")

    total_amount = payload.ordered_quantity * payload.unit_price
    order = Order(
        workspace_id=ctx.workspace.id,
        party_id=party.id,
        order_number=payload.order_number.strip(),
        status="confirmed",
        item_name=payload.item_name.strip(),
        unit=payload.unit,
        ordered_quantity=payload.ordered_quantity,
        invoiced_quantity=payload.invoiced_quantity,
        delivered_quantity=payload.delivered_quantity,
        unit_price=payload.unit_price,
        total_amount=total_amount,
        invoice_number=payload.invoice_number,
        order_date=payload.order_date,
        due_date=payload.due_date,
        assigned_owner=payload.assigned_owner,
        notes=payload.notes,
        is_demo=False,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    # Create a default delivery commitment
    comm = Commitment(
        workspace_id=ctx.workspace.id,
        order_id=order.id,
        party_id=party.id,
        commitment_type="delivery",
        title=f"Deliver {int(order.ordered_quantity)} {order.unit} of {order.item_name} to {party.name}",
        description=f"Order {order.order_number} committed for delivery by {order.due_date.isoformat()}.",
        due_date=order.due_date,
        assigned_owner=order.assigned_owner,
        is_demo=False,
    )
    db.add(comm)
    db.commit()

    discs = evaluate_order_discrepancies(db, order)
    refresh_workspace_commitments(db, ctx.workspace.id, ctx.workspace.timezone)
    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="order.created",
        entity_type="order",
        entity_id=order.id,
        summary=f"Created Order {order.order_number} for {party.name} ({int(order.ordered_quantity)} {order.unit})",
        actor=ctx.user,
    )
    return _serialize_order(order, {party.id: party.name}, {order.id: len(discs)})


@api_router.post(
    "/orders/{order_id}/deliveries",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Orders"],
)
def add_delivery_record(
    order_id: int,
    payload: DeliveryRecordCreate,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> OrderResponse:
    """Log a delivery challan against an order and automatically re-run discrepancy rules."""
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.workspace_id == ctx.workspace.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found in workspace.")

    deliv = DeliveryRecord(
        workspace_id=ctx.workspace.id,
        order_id=order.id,
        challan_number=payload.challan_number.strip(),
        delivered_quantity=payload.delivered_quantity,
        delivery_date=payload.delivery_date,
        received_by=payload.received_by,
        confirmation_status=payload.confirmation_status,
        notes=payload.notes,
        is_demo=order.is_demo,
    )
    db.add(deliv)
    db.commit()

    discs = evaluate_order_discrepancies(db, order)
    refresh_workspace_commitments(db, ctx.workspace.id, ctx.workspace.timezone)
    party = db.query(Party).filter(Party.id == order.party_id).first()

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="delivery.recorded",
        entity_type="delivery_record",
        entity_id=deliv.id,
        summary=f"Recorded Challan {deliv.challan_number} ({int(deliv.delivered_quantity)} {order.unit}) for {order.order_number}",
        actor=ctx.user,
        is_demo=order.is_demo,
    )
    return _serialize_order(
        order,
        {order.party_id: party.name if party else "Party"},
        {order.id: len(discs)},
    )


def _serialize_commitment(
    comm: Commitment,
    parties_map: dict[int, str],
    today: Any,
) -> CommitmentResponse:
    days_rem = (comm.due_date - today).days
    return CommitmentResponse(
        id=comm.id,
        workspace_id=comm.workspace_id,
        order_id=comm.order_id,
        party_id=comm.party_id,
        party_name=parties_map.get(comm.party_id, "Party"),
        source_document_id=comm.source_document_id,
        commitment_type=comm.commitment_type,
        title=comm.title,
        description=comm.description,
        promised_by=comm.promised_by,
        due_date=comm.due_date,
        days_remaining=days_rem,
        status=comm.status,
        priority_score=comm.priority_score,
        priority_reason=comm.priority_reason,
        assigned_owner=comm.assigned_owner,
        source_quote=comm.source_quote,
        is_demo=comm.is_demo,
        created_at=comm.created_at,
    )


@api_router.get("/commitments", response_model=list[CommitmentResponse], tags=["Commitments"])
def list_commitments(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[CommitmentResponse]:
    today = get_workspace_today(ctx.workspace.timezone)
    commitments = refresh_workspace_commitments(db, ctx.workspace.id, ctx.workspace.timezone)
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ctx.workspace.id).all()
    }
    return [_serialize_commitment(c, parties_map, today) for c in commitments]


@api_router.patch("/commitments/{commitment_id}", response_model=CommitmentResponse, tags=["Commitments"])
def update_commitment_status(
    commitment_id: int,
    payload: CommitmentStatusUpdate,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> CommitmentResponse:
    comm = (
        db.query(Commitment)
        .filter(Commitment.id == commitment_id, Commitment.workspace_id == ctx.workspace.id)
        .first()
    )
    if not comm:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Commitment not found in workspace.")

    comm.status = payload.status
    if payload.status in ("fulfilled", "dismissed"):
        comm.priority_score = 0
        comm.priority_reason = f"Marked as {payload.status} by {ctx.user.full_name}."
    db.commit()
    db.refresh(comm)

    party = db.query(Party).filter(Party.id == comm.party_id).first()
    today = get_workspace_today(ctx.workspace.timezone)
    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action=f"commitment.{payload.status}",
        entity_type="commitment",
        entity_id=comm.id,
        summary=f"Commitment '{comm.title}' marked {payload.status}",
        actor=ctx.user,
        is_demo=comm.is_demo,
    )
    return _serialize_commitment(comm, {comm.party_id: party.name if party else "Party"}, today)


# ==============================================================================
# 6. DOCUMENT UPLOAD, EXTRACTION & HUMAN REVIEW
# ==============================================================================
def _serialize_document(doc: Document, parties_map: dict[int, str]) -> DocumentResponse:
    job = doc.processing_jobs[-1] if doc.processing_jobs else None
    return DocumentResponse(
        id=doc.id,
        workspace_id=doc.workspace_id,
        party_id=doc.party_id,
        party_name=parties_map.get(doc.party_id, "") if doc.party_id else "",
        order_id=doc.order_id,
        doc_type=doc.doc_type,
        filename=doc.filename,
        mime_type=doc.mime_type,
        file_size_bytes=doc.file_size_bytes,
        sha256_hash=doc.sha256_hash,
        raw_text=doc.raw_text,
        job_status=job.status if job else "completed",
        provider_used=job.provider_used if job else "deterministic_rule_assisted",
        extracted_records=[
            ExtractedRecordResponse(
                id=er.id,
                document_id=doc.id,
                document_filename=doc.filename,
                record_type=er.record_type,
                extracted_json=er.extracted_json,
                confidence_score=er.confidence_score,
                source_snippet=er.source_snippet,
                source_page_or_line=er.source_page_or_line,
                review_status=er.review_status,
                reviewed_at=er.reviewed_at,
                is_demo=er.is_demo,
                created_at=er.created_at,
            )
            for er in doc.extracted_records
        ],
        is_demo=doc.is_demo,
        created_at=doc.created_at,
    )


@api_router.post(
    "/documents/upload",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Documents"],
)
async def upload_and_process_document(
    file: UploadFile = File(...),
    doc_type: str = Form(default="other"),
    party_id: int | None = Form(default=None),
    order_id: int | None = Form(default=None),
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    """Validate, store, parse, chunk, embed, and run structured extraction on an uploaded document."""
    content = await file.read()
    try:
        ext, sha256_hash = validate_upload_file(file.filename or "", content)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Check for duplicate file hash in workspace
    duplicate = (
        db.query(Document)
        .filter(
            Document.workspace_id == ctx.workspace.id,
            Document.sha256_hash == sha256_hash,
        )
        .first()
    )

    saved_path = save_uploaded_bytes(ctx.workspace.id, file.filename or "upload.txt", sha256_hash, content)
    raw_text, chunk_tuples, parser_used = extract_text_from_bytes(file.filename or "upload.txt", content)

    doc = Document(
        workspace_id=ctx.workspace.id,
        party_id=party_id,
        order_id=order_id,
        doc_type=doc_type,
        filename=file.filename or "upload.txt",
        file_path=str(saved_path),
        mime_type=ALLOWED_EXTENSIONS.get(ext, "application/octet-stream"),
        file_size_bytes=len(content),
        sha256_hash=sha256_hash,
        raw_text=raw_text,
        uploaded_by=ctx.user.id,
        is_demo=False,
    )
    db.add(doc)
    db.flush()

    for idx, (ref, c_text) in enumerate(chunk_tuples):
        chunk = DocumentChunk(
            workspace_id=ctx.workspace.id,
            document_id=doc.id,
            chunk_index=idx,
            content=c_text,
            page_or_line_ref=ref,
            embedding=generate_embedding(c_text),
            is_demo=False,
        )
        db.add(chunk)

    extracted_schema, llm_provider = extract_structured_record(raw_text, doc_type_hint=doc_type)
    extracted_dict = extracted_schema.model_dump()
    if duplicate:
        extracted_dict["duplicate_warning"] = f"Duplicate SHA-256 content matches existing document '{duplicate.filename}' (#{duplicate.id})."

    ext_record = ExtractedRecord(
        workspace_id=ctx.workspace.id,
        document_id=doc.id,
        record_type=extracted_schema.record_type,
        extracted_json=extracted_dict,
        confidence_score=extracted_schema.confidence_score,
        source_snippet=extracted_schema.source_snippet,
        source_page_or_line=extracted_schema.source_page_or_line,
        review_status="pending_review",
        is_demo=False,
    )
    db.add(ext_record)

    job = DocumentProcessingJob(
        workspace_id=ctx.workspace.id,
        document_id=doc.id,
        status="needs_review",
        provider_used=f"{parser_used}+{llm_provider}",
        completed_at=datetime.now(timezone.utc),
        is_demo=False,
    )
    db.add(job)
    db.commit()
    db.refresh(doc)

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="document.uploaded",
        entity_type="document",
        entity_id=doc.id,
        summary=f"Uploaded & extracted '{doc.filename}' ({doc.doc_type}) — awaiting human review",
        actor=ctx.user,
        details={"duplicate_of": duplicate.id if duplicate else None, "provider": llm_provider},
    )
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ctx.workspace.id).all()
    }
    return _serialize_document(doc, parties_map)


@api_router.get("/documents", response_model=list[DocumentResponse], tags=["Documents"])
def list_documents(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[DocumentResponse]:
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ctx.workspace.id).all()
    }
    docs = (
        db.query(Document)
        .filter(Document.workspace_id == ctx.workspace.id)
        .order_by(Document.created_at.desc())
        .all()
    )
    return [_serialize_document(d, parties_map) for d in docs]


@api_router.post(
    "/extractions/{record_id}/review",
    response_model=ExtractedRecordResponse,
    tags=["Documents"],
)
def review_extraction_endpoint(
    record_id: int,
    payload: ExtractionReviewRequest,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> ExtractedRecordResponse:
    """Approve (with optional edits) or reject an extracted record before it enters trusted business tables."""
    record = (
        db.query(ExtractedRecord)
        .filter(
            ExtractedRecord.id == record_id,
            ExtractedRecord.workspace_id == ctx.workspace.id,
        )
        .first()
    )
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Extracted record not found in workspace.")

    updated = review_extracted_record(
        db=db,
        record=record,
        decision=payload.decision,
        user=ctx.user,
        edited_data=payload.edited_data,
        comment=payload.comment,
    )
    doc = db.query(Document).filter(Document.id == updated.document_id).first()
    if doc and doc.processing_jobs:
        doc.processing_jobs[-1].status = "completed"
        db.commit()

    return ExtractedRecordResponse(
        id=updated.id,
        document_id=updated.document_id,
        document_filename=doc.filename if doc else "",
        record_type=updated.record_type,
        extracted_json=updated.extracted_json,
        confidence_score=updated.confidence_score,
        source_snippet=updated.source_snippet,
        source_page_or_line=updated.source_page_or_line,
        review_status=updated.review_status,
        reviewed_at=updated.reviewed_at,
        is_demo=updated.is_demo,
        created_at=updated.created_at,
    )


# ==============================================================================
# 7. DISCREPANCIES
# ==============================================================================
def _serialize_discrepancy(
    d: Discrepancy,
    parties_map: dict[int, str],
    orders_list: list[Order],
) -> DiscrepancyResponse:
    order_no_map = {o.id: o.order_number for o in orders_list}
    return DiscrepancyResponse(
        id=d.id,
        workspace_id=d.workspace_id,
        order_id=d.order_id,
        order_number=order_no_map.get(d.order_id, f"ORD-{d.order_id}"),
        party_id=d.party_id,
        party_name=parties_map.get(d.party_id, "Party"),
        discrepancy_type=d.discrepancy_type,
        severity=d.severity,
        title=d.title,
        expected_value=d.expected_value,
        actual_value=d.actual_value,
        delta_value=d.delta_value,
        explanation=d.explanation,
        recommended_action=d.recommended_action,
        evidence_refs=d.evidence_refs,
        status=d.status,
        is_demo=d.is_demo,
        created_at=d.created_at,
    )


@api_router.get("/discrepancies", response_model=list[DiscrepancyResponse], tags=["Discrepancies"])
def list_discrepancies(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[DiscrepancyResponse]:
    ws_id = ctx.workspace.id
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ws_id).all()
    }
    orders_list = db.query(Order).filter(Order.workspace_id == ws_id).all()
    rows = (
        db.query(Discrepancy)
        .filter(Discrepancy.workspace_id == ws_id)
        .order_by(Discrepancy.created_at.desc())
        .all()
    )
    return [_serialize_discrepancy(d, parties_map, orders_list) for d in rows]


@api_router.post("/discrepancies/scan", response_model=list[DiscrepancyResponse], tags=["Discrepancies"])
def run_discrepancy_scan(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[DiscrepancyResponse]:
    ws_id = ctx.workspace.id
    rows = scan_workspace_discrepancies(db, ws_id)
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ws_id).all()
    }
    orders_list = db.query(Order).filter(Order.workspace_id == ws_id).all()
    return [_serialize_discrepancy(d, parties_map, orders_list) for d in rows]


@api_router.patch("/discrepancies/{discrepancy_id}", response_model=DiscrepancyResponse, tags=["Discrepancies"])
def update_discrepancy_status(
    discrepancy_id: int,
    payload: DiscrepancyStatusUpdate,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> DiscrepancyResponse:
    disc = (
        db.query(Discrepancy)
        .filter(
            Discrepancy.id == discrepancy_id,
            Discrepancy.workspace_id == ctx.workspace.id,
        )
        .first()
    )
    if not disc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Discrepancy not found in workspace.")

    disc.status = payload.status
    db.commit()
    db.refresh(disc)

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action=f"discrepancy.{payload.status}",
        entity_type="discrepancy",
        entity_id=disc.id,
        summary=f"Discrepancy '{disc.title}' updated to {payload.status}",
        actor=ctx.user,
        details={"comment": payload.comment},
        is_demo=disc.is_demo,
    )
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ctx.workspace.id).all()
    }
    orders_list = db.query(Order).filter(Order.workspace_id == ctx.workspace.id).all()
    return _serialize_discrepancy(disc, parties_map, orders_list)


# ==============================================================================
# 8. FOLLOW-UP TASKS & MULTILINGUAL AI DRAFT APPROVALS
# ==============================================================================
def _serialize_task(
    t: FollowUpTask,
    parties_map: dict[int, str],
    orders_list: list[Order],
) -> FollowUpTaskResponse:
    order_no_map = {o.id: o.order_number for o in orders_list}
    p_name = parties_map.get(t.party_id, "Party")
    return FollowUpTaskResponse(
        id=t.id,
        order_id=t.order_id,
        order_number=order_no_map.get(t.order_id, "") if t.order_id else "",
        discrepancy_id=t.discrepancy_id,
        commitment_id=t.commitment_id,
        party_id=t.party_id,
        party_name=p_name,
        task_type=t.task_type,
        title=t.title,
        description=t.description,
        channel=t.channel,
        due_date=t.due_date,
        status=t.status,
        assigned_owner=t.assigned_owner,
        is_demo=t.is_demo,
        drafts=[
            AIDraftResponse(
                id=dr.id,
                task_id=dr.task_id,
                party_id=dr.party_id,
                party_name=p_name,
                language=dr.language,
                subject=dr.subject,
                body_text=dr.body_text,
                supporting_evidence=dr.supporting_evidence,
                status=dr.status,
                generated_by_provider=dr.generated_by_provider,
                approved_at=dr.approved_at,
                is_demo=dr.is_demo,
                created_at=dr.created_at,
            )
            for dr in t.drafts
        ],
        created_at=t.created_at,
    )


@api_router.get("/tasks", response_model=list[FollowUpTaskResponse], tags=["Tasks & Drafts"])
def list_tasks(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[FollowUpTaskResponse]:
    ws_id = ctx.workspace.id
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ws_id).all()
    }
    orders_list = db.query(Order).filter(Order.workspace_id == ws_id).all()
    tasks = (
        db.query(FollowUpTask)
        .filter(FollowUpTask.workspace_id == ws_id)
        .order_by(FollowUpTask.due_date.asc(), FollowUpTask.created_at.desc())
        .all()
    )
    return [_serialize_task(t, parties_map, orders_list) for t in tasks]


@api_router.post(
    "/tasks/{task_id}/generate-draft",
    response_model=AIDraftResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Tasks & Drafts"],
)
def create_task_draft(
    task_id: int,
    payload: GenerateDraftRequest,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> AIDraftResponse:
    task = (
        db.query(FollowUpTask)
        .filter(FollowUpTask.id == task_id, FollowUpTask.workspace_id == ctx.workspace.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Follow-up task not found in workspace.")

    draft = generate_followup_draft(db, task, language=payload.language)
    party = db.query(Party).filter(Party.id == draft.party_id).first()

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="draft.generated",
        entity_type="ai_draft",
        entity_id=draft.id,
        summary=f"Generated {draft.language.capitalize()} follow-up draft for {party.name if party else 'Party'}",
        actor=ctx.user,
        is_demo=draft.is_demo,
    )
    return AIDraftResponse(
        id=draft.id,
        task_id=draft.task_id,
        party_id=draft.party_id,
        party_name=party.name if party else "Party",
        language=draft.language,
        subject=draft.subject,
        body_text=draft.body_text,
        supporting_evidence=draft.supporting_evidence,
        status=draft.status,
        generated_by_provider=draft.generated_by_provider,
        approved_at=draft.approved_at,
        is_demo=draft.is_demo,
        created_at=draft.created_at,
    )


@api_router.post("/drafts/{draft_id}/approve", response_model=AIDraftResponse, tags=["Tasks & Drafts"])
def approve_draft_endpoint(
    draft_id: int,
    payload: ApproveDraftRequest,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> AIDraftResponse:
    """Explicit human approval gate for AI-generated external follow-up drafts."""
    draft = (
        db.query(AIDraft)
        .filter(AIDraft.id == draft_id, AIDraft.workspace_id == ctx.workspace.id)
        .first()
    )
    if not draft:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI draft not found in workspace.")

    updated = approve_or_reject_draft(
        db=db,
        draft=draft,
        decision=payload.decision,
        user=ctx.user,
        edited_body_text=payload.edited_body_text,
        comment=payload.comment,
    )
    party = db.query(Party).filter(Party.id == updated.party_id).first()
    return AIDraftResponse(
        id=updated.id,
        task_id=updated.task_id,
        party_id=updated.party_id,
        party_name=party.name if party else "Party",
        language=updated.language,
        subject=updated.subject,
        body_text=updated.body_text,
        supporting_evidence=updated.supporting_evidence,
        status=updated.status,
        generated_by_provider=updated.generated_by_provider,
        approved_at=updated.approved_at,
        is_demo=updated.is_demo,
        created_at=updated.created_at,
    )


@api_router.patch("/tasks/{task_id}/complete", response_model=FollowUpTaskResponse, tags=["Tasks & Drafts"])
def mark_task_completed(
    task_id: int,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> FollowUpTaskResponse:
    task = (
        db.query(FollowUpTask)
        .filter(FollowUpTask.id == task_id, FollowUpTask.workspace_id == ctx.workspace.id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in workspace.")

    task.status = "completed"
    db.commit()
    db.refresh(task)

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="task.completed",
        entity_type="followup_task",
        entity_id=task.id,
        summary=f"Follow-up task '{task.title}' marked completed by {ctx.user.full_name}",
        actor=ctx.user,
        is_demo=task.is_demo,
    )
    parties_map = {
        p.id: p.name for p in db.query(Party).filter(Party.workspace_id == ctx.workspace.id).all()
    }
    orders_list = db.query(Order).filter(Order.workspace_id == ctx.workspace.id).all()
    return _serialize_task(task, parties_map, orders_list)


# ==============================================================================
# 9. HYBRID RAG BUSINESS ASSISTANT
# ==============================================================================
@api_router.post("/assistant/ask", response_model=AssistantAskResponse, tags=["AI Assistant"])
def ask_business_assistant(
    payload: AssistantAskRequest,
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> AssistantAskResponse:
    """Answer business memory queries grounded in structured SQL tables and vector document chunks."""
    response = answer_business_question(
        db=db,
        workspace_id=ctx.workspace.id,
        question=payload.question,
    )
    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="assistant.queried",
        entity_type="assistant",
        summary=f"Queried AI Business Memory: '{payload.question[:80]}'",
        actor=ctx.user,
        details={"citations_count": len(response.citations), "provider": response.provider_used},
    )
    return response


# ==============================================================================
# 10. AUDIT LOGS & DEMO DATA MANAGEMENT
# ==============================================================================
@api_router.get("/audit-logs", response_model=list[AuditEventResponse], tags=["Audit & Demo"])
def list_audit_logs(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> list[AuditEventResponse]:
    rows = (
        db.query(AuditEvent)
        .filter(AuditEvent.workspace_id == ctx.workspace.id)
        .order_by(AuditEvent.created_at.desc())
        .limit(100)
        .all()
    )
    return [AuditEventResponse.model_validate(r) for r in rows]


@api_router.post("/demo/seed", tags=["Audit & Demo"])
def seed_demo_endpoint(
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Seed or reset the Sharma Traders 50-ordered / 50-invoiced / 45-delivered demo scenario."""
    return seed_demo_workspace_data(db, ctx.workspace.id, actor=ctx.user)


@api_router.post("/demo/reset", tags=["Audit & Demo"])
def reset_demo_endpoint(
    reseed: bool = Query(default=True),
    ctx: WorkspaceContext = Depends(get_current_context),
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    """Safely delete all records flagged is_demo=True and optionally re-seed fresh demo data."""
    deleted = clear_demo_data(db, ctx.workspace.id)
    if reseed:
        seeded = seed_demo_workspace_data(db, ctx.workspace.id, actor=ctx.user)
        return {"deleted_demo_records": deleted, **seeded}

    log_audit_event(
        db=db,
        workspace_id=ctx.workspace.id,
        action="demo.cleared",
        entity_type="workspace",
        entity_id=ctx.workspace.id,
        summary=f"Cleared {deleted} synthetic demo records (real workspace records preserved)",
        actor=ctx.user,
    )
    return {"status": "cleared", "deleted_demo_records": deleted, "is_demo": False}
