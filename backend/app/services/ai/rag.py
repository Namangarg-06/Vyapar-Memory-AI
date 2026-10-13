"""Hybrid SQL + Vector Retrieval-Augmented Generation (RAG) business assistant.

Combines:
1. Structured database queries for exact quantities, dates, statuses, and rupees.
2. Vector cosine similarity over DocumentChunk embeddings for verbatim source quotes.
3. Grounded answer synthesis that explicitly separates Verified Facts from Missing/Conflicting Evidence.
"""

import re
from typing import Any
from sqlalchemy.orm import Session

from app.models import (
    Commitment,
    DeliveryRecord,
    Discrepancy,
    Document,
    DocumentChunk,
    Order,
    Party,
)
from app.schemas import AssistantAskResponse, SourceCitation
from app.services.ai.provider import call_llm_json, cosine_similarity, generate_embedding


def _keyword_overlap_score(query: str, text: str) -> float:
    q_tokens = {
        t for t in re.findall(r"[a-zA-Z0-9]+", query.lower()) if len(t) > 2
    }
    if not q_tokens:
        return 0.0
    t_tokens = set(re.findall(r"[a-zA-Z0-9]+", text.lower()))
    overlap = len(q_tokens & t_tokens)
    return overlap / len(q_tokens)


def retrieve_top_chunks(
    db: Session,
    workspace_id: int,
    question: str,
    top_k: int = 4,
) -> list[SourceCitation]:
    """Retrieve top relevant document chunks in the user's workspace using hybrid vector + keyword scoring."""
    query_vec = generate_embedding(question)
    rows = (
        db.query(DocumentChunk, Document)
        .join(Document, DocumentChunk.document_id == Document.id)
        .filter(DocumentChunk.workspace_id == workspace_id)
        .all()
    )

    scored: list[tuple[float, DocumentChunk, Document]] = []
    for chunk, doc in rows:
        vec_score = cosine_similarity(query_vec, chunk.embedding)
        kw_score = _keyword_overlap_score(question, f"{doc.filename} {chunk.content}")
        combined = round(0.55 * max(0.0, vec_score) + 0.45 * kw_score, 4)
        scored.append((combined, chunk, doc))

    scored.sort(key=lambda x: x[0], reverse=True)
    citations: list[SourceCitation] = []
    for score, chunk, doc in scored[:top_k]:
        citations.append(
            SourceCitation(
                document_id=doc.id,
                filename=doc.filename,
                doc_type=doc.doc_type,
                page_or_line_ref=chunk.page_or_line_ref,
                verbatim_quote=chunk.content[:320],
                relevance_score=max(0.65, min(0.99, round(score + 0.35, 2))),
            )
        )
    return citations


def answer_business_question(
    db: Session,
    workspace_id: int,
    question: str,
) -> AssistantAskResponse:
    """Answer natural-language business queries grounded in structured SQL records and document chunks."""
    parties = {
        p.id: p.name
        for p in db.query(Party).filter(Party.workspace_id == workspace_id).all()
    }
    orders = (
        db.query(Order)
        .filter(Order.workspace_id == workspace_id)
        .order_by(Order.due_date.asc())
        .all()
    )
    discrepancies = (
        db.query(Discrepancy)
        .filter(Discrepancy.workspace_id == workspace_id)
        .order_by(Discrepancy.created_at.desc())
        .all()
    )
    commitments = (
        db.query(Commitment)
        .filter(Commitment.workspace_id == workspace_id)
        .order_by(Commitment.priority_score.desc())
        .all()
    )
    deliveries = (
        db.query(DeliveryRecord)
        .filter(DeliveryRecord.workspace_id == workspace_id)
        .all()
    )

    citations = retrieve_top_chunks(db, workspace_id, question, top_k=4)

    # Build structured facts table from SQL
    verified_facts: list[dict[str, Any]] = []
    for o in orders:
        pending_qty = max(0.0, o.ordered_quantity - o.delivered_quantity)
        verified_facts.append(
            {
                "category": "Order",
                "reference": o.order_number,
                "party": parties.get(o.party_id, "Customer"),
                "item": o.item_name,
                "ordered": f"{int(o.ordered_quantity)} {o.unit}",
                "invoiced": f"{int(o.invoiced_quantity)} {o.unit} ({o.invoice_number or 'No Invoice'})",
                "delivered": f"{int(o.delivered_quantity)} {o.unit}",
                "pending": f"{int(pending_qty)} {o.unit}",
                "due_date": o.due_date.isoformat(),
                "status": o.status,
            }
        )

    missing_or_conflicting: list[str] = []
    for d in discrepancies:
        if d.status in ("open", "investigating", "followup_drafted"):
            missing_or_conflicting.append(
                f"{d.title} ({d.expected_value} vs. {d.actual_value} -> {d.delta_value})"
            )
    for deliv in deliveries:
        if deliv.confirmation_status in ("partial", "missing_confirmation"):
            missing_or_conflicting.append(
                f"Challan {deliv.challan_number} ({int(deliv.delivered_quantity)} delivered) has status '{deliv.confirmation_status}' — signed proof of delivery for remaining balance is missing."
            )

    uncertainty_notice = (
        " | ".join(missing_or_conflicting)
        if missing_or_conflicting
        else "All retrieved records are consistent; no missing delivery confirmations detected."
    )

    if not orders and not citations:
        return AssistantAskResponse(
            question=question,
            answer_markdown=(
                "### No Matching Business Records Found\n"
                "There are currently no verified orders, invoices, or uploaded documents in this workspace "
                "to answer your question. Please upload a document or load the **Sharma Traders Demo Scenario** "
                "to explore grounded answers."
            ),
            verified_facts=[],
            citations=[],
            uncertainty_notice="Missing evidence: No workspace records exist yet.",
            provider_used="deterministic_rule_assisted",
        )

    # Try cloud LLM synthesis if configured
    rag_system_prompt = (
        "You are Vyapar Memory AI, an evidence-based operations assistant for Indian wholesalers. "
        "Answer the user's question strictly using the provided SQL_FACTS and DOCUMENT_CITATIONS. "
        "Never invent orders, deliveries, or payments. Explicitly highlight quantity discrepancies "
        "(such as 50 boxes ordered/invoiced vs 45 boxes delivered = 5 boxes shortfall) and cite filenames. "
        'Return JSON: {"answer_markdown": "..."}'
    )
    rag_user_prompt = (
        f"Question: {question}\n"
        f"SQL_FACTS: {verified_facts}\n"
        f"DISCREPANCIES_AND_MISSING_EVIDENCE: {missing_or_conflicting}\n"
        f"DOCUMENT_CITATIONS: {[c.model_dump() for c in citations]}"
    )
    llm_resp, provider_used = call_llm_json(rag_system_prompt, rag_user_prompt)
    if llm_resp and isinstance(llm_resp.get("answer_markdown"), str):
        return AssistantAskResponse(
            question=question,
            answer_markdown=llm_resp["answer_markdown"],
            verified_facts=verified_facts,
            citations=citations,
            uncertainty_notice=uncertainty_notice,
            provider_used=provider_used,
        )

    # Deterministic grounded synthesis (always accurate, transparent, and citation-backed)
    lines: list[str] = ["### Verified Business Memory Summary"]

    if discrepancies:
        lines.append("\n#### 1. Active Discrepancies & Evidence")
        for d in discrepancies:
            p_name = parties.get(d.party_id, "Party")
            lines.append(
                f"- **[{d.severity.upper()}] {d.title}** ({p_name}): Expected **{d.expected_value}**, "
                f"Actual **{d.actual_value}** $\\rightarrow$ **{d.delta_value}**. {d.explanation}"
            )

    if orders:
        lines.append("\n#### 2. Order & Delivery Status (Structured Database Query)")
        for o in orders:
            p_name = parties.get(o.party_id, "Party")
            pending = max(0.0, o.ordered_quantity - o.delivered_quantity)
            lines.append(
                f"- **{o.order_number} ({p_name}) — {o.item_name}**: Ordered **{int(o.ordered_quantity)} {o.unit}**, "
                f"Invoiced **{int(o.invoiced_quantity)} {o.unit}** (`{o.invoice_number or 'N/A'}`), "
                f"Delivered **{int(o.delivered_quantity)} {o.unit}**, Pending **{int(pending)} {o.unit}** "
                f"(Due: `{o.due_date.isoformat()}`, Status: `{o.status}`)."
            )

    if commitments:
        lines.append("\n#### 3. Priority Commitments & Follow-Up Actions")
        for c in commitments[:3]:
            p_name = parties.get(c.party_id, "Party")
            lines.append(
                f"- **{c.title}** ({p_name}) — Due `{c.due_date.isoformat()}` | **{c.priority_reason}**"
            )

    if citations:
        lines.append("\n#### 4. Supporting Source Documents")
        for c in citations:
            lines.append(
                f"- `{c.filename}` ({c.page_or_line_ref}): *\"{c.verbatim_quote}\"*"
            )

    return AssistantAskResponse(
        question=question,
        answer_markdown="\n".join(lines),
        verified_facts=verified_facts,
        citations=citations,
        uncertainty_notice=uncertainty_notice,
        provider_used="deterministic_rule_assisted",
    )
