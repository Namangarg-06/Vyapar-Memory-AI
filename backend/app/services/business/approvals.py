"""Human-in-the-loop approval workflows and immutable audit logging."""

from datetime import date, datetime, timedelta, timezone
from typing import Any
from sqlalchemy.orm import Session

from app.models import (
    AIDraft,
    ApprovalRecord,
    AuditEvent,
    Commitment,
    DeliveryRecord,
    ExtractedRecord,
    FollowUpTask,
    Order,
    Party,
    User,
)
from app.services.business.commitments import get_workspace_today, refresh_workspace_commitments
from app.services.business.rules import evaluate_order_discrepancies


def log_audit_event(
    db: Session,
    workspace_id: int,
    action: str,
    entity_type: str,
    summary: str,
    entity_id: int | None = None,
    actor: User | None = None,
    details: dict[str, Any] | None = None,
    is_demo: bool = False,
) -> AuditEvent:
    """Create an immutable audit log entry for important workspace operations."""
    event = AuditEvent(
        workspace_id=workspace_id,
        actor_user_id=actor.id if actor else None,
        actor_name=actor.full_name if actor else "System",
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        summary=summary,
        details_json=details or {},
        is_demo=is_demo,
    )
    db.add(event)
    db.commit()
    return event


def _parse_iso_date(val: str | None, fallback: date) -> date:
    if not val:
        return fallback
    try:
        return date.fromisoformat(val[:10])
    except ValueError:
        return fallback


def review_extracted_record(
    db: Session,
    record: ExtractedRecord,
    decision: str,
    user: User,
    edited_data: dict[str, Any] | None = None,
    comment: str | None = None,
) -> ExtractedRecord:
    """Review, optionally edit, and approve or reject an LLM-extracted record.

    Uncertain extraction results never become trusted business data until approved here.
    """
    if edited_data:
        merged = {**record.extracted_json, **edited_data}
        record.extracted_json = merged

    record.review_status = decision
    record.reviewed_by = user.id
    record.reviewed_at = datetime.now(timezone.utc)

    approval = ApprovalRecord(
        workspace_id=record.workspace_id,
        entity_type="extracted_record",
        entity_id=record.id,
        decision=decision,
        edited_content=str(edited_data) if edited_data else None,
        comment=comment,
        decided_by=user.id,
        is_demo=record.is_demo,
    )
    db.add(approval)

    if decision == "approved":
        data = record.extracted_json
        today = get_workspace_today()
        party_name = (data.get("party_name") or "Unknown Party").strip()
        party_type = data.get("party_type") or "customer"

        # 1. Find or create Party
        party = (
            db.query(Party)
            .filter(
                Party.workspace_id == record.workspace_id,
                Party.name.ilike(party_name),
            )
            .first()
        )
        if not party:
            party = Party(
                workspace_id=record.workspace_id,
                party_type=party_type if party_type in ("customer", "supplier") else "customer",
                name=party_name,
                is_demo=record.is_demo,
            )
            db.add(party)
            db.flush()

        # 2. Find or create Order if order_number or item_name is present
        order_number = data.get("order_number") or f"ORD-{record.document_id:04d}"
        order = (
            db.query(Order)
            .filter(
                Order.workspace_id == record.workspace_id,
                Order.order_number == order_number,
            )
            .first()
        )
        qty = float(data.get("quantity") or 0.0)
        unit = data.get("unit") or "boxes"
        unit_price = float(data.get("unit_price") or 0.0)
        total_amount = float(data.get("total_amount") or (qty * unit_price))
        doc_date = _parse_iso_date(data.get("document_date"), today)
        due_date = _parse_iso_date(data.get("due_date"), today + timedelta(days=3))

        if not order:
            order = Order(
                workspace_id=record.workspace_id,
                party_id=party.id,
                order_number=order_number,
                status="confirmed",
                item_name=data.get("item_name") or "General Wholesale Goods",
                unit=unit,
                ordered_quantity=qty if record.record_type == "order" else qty,
                invoiced_quantity=qty if record.record_type == "invoice" else 0.0,
                delivered_quantity=qty if record.record_type == "delivery" else 0.0,
                unit_price=unit_price,
                total_amount=total_amount,
                invoice_number=data.get("invoice_number"),
                order_date=doc_date,
                due_date=due_date,
                source_document_id=record.document_id if record.record_type == "order" else None,
                invoice_document_id=record.document_id if record.record_type == "invoice" else None,
                is_demo=record.is_demo,
            )
            db.add(order)
            db.flush()
        else:
            if record.record_type == "order" and qty > 0:
                order.ordered_quantity = qty
                order.source_document_id = record.document_id
            elif record.record_type == "invoice" and qty > 0:
                order.invoiced_quantity = qty
                order.invoice_number = data.get("invoice_number") or order.invoice_number
                order.invoice_document_id = record.document_id
                if total_amount > 0:
                    order.total_amount = total_amount

        # 3. If delivery record, log DeliveryRecord
        if record.record_type == "delivery" and qty > 0:
            challan_no = data.get("challan_number") or f"DC-{record.document_id:04d}"
            deliv = DeliveryRecord(
                workspace_id=record.workspace_id,
                order_id=order.id,
                challan_number=challan_no,
                delivered_quantity=qty,
                delivery_date=doc_date,
                confirmation_status="partial" if qty < order.ordered_quantity else "confirmed",
                source_document_id=record.document_id,
                notes=record.source_snippet,
                is_demo=record.is_demo,
            )
            db.add(deliv)
            db.flush()

        # 4. Create extracted commitments
        for comm_item in data.get("commitments") or []:
            c_due = _parse_iso_date(comm_item.get("due_date"), due_date)
            comm = Commitment(
                workspace_id=record.workspace_id,
                order_id=order.id,
                party_id=party.id,
                source_document_id=record.document_id,
                commitment_type=comm_item.get("commitment_type") or "delivery",
                title=comm_item.get("title") or f"Commitment for {party.name}",
                description=comm_item.get("verbatim_quote") or record.source_snippet or "",
                due_date=c_due,
                source_quote=comm_item.get("verbatim_quote") or record.source_snippet,
                is_demo=record.is_demo,
            )
            db.add(comm)

        db.commit()
        evaluate_order_discrepancies(db, order)
        refresh_workspace_commitments(db, record.workspace_id)

    db.commit()
    log_audit_event(
        db=db,
        workspace_id=record.workspace_id,
        action=f"extraction.{decision}",
        entity_type="extracted_record",
        entity_id=record.id,
        summary=f"User {user.full_name} {decision} extracted {record.record_type} record #{record.id}",
        actor=user,
        details={"decision": decision, "comment": comment},
        is_demo=record.is_demo,
    )
    return record


def approve_or_reject_draft(
    db: Session,
    draft: AIDraft,
    decision: str,
    user: User,
    edited_body_text: str | None = None,
    comment: str | None = None,
) -> AIDraft:
    """Explicit human approval workflow before any follow-up message can be used/sent."""
    if edited_body_text and edited_body_text.strip():
        draft.body_text = edited_body_text.strip()

    draft.status = decision
    draft.approved_by = user.id
    draft.approved_at = datetime.now(timezone.utc)

    approval = ApprovalRecord(
        workspace_id=draft.workspace_id,
        entity_type="ai_draft",
        entity_id=draft.id,
        decision=decision,
        edited_content=edited_body_text,
        comment=comment,
        decided_by=user.id,
        is_demo=draft.is_demo,
    )
    db.add(approval)

    task = db.query(FollowUpTask).filter(FollowUpTask.id == draft.task_id).first()
    if task:
        task.status = "approved_ready" if decision == "approved" else "pending"

    db.commit()
    log_audit_event(
        db=db,
        workspace_id=draft.workspace_id,
        action=f"draft.{decision}",
        entity_type="ai_draft",
        entity_id=draft.id,
        summary=f"Follow-up draft ({draft.language}) {decision} by {user.full_name}",
        actor=user,
        details={"task_id": draft.task_id, "language": draft.language, "comment": comment},
        is_demo=draft.is_demo,
    )
    return draft
