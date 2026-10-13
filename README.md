# Vyapar Memory AI

**An Evidence-Based AI Business Operations & Commitment Intelligence Assistant for Indian Wholesalers, Distributors, and Small Manufacturers.**

Vyapar Memory AI converts scattered business records—WhatsApp order messages, PDF/image tax invoices, delivery challans, CSV ledgers, and voice notes—into a connected, searchable business memory. Unlike generic chatbots, Vyapar Memory AI tracks real commitments, detects quantity/price discrepancies deterministically, shows verbatim source evidence, and drafts follow-ups in **English**, **Hindi**, and **Hinglish** with a mandatory human approval gate.

---

## Core Scenario Example (Included in Demo Seeder)
- **Customer Order (WhatsApp Message)**: Sharma Traders orders **50 boxes** of *Shreeji Brass Gate Valves (25mm)* due by Friday.
- **Tax Invoice (PDF)**: Invoice `INV-2026-1042` bills for **50 boxes** (`₹1,25,000`).
- **Delivery Challan**: Challan `DC-2026-089` records only **45 boxes** delivered (`5 boxes` pending confirmation).
- **Vyapar Memory AI Action**:
  1. Links the customer, order, invoice, and delivery challan into a single connected order memory.
  2. Deterministically flags a **High-Severity 5-Box Quantity Shortfall Discrepancy** with exact line/page evidence citations.
  3. Calculates deadline urgency in `Asia/Kolkata` (`IST`) and creates a priority follow-up task.
  4. Generates reviewable follow-up drafts in **English**, **Hindi**, and **Hinglish** requiring owner approval before dispatch/export.

---

## Monorepo Architecture

```text
vyapar-memory-ai/
├── frontend/                 # React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons
│   └── src/
│       ├── components/       # Reusable UI primitives, sidebar layout, modals, evidence badges
│       ├── pages/            # Dashboard, Parties, Orders, Documents, Discrepancies, Assistant, Tasks, Audit, Settings
│       ├── services/         # Typed REST API client with JWT auth interceptor
│       └── types/            # End-to-end TypeScript interfaces
├── backend/                  # Python 3.13 + FastAPI + SQLAlchemy 2.0 + Alembic + Pydantic v2
│   ├── app/
│   │   ├── api/              # REST API routes (/api/v1/*) & auth/workspace dependencies
│   │   ├── core/             # Config, security (bcrypt + JWT), and database session management
│   │   ├── models/           # 16 relational & vector database models
│   │   ├── schemas/          # Pydantic request/response & structured extraction schemas
│   │   └── services/
│   │       ├── ai/           # Pluggable LLM/Embedding provider, PDF/OCR/STT parser, Extractor, Hybrid RAG, Drafter
│   │       └── business/     # Deterministic Discrepancy Rules, IST Commitments, Approvals, Demo Seeder
│   ├── alembic/              # Database schema migrations
│   └── tests/                # Automated Pytest suite
├── docs/                     # Architecture, API Reference, and Interview Walkthrough Guides
├── docker-compose.yml        # Reproducible PostgreSQL 16 + pgvector + Backend + Frontend stack
└── .env.example              # Safe environment variable template
```

---

## Quick Start (Local Development)

### 1. Environment Setup
```bash
cp .env.example .env
```
*(Optional)* Add your `GEMINI_API_KEY` or `OPENAI_API_KEY` inside `.env` for live LLM extraction, embeddings, and voice-note transcription.

### 2. Backend Setup (FastAPI + SQLAlchemy + Alembic)
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
- **API Health Check**: `http://localhost:8000/api/v1/health`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`

### 3. Frontend Setup (React + TypeScript + Vite)
```bash
cd frontend
npm install
npm run dev
```
- **Web Application**: `http://localhost:5173`

### 4. Running Automated Tests
```bash
cd backend
pytest -v
```
