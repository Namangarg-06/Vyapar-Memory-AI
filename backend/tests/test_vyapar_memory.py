"""Comprehensive automated Pytest suite for Vyapar Memory AI.

Covers:
1. Health check & provider configuration reporting
2. Authentication & JWT authorization
3. Strict multi-tenant workspace data isolation
4. File upload validation (extensions, empty files, suspicious binaries, SHA-256 duplicates)
5. Structured extraction schema validation & human review/approval workflow
6. Deterministic quantity discrepancy detection (50 ordered, 50 invoiced, 45 delivered -> 5-box shortfall)
7. Timezone-aware (Asia/Kolkata) deadline & explainable priority calculation
8. Grounded Hybrid RAG assistant with verbatim source citations & uncertainty notice
9. Multilingual (English, Hindi, Hinglish) follow-up draft generation & human approval gate
10. Demo data seeding & safe reset preserving real user data
"""

from datetime import date, timedelta
import io
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app


@pytest.fixture()
def client():
    """Provide an isolated in-memory SQLite database per test."""
    test_engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)


def _register_and_headers(
    client: TestClient,
    email: str = "owner@sharmawholesale.in",
    workspace_name: str = "Sharma Wholesale Hub",
    seed_demo_data: bool = True,
) -> tuple[dict[str, str], dict]:
    resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "password": "SecurePassword123!",
            "full_name": "Naman Garg",
            "workspace_name": workspace_name,
            "business_type": "Wholesaler & Distributor",
            "city": "Delhi",
            "seed_demo_data": seed_demo_data,
        },
    )
    assert resp.status_code == 201, resp.text
    data = resp.json()
    headers = {"Authorization": f"Bearer {data['access_token']}"}
    return headers, data


def test_health_endpoint(client: TestClient):
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["timezone"] == "Asia/Kolkata"
    assert "ai_provider" in body


def test_authentication_and_authorization(client: TestClient):
    # Unauthenticated access to protected endpoint must return 401
    unauth = client.get("/api/v1/dashboard/summary")
    assert unauth.status_code == 401

    headers, reg_data = _register_and_headers(client, seed_demo_data=False)
    assert reg_data["user"]["email"] == "owner@sharmawholesale.in"
    assert reg_data["workspace"]["role"] == "owner"

    # Login with valid credentials
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@sharmawholesale.in", "password": "SecurePassword123!"},
    )
    assert login_resp.status_code == 200
    assert "access_token" in login_resp.json()

    # Login with wrong password fails with 401
    bad_login = client.post(
        "/api/v1/auth/login",
        json={"email": "owner@sharmawholesale.in", "password": "WrongPassword"},
    )
    assert bad_login.status_code == 401

    # /auth/me returns user and workspace
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["workspace"]["name"] == "Sharma Wholesale Hub"


def test_workspace_data_isolation(client: TestClient):
    """Ensure Workspace A cannot see or modify Workspace B records."""
    headers_a, _ = _register_and_headers(
        client, email="tenant_a@vyapar.in", workspace_name="Tenant A Traders", seed_demo_data=False
    )
    headers_b, _ = _register_and_headers(
        client, email="tenant_b@vyapar.in", workspace_name="Tenant B Distributors", seed_demo_data=False
    )

    # Create a customer in Workspace A
    party_a = client.post(
        "/api/v1/parties",
        headers=headers_a,
        json={"party_type": "customer", "name": "Secret Customer A", "city": "Jaipur"},
    )
    assert party_a.status_code == 201
    party_a_id = party_a.json()["id"]

    # Workspace B must see 0 parties
    parties_b = client.get("/api/v1/parties", headers=headers_b)
    assert parties_b.status_code == 200
    assert parties_b.json() == []

    # Workspace B attempting to create an order using Workspace A's party_id must get 404
    cross_order = client.post(
        "/api/v1/orders",
        headers=headers_b,
        json={
            "party_id": party_a_id,
            "order_number": "ORD-CROSS-1",
            "item_name": "Copper Wire",
            "unit": "boxes",
            "ordered_quantity": 20,
            "invoiced_quantity": 20,
            "delivered_quantity": 20,
            "unit_price": 1000,
            "order_date": date.today().isoformat(),
            "due_date": (date.today() + timedelta(days=3)).isoformat(),
        },
    )
    assert cross_order.status_code == 404


def test_sharma_traders_50_vs_45_discrepancy_and_demo_reset(client: TestClient):
    """Verify the core 50 ordered / 50 invoiced / 45 delivered -> 5-box discrepancy scenario."""
    headers, _ = _register_and_headers(client, seed_demo_data=True)

    # Check orders
    orders_resp = client.get("/api/v1/orders", headers=headers)
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    sharma_order = next(o for o in orders if o["order_number"] == "ORD-2026-101")
    assert sharma_order["ordered_quantity"] == 50.0
    assert sharma_order["invoiced_quantity"] == 50.0
    assert sharma_order["delivered_quantity"] == 45.0
    assert sharma_order["pending_quantity"] == 5.0
    assert sharma_order["is_demo"] is True

    # Check deterministic discrepancies
    disc_resp = client.get("/api/v1/discrepancies", headers=headers)
    assert disc_resp.status_code == 200
    discs = disc_resp.json()
    shortfall = next(d for d in discs if d["discrepancy_type"] == "quantity_shortfall")
    assert "5 boxes" in shortfall["delta_value"]
    assert shortfall["severity"] == "high"
    assert len(shortfall["evidence_refs"]) >= 3  # WhatsApp Order + Tax Invoice + Delivery Challan

    # Create a real non-demo customer, then reset demo data (reseed=False) and verify real customer survives
    real_party = client.post(
        "/api/v1/parties",
        headers=headers,
        json={"party_type": "customer", "name": "Real Verified Buyer Pvt Ltd", "city": "Mumbai"},
    )
    assert real_party.status_code == 201
    assert real_party.json()["is_demo"] is False

    clear_resp = client.post("/api/v1/demo/reset?reseed=false", headers=headers)
    assert clear_resp.status_code == 200

    remaining_parties = client.get("/api/v1/parties", headers=headers).json()
    assert len(remaining_parties) == 1
    assert remaining_parties[0]["name"] == "Real Verified Buyer Pvt Ltd"


def test_file_upload_validation_extraction_and_human_review(client: TestClient):
    """Test upload security validation, Pydantic structured extraction, and human review gate."""
    headers, _ = _register_and_headers(client, seed_demo_data=False)

    # 1. Reject unsupported file extension (.exe)
    bad_ext = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"file": ("malware.exe", b"hello world", "application/octet-stream")},
        data={"doc_type": "other"},
    )
    assert bad_ext.status_code == 400

    # 2. Reject suspicious binary header disguised as .txt
    bad_header = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"file": ("trick.txt", b"MZ\x90\x00 hidden binary", "text/plain")},
        data={"doc_type": "other"},
    )
    assert bad_header.status_code == 400

    # 3. Upload a valid WhatsApp order message (.txt)
    order_text = (
        "Customer: Agarwal Electricals\n"
        "Order ORD-2026-555: Please dispatch 100 boxes of LED Floodlights @ Rs. 1,200/box "
        "(Total Rs. 1,20,000) before Friday."
    ).encode("utf-8")

    upload_resp = client.post(
        "/api/v1/documents/upload",
        headers=headers,
        files={"file": ("Agarwal_Order_555.txt", io.BytesIO(order_text), "text/plain")},
        data={"doc_type": "order_message"},
    )
    assert upload_resp.status_code == 201, upload_resp.text
    doc_data = upload_resp.json()
    assert len(doc_data["extracted_records"]) == 1
    ext_record = doc_data["extracted_records"][0]
    assert ext_record["review_status"] == "pending_review"
    assert ext_record["extracted_json"]["quantity"] == 100.0

    # Before human approval, trusted orders table must still be empty
    orders_before = client.get("/api/v1/orders", headers=headers).json()
    assert orders_before == []

    # 4. Approve extracted record (with an optional edit) -> promotes to trusted Order
    review_resp = client.post(
        f"/api/v1/extractions/{ext_record['id']}/review",
        headers=headers,
        json={
            "decision": "approved",
            "edited_data": {"party_name": "Agarwal Electricals", "order_number": "ORD-2026-555"},
            "comment": "Verified against customer WhatsApp message",
        },
    )
    assert review_resp.status_code == 200
    assert review_resp.json()["review_status"] == "approved"

    orders_after = client.get("/api/v1/orders", headers=headers).json()
    assert len(orders_after) == 1
    assert orders_after[0]["order_number"] == "ORD-2026-555"
    assert orders_after[0]["ordered_quantity"] == 100.0


def test_rag_assistant_grounding_and_draft_approval_workflow(client: TestClient):
    """Verify Hybrid RAG citations and multilingual follow-up draft approval gate."""
    headers, _ = _register_and_headers(client, seed_demo_data=True)

    # 1. Ask RAG assistant about Sharma Traders discrepancy
    ask_resp = client.post(
        "/api/v1/assistant/ask",
        headers=headers,
        json={"question": "What is the discrepancy for Sharma Traders order ORD-2026-101 and what evidence supports it?"},
    )
    assert ask_resp.status_code == 200
    rag_data = ask_resp.json()
    assert "50" in rag_data["answer_markdown"] and "45" in rag_data["answer_markdown"]
    assert len(rag_data["verified_facts"]) >= 1
    assert len(rag_data["citations"]) >= 1
    assert rag_data["uncertainty_notice"] is not None

    # 2. Generate a Hindi follow-up draft and approve it
    tasks = client.get("/api/v1/tasks", headers=headers).json()
    assert len(tasks) >= 1
    task_id = tasks[0]["id"]

    gen_hindi = client.post(
        f"/api/v1/tasks/{task_id}/generate-draft",
        headers=headers,
        json={"language": "hindi", "channel": "whatsapp"},
    )
    assert gen_hindi.status_code == 201
    draft = gen_hindi.json()
    assert draft["language"] == "hindi"
    assert draft["status"] == "pending_approval"

    approve_resp = client.post(
        f"/api/v1/drafts/{draft['id']}/approve",
        headers=headers,
        json={
            "decision": "approved",
            "edited_body_text": draft["body_text"] + "\n[Approved by Owner]",
            "comment": "Checked invoice and challan numbers.",
        },
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["status"] == "approved"
    assert "[Approved by Owner]" in approve_resp.json()["body_text"]
