"""Synthetic Demo Data Seeder & Safe Resetter for Vyapar Memory AI.

Implements the exact end-to-end Indian wholesale business scenario:
- Customer: Sharma Traders (Chawri Bazar, Delhi)
- Order ORD-2026-101: 50 boxes of Shreeji Brass Gate Valves (25mm) ordered via WhatsApp export
- Tax Invoice INV-2026-1042: 50 boxes invoiced (Rs. 1,25,000)
- Delivery Challan DC-2026-089: Only 45 boxes delivered (5 boxes pending confirmation)
- Deterministic 5-box discrepancy + missing delivery proof + follow-up task + reviewable AI drafts
All records are explicitly flagged with `is_demo=True`.
"""

from datetime import datetime, timedelta, timezone
import hashlib
from typing import Any
from sqlalchemy.orm import Session

from app.models import (
    AIDraft,
    ApprovalRecord,
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
)
from app.services.ai.drafter import generate_followup_draft
from app.services.ai.provider import generate_embedding
from app.services.business.approvals import log_audit_event
from app.services.business.commitments import get_workspace_today, refresh_workspace_commitments
from app.services.business.rules import evaluate_order_discrepancies


def clear_demo_data(db: Session, workspace_id: int) -> int:
    """Safely delete ONLY records flagged with is_demo=True in the given workspace."""
    deleted_count = 0
    demo_models = [
        ApprovalRecord,
        AIDraft,
        FollowUpTask,
        Discrepancy,
        Commitment,
        DeliveryRecord,
        Order,
        ExtractedRecord,
        DocumentChunk,
        DocumentProcessingJob,
        Document,
        Party,
        AuditEvent,
    ]
    for model in demo_models:
        count = (
            db.query(model)
            .filter(model.workspace_id == workspace_id, model.is_demo.is_(True))
            .delete(synchronize_session=False)
        )
        deleted_count += count
    db.commit()
    return deleted_count


def _create_demo_document(
    db: Session,
    workspace_id: int,
    user_id: int | None,
    party_id: int | None,
    doc_type: str,
    filename: str,
    raw_text: str,
    page_ref: str = "Page 1",
) -> Document:
    digest = hashlib.sha256(raw_text.encode("utf-8")).hexdigest()
    doc = Document(
        workspace_id=workspace_id,
        party_id=party_id,
        doc_type=doc_type,
        filename=filename,
        file_path=f"demo://{filename}",
        mime_type="application/pdf" if filename.endswith(".pdf") else "text/plain",
        file_size_bytes=len(raw_text.encode("utf-8")),
        sha256_hash=digest,
        raw_text=raw_text,
        uploaded_by=user_id,
        is_demo=True,
    )
    db.add(doc)
    db.flush()

    job = DocumentProcessingJob(
        workspace_id=workspace_id,
        document_id=doc.id,
        status="completed",
        provider_used="demo_synthetic_fixture",
        completed_at=datetime.now(timezone.utc),
        is_demo=True,
    )
    db.add(job)

    chunk = DocumentChunk(
        workspace_id=workspace_id,
        document_id=doc.id,
        chunk_index=0,
        content=raw_text,
        page_or_line_ref=page_ref,
        embedding=generate_embedding(raw_text),
        is_demo=True,
    )
    db.add(chunk)
    return doc


def seed_demo_workspace_data(
    db: Session,
    workspace_id: int,
    actor: User | None = None,
) -> dict[str, Any]:
    """Seed realistic synthetic demo records (labeled is_demo=True) for a wholesale business."""
    clear_demo_data(db, workspace_id)
    today = get_workspace_today()
    actor_id = actor.id if actor else None

    # 1. Demo Parties (2 Customers, 1 Supplier)
    sharma = Party(
        workspace_id=workspace_id,
        party_type="customer",
        name="Sharma Traders (DEMO)",
        contact_person="Rajesh Sharma",
        phone="+91-98110-45201",
        email="sharma.traders.demo@example.com",
        gstin="07AABCS1429B1Z1",
        city="Chawri Bazar, Delhi",
        notes="[DEMO RECORD] Regular wholesale buyer of industrial brass valves and fittings.",
        is_demo=True,
    )
    patel = Party(
        workspace_id=workspace_id,
        party_type="customer",
        name="Patel Hardware & Sanitary (DEMO)",
        contact_person="Kiran Patel",
        phone="+91-98250-77812",
        email="patel.hardware.demo@example.com",
        gstin="24AAACP3871C1Z9",
        city="Ahmedabad, Gujarat",
        notes="[DEMO RECORD] Buys CPVC pipes and elbow fittings on 15-day credit terms.",
        is_demo=True,
    )
    gupta = Party(
        workspace_id=workspace_id,
        party_type="supplier",
        name="Gupta Corrugated Packaging (DEMO)",
        contact_person="Vikas Gupta",
        phone="+91-98992-11340",
        email="gupta.packaging.demo@example.com",
        gstin="09AAACG8821D1Z5",
        city="Noida, UP",
        notes="[DEMO RECORD] Supplier of 5-ply master carton boxes.",
        is_demo=True,
    )
    db.add_all([sharma, patel, gupta])
    db.flush()

    # 2. Demo Source Documents for the Sharma Traders 50-vs-45 Box Scenario
    whatsapp_text = (
        "[DEMO DATA — WhatsApp Chat Export | 10:14 AM]\n"
        "From: Rajesh Sharma (Sharma Traders)\n"
        "Message: Bhai sahab, Order ORD-2026-101 confirm kar lo. Sharma Traders ko is Friday tak "
        "Shreeji Brass Gate Valves (25mm) ke पूरे 50 boxes bhejne hain @ Rs. 2,500/box. "
        "Site dispatch urgent hai, bilkul delay mat karna."
    )
    doc_whatsapp = _create_demo_document(
        db=db,
        workspace_id=workspace_id,
        user_id=actor_id,
        party_id=sharma.id,
        doc_type="order_message",
        filename="DEMO_WhatsApp_Sharma_Traders_ORD-2026-101.txt",
        raw_text=whatsapp_text,
        page_ref="Lines 1-4 (WhatsApp Export)",
    )

    invoice_text = (
        "[DEMO DATA — Tax Invoice PDF | Page 1]\n"
        "Invoice No: INV-2026-1042 | Linked Order: ORD-2026-101\n"
        "Billed To: Sharma Traders (GSTIN: 07AABCS1429B1Z1), Chawri Bazar, Delhi\n"
        "Item Description: Shreeji Brass Gate Valves (25mm Standard Box)\n"
        "Invoiced Quantity: 50 boxes | Unit Rate: Rs. 2,500.00 | Total Amount: Rs. 1,25,000.00\n"
        "Payment Terms: 7 Days from full delivery confirmation."
    )
    doc_invoice = _create_demo_document(
        db=db,
        workspace_id=workspace_id,
        user_id=actor_id,
        party_id=sharma.id,
        doc_type="invoice",
        filename="DEMO_Tax_Invoice_INV-2026-1042_50boxes.pdf",
        raw_text=invoice_text,
        page_ref="Page 1 (Invoice Table)",
    )

    challan_text = (
        "[DEMO DATA — Delivery Challan | Page 1]\n"
        "Delivery Challan No: DC-2026-089 | Against Order: ORD-2026-101 & Invoice: INV-2026-1042\n"
        "Consignee: Sharma Traders, Chawri Bazar, Delhi\n"
        "Dispatched & Delivered Quantity: 45 boxes of Shreeji Brass Gate Valves (25mm)\n"
        "Remarks: 45 boxes received at godown gate by Mukesh. Remaining 5 boxes NOT received yet — "
        "delivery confirmation for balance 5 boxes is pending."
    )
    doc_challan = _create_demo_document(
        db=db,
        workspace_id=workspace_id,
        user_id=actor_id,
        party_id=sharma.id,
        doc_type="delivery_challan",
        filename="DEMO_Delivery_Challan_DC-2026-089_45boxes.pdf",
        raw_text=challan_text,
        page_ref="Page 1 (Challan Remarks)",
    )

    voice_note_text = (
        "[DEMO DATA — Voice Note Transcript | Hinglish Audio]\n"
        "Customer: Patel Hardware & Sanitary (Kiran Patel)\n"
        "Order ORD-2026-102: Bhai CPVC Brass Elbow 20mm ke 30 boxes chahiye @ Rs. 1,800/box "
        "(Total Rs. 54,000). Kal shaam tak transport mein lagwa dena aur LR copy WhatsApp kar dena."
    )
    doc_voice = _create_demo_document(
        db=db,
        workspace_id=workspace_id,
        user_id=actor_id,
        party_id=patel.id,
        doc_type="voice_note",
        filename="DEMO_VoiceNote_Patel_Hardware_ORD-2026-102.wav",
        raw_text=voice_note_text,
        page_ref="Audio 00:00 - 00:28",
    )

    # 3. Create Extracted Records (3 approved for Sharma Traders, 1 pending_review for Patel Hardware)
    ext_order = ExtractedRecord(
        workspace_id=workspace_id,
        document_id=doc_whatsapp.id,
        record_type="order",
        extracted_json={
            "record_type": "order",
            "party_name": "Sharma Traders (DEMO)",
            "order_number": "ORD-2026-101",
            "item_name": "Shreeji Brass Gate Valves (25mm)",
            "quantity": 50,
            "unit": "boxes",
            "unit_price": 2500.0,
            "total_amount": 125000.0,
            "due_date": (today + timedelta(days=1)).isoformat(),
        },
        confidence_score=0.96,
        source_snippet="Sharma Traders ko is Friday tak Shreeji Brass Gate Valves (25mm) ke पूरे 50 boxes bhejne hain @ Rs. 2,500/box.",
        source_page_or_line="Lines 2-4",
        review_status="approved",
        reviewed_by=actor_id,
        reviewed_at=datetime.now(timezone.utc),
        is_demo=True,
    )
    ext_pending = ExtractedRecord(
        workspace_id=workspace_id,
        document_id=doc_voice.id,
        record_type="order",
        extracted_json={
            "record_type": "order",
            "party_name": "Patel Hardware & Sanitary (DEMO)",
            "party_type": "customer",
            "order_number": "ORD-2026-102",
            "item_name": "CPVC Brass Elbow 20mm",
            "quantity": 30,
            "unit": "boxes",
            "unit_price": 1800.0,
            "total_amount": 54000.0,
            "document_date": today.isoformat(),
            "due_date": (today + timedelta(days=2)).isoformat(),
            "commitments": [
                {
                    "title": "Dispatch 30 boxes CPVC Brass Elbow & share transport LR copy",
                    "commitment_type": "dispatch",
                    "due_date": (today + timedelta(days=2)).isoformat(),
                    "verbatim_quote": "Kal shaam tak transport mein lagwa dena aur LR copy WhatsApp kar dena.",
                }
            ],
        },
        confidence_score=0.91,
        source_snippet="CPVC Brass Elbow 20mm ke 30 boxes chahiye @ Rs. 1,800/box... Kal shaam tak transport mein lagwa dena.",
        source_page_or_line="Audio 00:05 - 00:24",
        review_status="pending_review",
        is_demo=True,
    )
    db.add_all([ext_order, ext_pending])

    # 4. Create the Connected Order (50 ordered, 50 invoiced, 45 delivered)
    sharma_order = Order(
        workspace_id=workspace_id,
        party_id=sharma.id,
        order_number="ORD-2026-101",
        status="partially_delivered",
        item_name="Shreeji Brass Gate Valves (25mm)",
        unit="boxes",
        ordered_quantity=50.0,
        invoiced_quantity=50.0,
        delivered_quantity=45.0,
        unit_price=2500.0,
        total_amount=125000.0,
        invoice_number="INV-2026-1042",
        order_date=today - timedelta(days=2),
        due_date=today + timedelta(days=1),
        source_document_id=doc_whatsapp.id,
        invoice_document_id=doc_invoice.id,
        assigned_owner="Dispatch & Accounts Team",
        notes="[DEMO] 50 boxes ordered via WhatsApp & billed on INV-2026-1042, but DC-2026-089 shows 45 boxes delivered.",
        is_demo=True,
    )
    db.add(sharma_order)
    db.flush()

    doc_whatsapp.order_id = sharma_order.id
    doc_invoice.order_id = sharma_order.id
    doc_challan.order_id = sharma_order.id

    # 5. Create the Delivery Record for 45 boxes (with missing confirmation for remaining 5 boxes)
    deliv_45 = DeliveryRecord(
        workspace_id=workspace_id,
        order_id=sharma_order.id,
        challan_number="DC-2026-089",
        delivered_quantity=45.0,
        delivery_date=today,
        received_by="Mukesh (Godown Supervisor)",
        confirmation_status="partial",
        source_document_id=doc_challan.id,
        notes="45 boxes delivered under DC-2026-089; delivery confirmation for remaining 5 boxes is missing.",
        is_demo=True,
    )
    db.add(deliv_45)

    # 6. Create Commitments (including 1 upcoming and 1 overdue for realistic dashboard alerts)
    comm_sharma = Commitment(
        workspace_id=workspace_id,
        order_id=sharma_order.id,
        party_id=sharma.id,
        source_document_id=doc_whatsapp.id,
        commitment_type="delivery",
        title="Complete full 50-box delivery to Sharma Traders (5 boxes balance pending)",
        description="WhatsApp commitment to deliver 50 boxes of Shreeji Brass Gate Valves (25mm) by Friday; 45 boxes delivered on DC-2026-089, 5 boxes pending.",
        promised_by="us",
        due_date=today + timedelta(days=1),
        assigned_owner="Dispatch & Accounts Team",
        source_quote="Sharma Traders ko is Friday tak Shreeji Brass Gate Valves (25mm) ke पूरे 50 boxes bhejne hain.",
        is_demo=True,
    )
    comm_overdue = Commitment(
        workspace_id=workspace_id,
        order_id=None,
        party_id=gupta.id,
        source_document_id=None,
        commitment_type="payment",
        title="Reconcile supplier credit note with Gupta Corrugated Packaging",
        description="Pending GST credit note verification for last month's damaged 5-ply master cartons.",
        promised_by="supplier",
        due_date=today - timedelta(days=2),
        assigned_owner="Accounts Team",
        source_quote="Supplier promised credit note adjustment before 10th of the month.",
        is_demo=True,
    )
    db.add_all([comm_sharma, comm_overdue])
    db.commit()

    # 7. Run Deterministic Discrepancy Rules & Priority Engine
    discrepancies = evaluate_order_discrepancies(db, sharma_order)
    refresh_workspace_commitments(db, workspace_id)

    # 8. Generate reviewable Hinglish & English follow-up drafts for the created follow-up task
    followup_task = (
        db.query(FollowUpTask)
        .filter(
            FollowUpTask.workspace_id == workspace_id,
            FollowUpTask.order_id == sharma_order.id,
        )
        .first()
    )
    if followup_task:
        generate_followup_draft(db, followup_task, language="hinglish")
        generate_followup_draft(db, followup_task, language="english")

    log_audit_event(
        db=db,
        workspace_id=workspace_id,
        action="demo.seeded",
        entity_type="workspace",
        entity_id=workspace_id,
        summary="Seeded synthetic Demo Data (Sharma Traders: 50 ordered, 50 invoiced, 45 delivered -> 5-box discrepancy)",
        actor=actor,
        details={
            "order_number": "ORD-2026-101",
            "invoice_number": "INV-2026-1042",
            "challan_number": "DC-2026-089",
            "discrepancies_detected": len(discrepancies),
        },
        is_demo=True,
    )

    return {
        "status": "seeded",
        "is_demo": True,
        "scenario": "Sharma Traders — 50 boxes ordered, 50 invoiced, 45 delivered (5-box discrepancy)",
        "order_id": sharma_order.id,
        "discrepancies_created": len(discrepancies),
    }
