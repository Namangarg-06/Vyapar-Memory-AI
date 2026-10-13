# Vyapar Memory AI — Setup, Demo Walkthrough & Known Limitations

## 1. Step-by-Step Local Setup

### Prerequisites
- **Python 3.11+** (`Python 3.13.7` verified)
- **Node.js 18+ & npm** (for React + TypeScript + Vite frontend)
- *(Optional)* **Docker & Docker Compose** (if running PostgreSQL 16 + `pgvector` in containers; local zero-setup SQLite + vector search works out of the box)

### Step 1: Configure Environment Variables
Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```
If you have a **Google Gemini API Key** (`GEMINI_API_KEY`) or **OpenAI API Key** (`OPENAI_API_KEY`), add it to `.env`. If left blank, the backend transparently uses its `deterministic_rule_assisted` parser and embedding adapter (clearly labeled in the UI and `/api/v1/health`) without faking cloud LLM calls.

### Step 2: Run Database Migrations & Start Backend
```bash
cd backend
pip install -r requirements.txt
python -m alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```
- Backend API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

### Step 3: Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- Frontend UI: `http://localhost:5173`

---

## 2. End-to-End Demo Walkthrough (50 Ordered / 50 Invoiced / 45 Delivered)

1. **Launch Demo Workspace**:
   - Open `http://localhost:5173` and click **"Launch Instant Demo Workspace (50 vs 45 Boxes)"**.
   - Notice the amber **DEMO DATA ACTIVE** banner at the top of the screen, which lets you reset or clear synthetic demo records at any time.
2. **Inspect the 5-Box Discrepancy on Dashboard & Discrepancy Review**:
   - On the **Dashboard Overview**, observe the high-severity alert: **Delivery Shortfall: 5 boxes pending for Sharma Traders (DEMO)**.
   - Click **Discrepancy Review** in the sidebar to see the side-by-side comparison:
     - **Expected**: `50 boxes ordered / 50 boxes invoiced`
     - **Actual**: `45 boxes delivered`
     - **Discrepancy Delta**: `5 boxes shortfall`
   - Inspect the 3 connected verbatim evidence cards (`DEMO_WhatsApp_Sharma_Traders_ORD-2026-101.txt`, `DEMO_Tax_Invoice_INV-2026-1042_50boxes.pdf`, and `DEMO_Delivery_Challan_DC-2026-089_45boxes.pdf`).
3. **Verify Human-in-the-Loop Extraction Review**:
   - Click **Documents & Voice** in the sidebar.
   - Find the pending voice note `DEMO_VoiceNote_Patel_Hardware_ORD-2026-102.wav` (`pending_review`) or paste a new WhatsApp order in the simulator.
   - Click **Review, Edit & Approve**, verify the extracted fields, and click **Approve into Business Memory**.
4. **Query the Grounded AI Business Memory (Hybrid RAG)**:
   - Click **AI Business Memory** in the sidebar and click the suggested query: *"What is the discrepancy for Sharma Traders Order ORD-2026-101 and what evidence supports it?"*
   - Inspect the synthesized answer, the **Exact Structured Database Facts (SQL Ground Truth)** table, the **Source Document Citations**, and the **Missing/Conflicting Evidence** banner.
5. **Generate & Approve Multilingual Follow-Up Drafts**:
   - Click **Tasks & Draft Approvals** in the sidebar.
   - Click **+ HINGLISH**, **+ HINDI**, or **+ ENGLISH** to generate a follow-up draft citing `ORD-2026-101`, `INV-2026-1042`, `45 boxes delivered`, and `5 boxes pending`.
   - Click **Review / Edit / Approve**, edit the text if desired, and click **Approve Draft** to unlock **Copy Approved Message**.

---

## 3. Known Limitations & Future Improvements
1. **External WhatsApp / Email Dispatch**: Outbound WhatsApp Business API (Meta Cloud API / Twilio) is intentionally gated behind copy/export in the local MVP so no accidental messages are sent to real customers without a configured business number.
2. **Scanned Handwritten Hindi Challans**: Printed PDFs work offline via `PyMuPDF`, while camera photos of invoices/challans require `GEMINI_API_KEY` (Vision OCR) in `.env` for automated OCR extraction.
3. **Predictive Delivery Risk**: Currently uses transparent, deterministic rule-based priority scoring (`0–100`) rather than black-box ML failure prediction so business owners can see the exact reason behind every alert.
