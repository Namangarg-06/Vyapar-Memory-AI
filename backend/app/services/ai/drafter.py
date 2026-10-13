"""Multilingual follow-up message draft generator (English, Hindi, and Hinglish)."""

from typing import Any
from sqlalchemy.orm import Session

from app.models import AIDraft, Discrepancy, FollowUpTask, Order, Party
from app.services.ai.provider import call_llm_json


def generate_followup_draft(
    db: Session,
    task: FollowUpTask,
    language: str = "hinglish",
) -> AIDraft:
    """Generate a grounded, reviewable follow-up draft in English, Hindi, or Hinglish.

    Never sends any external message automatically; creates an AIDraft with status='pending_approval'.
    """
    party = db.query(Party).filter(Party.id == task.party_id).first()
    party_name = party.name if party else "Valued Partner"
    contact = party.contact_person if (party and party.contact_person) else f"{party_name} Ji"

    order = db.query(Order).filter(Order.id == task.order_id).first() if task.order_id else None
    disc = (
        db.query(Discrepancy).filter(Discrepancy.id == task.discrepancy_id).first()
        if task.discrepancy_id
        else None
    )

    ord_no = order.order_number if order else "ORD-2026-101"
    inv_no = (order.invoice_number if order and order.invoice_number else "INV-2026-1042")
    item_name = order.item_name if order else "Wholesale Goods"
    unit = order.unit if order else "boxes"
    ordered_qty = int(order.ordered_quantity) if order else 50
    invoiced_qty = int(order.invoiced_quantity) if order else 50
    delivered_qty = int(order.delivered_quantity) if order else 45
    shortfall_qty = max(0, ordered_qty - delivered_qty)
    due_str = order.due_date.isoformat() if order else task.due_date.isoformat()

    evidence: list[dict[str, Any]] = disc.evidence_refs if (disc and disc.evidence_refs) else [
        {
            "filename": f"Order {ord_no} & Invoice {inv_no}",
            "location": "Verified Order Memory",
            "quote": f"Ordered: {ordered_qty} {unit} | Invoiced: {invoiced_qty} {unit} | Delivered: {delivered_qty} {unit} | Pending: {shortfall_qty} {unit}",
        }
    ]

    # Try cloud LLM if configured
    system_prompt = (
        "You are an Indian wholesale business communication assistant. "
        "Draft a polite, evidence-backed follow-up message in the requested language "
        "(english, hindi, or hinglish). Cite exact order, invoice, and quantity numbers. "
        'Return JSON: {"subject": "...", "body_text": "..."}'
    )
    user_prompt = (
        f"Language: {language}\nParty: {party_name} ({contact})\n"
        f"Order: {ord_no}, Invoice: {inv_no}, Item: {item_name}\n"
        f"Ordered: {ordered_qty} {unit}, Invoiced: {invoiced_qty} {unit}, Delivered: {delivered_qty} {unit}, "
        f"Pending Shortfall: {shortfall_qty} {unit}, Due Date: {due_str}\n"
        f"Task: {task.title} - {task.description}"
    )
    llm_json, provider_used = call_llm_json(system_prompt, user_prompt)

    if llm_json and llm_json.get("body_text"):
        subject = llm_json.get("subject") or f"Follow-up: {ord_no} ({party_name})"
        body_text = llm_json["body_text"]
    else:
        provider_used = "deterministic_rule_assisted"
        if language == "english":
            subject = f"Delivery & Confirmation Follow-Up: Order {ord_no} / Invoice {inv_no}"
            body_text = (
                f"Dear {contact} ({party_name}),\n\n"
                f"Greetings! As per your Order {ord_no} and Tax Invoice {inv_no} for {item_name}, "
                f"the total committed quantity is {ordered_qty} {unit}. "
                f"Our delivery challan record shows {delivered_qty} {unit} delivered so far, leaving a balance of {shortfall_qty} {unit} pending confirmation.\n\n"
                f"Kindly confirm receipt of the {delivered_qty} {unit} and let us know the preferred slot before {due_str} to complete the remaining {shortfall_qty} {unit} delivery.\n\n"
                f"Warm regards,\nOperations Team (Requires Owner Approval Before Sending)"
            )
        elif language == "hindi":
            subject = f"ऑर्डर {ord_no} और चालान मिलान के संबंध में सूचना ({party_name})"
            body_text = (
                f"नमस्ते {contact} ({party_name}),\n\n"
                f"आपके ऑर्डर संख्या {ord_no} और टैक्स इनवॉइस {inv_no} ({item_name}) के अनुसार कुल मात्रा {ordered_qty} {unit} तय हुई थी। "
                f"हमारे डिलीवरी रिकॉर्ड के अनुसार अब तक {delivered_qty} {unit} की डिलीवरी दर्ज है और शेष {shortfall_qty} {unit} की पुष्टि बाकी है।\n\n"
                f"कृपया {delivered_qty} {unit} की प्राप्ति की पुष्टि करें और {due_str} तक शेष {shortfall_qty} {unit} भिजवाने के लिए समय बताएं।\n\n"
                f"धन्यवाद,\nव्यापार संचालन टीम"
            )
        else:  # hinglish
            subject = f"Update on Order {ord_no} ({shortfall_qty} {unit} balance confirmation) — {party_name}"
            body_text = (
                f"Namaste {contact} ({party_name}),\n\n"
                f"Aapke Order {ord_no} aur Invoice {inv_no} ({item_name}) ke hisaab se total {ordered_qty} {unit} final hue the. "
                f"Delivery challan record mein abhi {delivered_qty} {unit} delivered dikh rahe hain aur baaki {shortfall_qty} {unit} ka dispatch/confirmation pending hai.\n\n"
                f"Kripya {delivered_qty} {unit} ki receiving confirm kar dein, aur {due_str} se pehle baaki {shortfall_qty} {unit} bhejne ka time confirm kar dijiye.\n\n"
                f"Regards,\nOperations Team"
            )

    draft = AIDraft(
        workspace_id=task.workspace_id,
        task_id=task.id,
        party_id=task.party_id,
        language=language,
        subject=subject,
        body_text=body_text,
        supporting_evidence=evidence,
        status="pending_approval",
        generated_by_provider=provider_used,
        is_demo=task.is_demo,
    )
    db.add(draft)
    task.status = "awaiting_approval"
    db.commit()
    db.refresh(draft)
    return draft
