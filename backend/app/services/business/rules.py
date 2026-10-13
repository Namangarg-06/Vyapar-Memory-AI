"""Deterministic rule engine for comparing ordered, invoiced, and delivered quantities."""

from datetime import timedelta
from typing import Any
from sqlalchemy.orm import Session

from app.models import (
    DeliveryRecord,
    Discrepancy,
    Document,
    FollowUpTask,
    Order,
    Party,
)
from app.services.business.commitments import get_workspace_today


def _fmt_qty(val: float, unit: str) -> str:
    qty_str = f"{int(val)}" if float(val).is_integer() else f"{val:.2f}"
    return f"{qty_str} {unit}"


def _build_order_evidence(db: Session, order: Order, deliveries: list[DeliveryRecord]) -> list[dict[str, Any]]:
    """Collect verifiable source document references for an order's discrepancy."""
    evidence: list[dict[str, Any]] = []

    if order.source_document_id:
        src_doc = db.query(Document).filter(Document.id == order.source_document_id).first()
        if src_doc:
            quote = (src_doc.raw_text or "").strip().splitlines()[0] if src_doc.raw_text else f"Ordered {order.ordered_quantity} {order.unit}"
            evidence.append(
                {
                    "document_id": src_doc.id,
                    "filename": src_doc.filename,
                    "doc_type": src_doc.doc_type,
                    "location": "Line 1 / Message 1",
                    "quote": quote[:240],
                    "metric": f"Ordered: {_fmt_qty(order.ordered_quantity, order.unit)}",
                }
            )

    if order.invoice_document_id:
        inv_doc = db.query(Document).filter(Document.id == order.invoice_document_id).first()
        if inv_doc:
            evidence.append(
                {
                    "document_id": inv_doc.id,
                    "filename": inv_doc.filename,
                    "doc_type": inv_doc.doc_type,
                    "location": "Page 1 / Invoice Table",
                    "quote": f"Invoice {order.invoice_number or 'N/A'} billed for {_fmt_qty(order.invoiced_quantity, order.unit)} of {order.item_name} (Rs. {order.total_amount:,.0f}).",
                    "metric": f"Invoiced: {_fmt_qty(order.invoiced_quantity, order.unit)}",
                }
            )

    for deliv in deliveries:
        deliv_doc = (
            db.query(Document).filter(Document.id == deliv.source_document_id).first()
            if deliv.source_document_id
            else None
        )
        evidence.append(
            {
                "document_id": deliv_doc.id if deliv_doc else None,
                "filename": deliv_doc.filename if deliv_doc else f"Challan {deliv.challan_number}",
                "doc_type": "delivery_challan",
                "location": f"Challan {deliv.challan_number} ({deliv.delivery_date.isoformat()})",
                "quote": deliv.notes or f"Delivered {_fmt_qty(deliv.delivered_quantity, order.unit)} under Challan {deliv.challan_number}. Status: {deliv.confirmation_status}.",
                "metric": f"Delivered: {_fmt_qty(deliv.delivered_quantity, order.unit)}",
            }
        )

    return evidence


def _upsert_discrepancy(
    db: Session,
    order: Order,
    discrepancy_type: str,
    severity: str,
    title: str,
    expected_value: str,
    actual_value: str,
    delta_value: str,
    explanation: str,
    recommended_action: str,
    evidence_refs: list[dict[str, Any]],
) -> Discrepancy:
    """Create or update an active discrepancy without producing duplicate alerts."""
    existing = (
        db.query(Discrepancy)
        .filter(
            Discrepancy.workspace_id == order.workspace_id,
            Discrepancy.order_id == order.id,
            Discrepancy.discrepancy_type == discrepancy_type,
        )
        .first()
    )

    if existing:
        # Preserve resolved/dismissed status unless quantity changed
        existing.severity = severity
        existing.title = title
        existing.expected_value = expected_value
        existing.actual_value = actual_value
        existing.delta_value = delta_value
        existing.explanation = explanation
        existing.recommended_action = recommended_action
        existing.evidence_refs = evidence_refs
        return existing

    disc = Discrepancy(
        workspace_id=order.workspace_id,
        order_id=order.id,
        party_id=order.party_id,
        discrepancy_type=discrepancy_type,
        severity=severity,
        title=title,
        expected_value=expected_value,
        actual_value=actual_value,
        delta_value=delta_value,
        explanation=explanation,
        recommended_action=recommended_action,
        evidence_refs=evidence_refs,
        status="open",
        is_demo=order.is_demo,
    )
    db.add(disc)
    db.flush()

    # Automatically create a follow-up task if none exists for this discrepancy
    existing_task = (
        db.query(FollowUpTask)
        .filter(
            FollowUpTask.workspace_id == order.workspace_id,
            FollowUpTask.discrepancy_id == disc.id,
        )
        .first()
    )
    if not existing_task:
        party = db.query(Party).filter(Party.id == order.party_id).first()
        party_name = party.name if party else "Party"
        task = FollowUpTask(
            workspace_id=order.workspace_id,
            order_id=order.id,
            discrepancy_id=disc.id,
            party_id=order.party_id,
            task_type="discrepancy_followup",
            title=f"Follow up with {party_name} on {delta_value} ({order.order_number})",
            description=f"{explanation} Recommended: {recommended_action}",
            channel="whatsapp",
            due_date=min(order.due_date, get_workspace_today() + timedelta(days=1)),
            status="pending",
            assigned_owner=order.assigned_owner,
            is_demo=order.is_demo,
        )
        db.add(task)

    return disc


def evaluate_order_discrepancies(db: Session, order: Order) -> list[Discrepancy]:
    """Run deterministic quantity, invoice, and delivery confirmation rules on an order."""
    deliveries = (
        db.query(DeliveryRecord)
        .filter(DeliveryRecord.order_id == order.id)
        .order_by(DeliveryRecord.delivery_date.asc())
        .all()
    )

    if deliveries:
        order.delivered_quantity = sum(d.delivered_quantity for d in deliveries)

    party = db.query(Party).filter(Party.id == order.party_id).first()
    party_name = party.name if party else "Customer"
    evidence_refs = _build_order_evidence(db, order, deliveries)
    detected: list[Discrepancy] = []

    # ------------------------------------------------------------------
    # Rule 1: Ordered / Invoiced Quantity vs. Delivered Quantity Shortfall
    # Example: 50 boxes ordered, 50 boxes invoiced, 45 boxes delivered -> 5-box shortfall
    # ------------------------------------------------------------------
    reference_qty = max(order.ordered_quantity, order.invoiced_quantity)
    if order.delivered_quantity > 0 and order.delivered_quantity < reference_qty:
        shortfall = reference_qty - order.delivered_quantity
        order.status = "partially_delivered"
        disc = _upsert_discrepancy(
            db=db,
            order=order,
            discrepancy_type="quantity_shortfall",
            severity="high" if shortfall >= 1 else "medium",
            title=f"Delivery Shortfall: {_fmt_qty(shortfall, order.unit)} pending for {party_name}",
            expected_value=f"{_fmt_qty(order.ordered_quantity, order.unit)} ordered / {_fmt_qty(order.invoiced_quantity, order.unit)} invoiced",
            actual_value=f"{_fmt_qty(order.delivered_quantity, order.unit)} delivered",
            delta_value=f"{_fmt_qty(shortfall, order.unit)} shortfall",
            explanation=(
                f"Order {order.order_number} ({order.item_name}) has {_fmt_qty(order.ordered_quantity, order.unit)} ordered "
                f"and {_fmt_qty(order.invoiced_quantity, order.unit)} invoiced on {order.invoice_number or 'invoice'}, "
                f"but delivery records show only {_fmt_qty(order.delivered_quantity, order.unit)} delivered. "
                f"There is a discrepancy of {_fmt_qty(shortfall, order.unit)}."
            ),
            recommended_action=(
                f"Verify dispatch of remaining {_fmt_qty(shortfall, order.unit)} with warehouse/transporter and send "
                f"an approved follow-up update to {party_name} before {order.due_date.isoformat()}."
            ),
            evidence_refs=evidence_refs,
        )
        detected.append(disc)
    elif order.delivered_quantity >= reference_qty and reference_qty > 0:
        order.status = "delivered"
        # Auto-resolve any open shortfall discrepancy if full quantity is now delivered
        open_shortfall = (
            db.query(Discrepancy)
            .filter(
                Discrepancy.order_id == order.id,
                Discrepancy.discrepancy_type == "quantity_shortfall",
                Discrepancy.status.in_(["open", "investigating", "followup_drafted"]),
            )
            .first()
        )
        if open_shortfall:
            open_shortfall.status = "resolved"

    # ------------------------------------------------------------------
    # Rule 2: Order Quantity vs. Invoice Quantity Mismatch
    # ------------------------------------------------------------------
    if order.invoiced_quantity > 0 and abs(order.invoiced_quantity - order.ordered_quantity) > 1e-6:
        diff = abs(order.ordered_quantity - order.invoiced_quantity)
        disc = _upsert_discrepancy(
            db=db,
            order=order,
            discrepancy_type="invoice_mismatch",
            severity="high",
            title=f"Order vs. Invoice Mismatch: {_fmt_qty(diff, order.unit)} difference on {order.order_number}",
            expected_value=f"{_fmt_qty(order.ordered_quantity, order.unit)} (Order)",
            actual_value=f"{_fmt_qty(order.invoiced_quantity, order.unit)} (Invoice {order.invoice_number or 'N/A'})",
            delta_value=f"{_fmt_qty(diff, order.unit)} difference",
            explanation=(
                f"Order {order.order_number} specifies {_fmt_qty(order.ordered_quantity, order.unit)}, "
                f"whereas Invoice {order.invoice_number or 'N/A'} bills for {_fmt_qty(order.invoiced_quantity, order.unit)}."
            ),
            recommended_action=f"Reconcile invoice {order.invoice_number or ''} with {party_name} and issue a credit/debit note or revised invoice.",
            evidence_refs=evidence_refs,
        )
        detected.append(disc)

    # ------------------------------------------------------------------
    # Rule 3: Missing Delivery Confirmation
    # ------------------------------------------------------------------
    unconfirmed = [
        d for d in deliveries if d.confirmation_status in ("partial", "missing_confirmation")
    ]
    if unconfirmed:
        challans = ", ".join(d.challan_number for d in unconfirmed)
        disc = _upsert_discrepancy(
            db=db,
            order=order,
            discrepancy_type="missing_delivery_proof",
            severity="medium",
            title=f"Missing Signed Delivery Confirmation for {challans}",
            expected_value="Signed & confirmed POD for all dispatches",
            actual_value=f"Unconfirmed challan(s): {challans}",
            delta_value=f"{len(unconfirmed)} challan(s) awaiting confirmation",
            explanation=(
                f"Delivery challan(s) {challans} for Order {order.order_number} ({party_name}) "
                f"are marked as '{unconfirmed[0].confirmation_status}' without final signed confirmation."
            ),
            recommended_action=f"Request signed delivery acknowledgement / POD from {party_name} on WhatsApp.",
            evidence_refs=evidence_refs,
        )
        detected.append(disc)

    db.commit()
    return detected


def scan_workspace_discrepancies(db: Session, workspace_id: int) -> list[Discrepancy]:
    """Scan all orders in the workspace and return all open/active discrepancies."""
    orders = db.query(Order).filter(Order.workspace_id == workspace_id).all()
    for order in orders:
        evaluate_order_discrepancies(db, order)

    return (
        db.query(Discrepancy)
        .filter(Discrepancy.workspace_id == workspace_id)
        .order_by(Discrepancy.created_at.desc())
        .all()
    )
