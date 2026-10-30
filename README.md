# EnterpriseIQ – AI-Powered Enterprise Knowledge Management System

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=flat&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Google Gemini](https://img.shields.io/badge/Gemini_API-4285F4?style=flat&logo=google&logoColor=white)](https://ai.google.dev/)

An enterprise-grade, responsive AI knowledge management and decision intelligence system engineered for rapid retrieval, cross-document analysis, role-based access governance, and grounded AI question-answering across multi-format documents (PDF, DOCX, CSV, XLSX) and relational project portfolios.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                   EnterpriseIQ Modern Web Workspace                     │
│               React 18 • TypeScript • Tailwind CSS • Lucide             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST Proxy (Port 5173 / 8001)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      EnterpriseIQ Node.js Backend                      │
│                    Express.js • TypeScript Engine                      │
├─────────────────────┬───────────────────────────┬──────────────────────┤
│  Document Engine    │    Grounding RAG Core     │  Governance / RBAC   │
│  - PDF parser       │    - BM25 & Semantic      │  - Admin Clearance   │
│  - Mammoth (DOCX)   │    - Verified Citations   │  - Employee Tier     │
│  - SheetJS (XLSX)   │    - Guardrail Fallback   │  - Confidentiality   │
│  - CSV Parser       │    - Gemini API Bridge    │    Enforcement       │
└─────────┬───────────┴─────────────┬─────────────┴──────────┬───────────┘
          │                         │                        │
          ▼                         ▼                        ▼
┌──────────────────┐      ┌──────────────────┐     ┌──────────────────┐
│  Upload Storage  │      │ SQLite Database  │     │ Google Gemini    │
│  /server/uploads │      │ enterpriseiq.db  │     │ 1.5 Flash API    │
└──────────────────┘      └──────────────────┘     └──────────────────┘
```

---

## 🚀 Key Modules & Capabilities

### 1. Executive Knowledge Intelligence (Dashboard)
- **Topline KPIs**: Real-time tracked metrics for **Total Indexed Documents**, **Active Projects**, **Completed Projects**, and **Pending Projects**.
- **Department-Wise Budget & Milestone Distribution**: Visual multi-segment progress bars for Engineering, Finance, HR, Legal, and Operations tracking actual spend against allocated capital (`$932K / $1.23M`, etc.).
- **Repository Breakdown**: Live counts categorized by document format (`CSV`, `DOCX`, `PDF`, `XLSX`).
- **Security Clearance Tiers**: Real-time counter of `Confidential` vs `Internal` records.
- **Recent Indexed Documents**: Live table with format badges, clearance indicators, and instant inspection drawer.

### 2. Document Management Repository
- **Multi-Format Ingestion**: Supports real parsing and vector chunking of **PDF**, **DOCX**, **CSV**, and **XLSX**.
- **Metadata Registry**: Tracks Document Title, Filename, Type, Department, Confidentiality Tier, Size, Chunks, Uploader, and Date.
- **Deep Inspection Drawer**:
  - View individual chunk index, page numbers, and token counts.
  - Inspect raw extracted plain text.
  - Delete document and purge vector indices (Admin privilege).
- **Search & Filtering**: Filter instantly by title/summary, department, and file format.

### 3. Project Portfolio & Analytics
- **Relational Portfolio Table**: 16 realistic enterprise initiatives with project code (`PROJ-TITAN`, `PROJ-CUSTPORTAL`, `PROJ-ZEROTRUST`, etc.), name, department, status, progress percentage, budget, actual spend, and project lead.
- **Status Badges & Progress Bars**: Emerald for Completed (100%), Purple for Active/In Progress, Amber for Pending.
- **Add New Project**: Modal form that saves new project records directly to the SQLite database.

### 4. Grounded AI Knowledge Assistant
- **Dual-Pane Chat Interface**: Persistent chat history with session creation, renaming, and deletion.
- **Strict Grounding Guardrails**:
  - Automatically queries the SQLite `projects` database for operational questions (e.g. *"How many projects are completed?"*).
  - Searches semantic document chunks for policy, technical, and financial questions (e.g. *"What is the PTO policy?"* or *"Project Titan specs"*).
  - Automatically declines off-topic questions (e.g. *"What is the secret recipe for Martian chocolate cookies?"*) with a verified enterprise disclaimer:
    > *"I could not find information regarding this in the uploaded company documents and records. Please ensure that the relevant file has been uploaded to the Document Management section, or verify that your account has the appropriate confidentiality clearance."*
- **Verified Source References**: Displays collapsible source citations with green database icons or purple document icons, page numbers, and exact text excerpts.
- **Google Gemini API Integration**: Connects to Google Gemini 1.5 Flash via `GEMINI_API_KEY` with deterministic grounding fallback.

### 5. Smart Cross-Document Search
- **Instant Global Dialog (`Ctrl + K`)**: Accessible from any screen via keyboard shortcut or topbar trigger.
- **Neural & Keyword Relevance Scoring**: Scans document chunks and project titles, highlighting matched excerpts and direct inspection links.

### 6. Role-Based Access Control (RBAC)
- **Clearance Tiers**:
  - **Admin (Executive Clearance)**: Unrestricted access to all company records, financial audits, and confidential strategy memos.
  - **Employee (Operations / Internal Clearance)**: Restricted from viewing confidential financial audits or restricted legal matrices.
- **1-Click Role Switcher**: Topbar dropdown allows judges and demonstrators to switch between Eleanor Vance (Admin) and Alex Rivera (Employee) with a single click to test RBAC enforcement live.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 6, TypeScript 5, Tailwind CSS 3, Lucide React Icons |
| **Backend** | Node.js (v20+ / v24), Express 4, TypeScript 5, tsx |
| **Database** | SQLite via `sql.js` (WebAssembly SQLite engine, zero native compile dependencies) |
| **File Processors** | `pdf-parse` (PDF), `mammoth` (DOCX), `xlsx` (Excel & CSV) |
| **AI Integration** | `@google/generative-ai` & Gemini REST API with local RAG grounding engine |

---

## 📦 Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher, tested on Node v24.20.0)
- npm (v9.0.0 or higher)

### 1. Clone or Open Workspace
```bash
cd enterpriseIQ2
```

### 2. Install Dependencies
```bash
# Install root, backend and frontend dependencies
npm run install:all
```

### 3. Configure Environment Variables (Optional)
Create `server/.env` or edit the existing file:
```env
PORT=8001
# Optional: Enter your Google Gemini API key to enable Gemini text generation
# If left blank, EnterpriseIQ uses the built-in deterministic RAG grounding engine!
GEMINI_API_KEY=
```

---

## 🏃 Running the Application

### Option A: Development Mode (Vite Hot-Reload)
Run the backend and Vite frontend development servers:

**Terminal 1 (Backend API):**
```bash
npm run dev:server
```
*API Server starts at `http://127.0.0.1:8001`*

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
*Open your browser at `http://localhost:5173`*

### Option B: Production Unified Server
Build both client and server, then run the unified production server from a single process:
```bash
npm run build
npm start
```
*Access the unified application at `http://127.0.0.1:8001`*

---

## 🔑 Demo Credentials

EnterpriseIQ includes instant 1-click login buttons on the Access Portal:

| Name | Role | Department | Clearance Level |
| :--- | :--- | :--- | :--- |
| **Eleanor Vance** | `Admin` | `Executive` | Full Access (Confidential & Internal) |
| **Alex Rivera** | `Employee` | `Operations` | Standard Access (Internal Only) |
| **Sarah Jenkins** | `Employee` | `Engineering` | Standard Access (Internal Only) |

---

## 🧪 Verified Hackathon Demonstration Flows

1. **Verify Executive Dashboard**:
   - Inspect the 4 KPI cards (`16 Total Projects`, `6 Active`, `5 Completed`, `5 Pending`).
   - Review Department-Wise Budget bars with live spend vs budget values.
   - Click **Inspect** on any recent document to view chunk vectorization and extracted plain text.

2. **Test Document Upload**:
   - Click **+ Upload Document** in the topbar or Documents tab.
   - Select any PDF, DOCX, CSV, or XLSX file.
   - Choose department and confidentiality tier, then click **Upload & Index**.
   - Notice the document immediately appears in the repository with calculated size and chunk counts.

3. **Test AI Assistant Grounding**:
   - Ask: `"How many projects are completed?"` -> Answers **5 completed projects** and cites the `projects` table.
   - Ask: `"What is the PTO policy and remote work guidelines?"` -> Answers 25 days PTO and cites `Global_Employee_Benefits_and_Workplace_Guidelines.docx`.
   - Ask: `"What is the secret recipe for Martian chocolate cookies?"` -> The system safely declines with the ungrounded query disclaimer.

4. **Test RBAC Governance**:
   - Use the topbar Role Switcher to switch to **Alex Rivera (Employee)**.
   - Ask: `"What is the confidential Q3 executive profit margin and revenue audit?"`
   - Observe that confidential documents are restricted from employee clearance.

5. **Test Smart Cross-Document Search**:
   - Press `Ctrl + K` (or click the search bar).
   - Type `"Titan"` or `"CSAT"` or `"PTO"`.
   - View the scored text passages and direct inspection links.

---

## 📜 License
MIT License. Built for Enterprise Decision Support & Hackathon Demonstration.
