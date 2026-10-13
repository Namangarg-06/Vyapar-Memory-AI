"""Deterministic commitment lifecycle, timezone-aware deadline calculation, and priority scoring."""

from datetime import date, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from sqlalchemy.orm import Session

from app.models import Commitment, Discrepancy, Order


def get_workspace_today(tz_name: str = "Asia/Kolkata") -> date:
    """Return current date in the workspace's configured timezone (defaults to IST)."""
    try:
        tz = ZoneInfo(tz_name)
    except ZoneInfoNotFoundError:
        tz = ZoneInfo("UTC")
    return datetime.now(tz).date()


def calculate_commitment_priority(
    commitment: Commitment,
    today: date,
    has_open_discrepancy: bool = False,
    order_amount: float = 0.0,
) -> tuple[str, int, str, int]:
    """Deterministically calculate status, priority_score (0-100), and explainable reason.

    Returns:
        (new_status, priority_score, priority_reason, days_remaining)
    """
    days_remaining = (commitment.due_date - today).days

    if commitment.status in ("fulfilled", "dismissed"):
        return (
            commitment.status,
            0,
            f"Commitment marked as {commitment.status}.",
            days_remaining,
        )

    reasons: list[str] = []
    score = 25

    if days_remaining < 0:
        new_status = "overdue"
        overdue_days = abs(days_remaining)
        score = min(65 + overdue_days * 3, 75)
        reasons.append(f"Overdue by {overdue_days} day{'s' if overdue_days != 1 else ''}")
    elif days_remaining == 0:
        new_status = "due_soon"
        score = 60
        reasons.append("Due today (IST)")
    elif days_remaining <= 3:
        new_status = "due_soon"
        score = 45 + (3 - days_remaining) * 5
        reasons.append(f"Due in {days_remaining} day{'s' if days_remaining != 1 else ''}")
    else:
        new_status = "pending"
        score = max(20, 40 - days_remaining * 2)
        reasons.append(f"Scheduled in {days_remaining} days")

    if has_open_discrepancy:
        score += 18
        reasons.append("linked order has an active quantity/invoice discrepancy")

    if order_amount >= 100000:
        score += 7
        reasons.append(f"high order value (Rs. {order_amount:,.0f})")

    final_score = min(100, max(10, score))
    reason_text = f"Score {final_score}/100: " + " + ".join(reasons)
    return new_status, final_score, reason_text, days_remaining


def refresh_workspace_commitments(
    db: Session,
    workspace_id: int,
    tz_name: str = "Asia/Kolkata",
) -> list[Commitment]:
    """Recalculate statuses and explainable priorities for all commitments in a workspace."""
    today = get_workspace_today(tz_name)
    commitments = (
        db.query(Commitment)
        .filter(Commitment.workspace_id == workspace_id)
        .all()
    )

    open_discrepancy_order_ids = {
        row[0]
        for row in db.query(Discrepancy.order_id)
        .filter(
            Discrepancy.workspace_id == workspace_id,
            Discrepancy.status.in_(["open", "investigating", "followup_drafted"]),
        )
        .all()
        if row[0] is not None
    }

    order_amounts = {
        o.id: o.total_amount
        for o in db.query(Order).filter(Order.workspace_id == workspace_id).all()
    }

    for comm in commitments:
        has_disc = comm.order_id in open_discrepancy_order_ids if comm.order_id else False
        amt = order_amounts.get(comm.order_id, 0.0) if comm.order_id else 0.0
        new_status, score, reason, _ = calculate_commitment_priority(
            comm, today, has_open_discrepancy=has_disc, order_amount=amt
        )
        comm.status = new_status
        comm.priority_score = score
        comm.priority_reason = reason

    db.commit()
    return sorted(commitments, key=lambda c: c.priority_score, reverse=True)
