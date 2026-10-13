# Vyapar Memory AI — REST API Reference (`/api/v1`)

All endpoints except `/api/v1/health`, `/api/v1/auth/register`, and `/api/v1/auth/login` require an `Authorization: Bearer <JWT_TOKEN>` header. Every query is strictly scoped to the authenticated user's `workspace_id`.

---

## 1. System & Authentication

### `GET /api/v1/health`
Returns service health, database dialect, and active AI/STT provider status (without exposing keys).

### `POST /api/v1/auth/register`
Creates a new user, provisions an isolated `Workspace`, assigns `owner` role, and optionally seeds the synthetic **Sharma Traders 50-vs-45 Box Discrepancy** demo dataset.
- **Body**:
```json
{
  "email": "owner@sharmawholesale.in",
  "password": "SecurePassword123!",
  "full_name": "Naman Garg",
  "workspace_name": "Sharma & Sons Wholesale",
  "city": "Delhi",
  "seed_demo_data": true
}
```

### `POST /api/v1/auth/login`
Authenticates email & password and returns a workspace-scoped JWT token.

### `GET /api/v1/auth/me`
Returns the current authenticated `User` and `Workspace`.

---

## 2. Executive Dashboard, Parties & Orders

### `GET /api/v1/dashboard/summary`
Returns workspace KPIs (`pending_orders_count`, `upcoming_deadlines_count`, `overdue_tasks_count`, `open_discrepancies_count`, `pending_reviews_count`), top open discrepancies with evidence, priority commitments, pending follow-up tasks, and recent audit logs.

### `GET /api/v1/parties` & `POST /api/v1/parties`
List, search, filter (`party_type=customer|supplier`), and create customers or suppliers.

### `GET /api/v1/orders` & `POST /api/v1/orders`
List or create orders. Creating an order automatically initializes a delivery commitment and runs deterministic discrepancy rules.

### `POST /api/v1/orders/{order_id}/deliveries`
Logs a `DeliveryRecord` (challan number, delivered quantity, confirmation status) against an order and automatically re-evaluates quantity shortfall and missing confirmation rules.

### `GET /api/v1/commitments` & `PATCH /api/v1/commitments/{commitment_id}`
Lists commitments ranked by IST deadline urgency and explainable priority score, or updates status (`fulfilled`, `dismissed`).

---

## 3. Document Intelligence & Human Review Gate

### `POST /api/v1/documents/upload`
Multipart upload accepting `.pdf`, `.txt`, `.csv`, `.png`, `.jpg`, `.wav`, `.mp3`, `.m4a`.
1. Validates extension, size limit (15 MB), and binary headers.
2. Computes SHA-256 hash to detect duplicate documents.
3. Extracts page/line text chunks and generates vector embeddings.
4. Runs Pydantic-validated structured extraction (`StructuredDocumentExtraction`) and stores candidate data in `ExtractedRecord(review_status="pending_review")`.

### `POST /api/v1/extractions/{record_id}/review`
Human-in-the-loop verification endpoint.
- **Body**:
```json
{
  "decision": "approved",
  "edited_data": {
    "party_name": "Sharma Traders",
    "order_number": "ORD-2026-101",
    "quantity": 50
  },
  "comment": "Verified against customer WhatsApp message"
}
```
Approving promotes the data into trusted `Party`, `Order`, `DeliveryRecord`, and `Commitment` tables and triggers discrepancy detection.

---

## 4. Discrepancies, Hybrid RAG Assistant & Draft Approvals

### `GET /api/v1/discrepancies` & `POST /api/v1/discrepancies/scan`
Lists detected discrepancies with `expected_value`, `actual_value`, `delta_value` (e.g., `5 boxes shortfall`), and verbatim `evidence_refs`.

### `POST /api/v1/assistant/ask`
Hybrid SQL + Vector RAG endpoint.
- **Body**: `{"question": "What evidence supports the 5-box discrepancy for Sharma Traders?"}`
- **Response**: `answer_markdown`, `verified_facts` (from SQL), `citations` (verbatim quotes with filename and page/line ref), and `uncertainty_notice`.

### `POST /api/v1/tasks/{task_id}/generate-draft`
Generates a follow-up message draft in `english`, `hindi`, or `hinglish` with status `pending_approval`.

### `POST /api/v1/drafts/{draft_id}/approve`
Records an explicit `ApprovalRecord` (`approved` or `rejected`) with optional inline edits before the message can be copied/exported.

### `POST /api/v1/demo/seed` & `POST /api/v1/demo/reset?reseed=true|false`
Seeds or safely resets synthetic `is_demo=True` records without affecting real user records.
