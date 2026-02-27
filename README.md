# AI-Powered Service Intelligence – Service Advisor Co‑Pilot

An AI-powered co‑pilot for automobile service centres that augments existing workshop processes. It helps advisors capture intake faster, generate accurate estimates from OBD and historical data, keep customers updated through chat and speech, and give managers a live picture of workshop health – all on synthetic/demo data, safe for hackathon evaluation.

---

## 1. Business Use Case

Modern automobile workshops struggle to provide fast, transparent and personalized service while juggling multiple systems (DMS/ERP, OEM tools, messaging apps). This project provides a **Service Advisor Co‑Pilot** that sits on top of existing workflows and data, not as a replacement ERP, with three primary user personas:

- **Service Advisor**
  - Capture customer complaint and OBD reports in seconds (voice or text).
  - Get structured job cards and AI-generated estimates, ready for customer approval.
  - Use chat to explain work, negotiate scope, and keep customers updated during repairs.

- **Workshop Manager**
  - See a real-time view of open job cards, delays and high‑risk cases.
  - Track estimate approvals, high‑value jobs and potential revenue leakage.
  - Use insights from OBD and historical data for staffing and bay allocation.

- **Customer**
  - Receive clear, conversational explanations of recommended work.
  - Approve or reject estimates, and ask questions via chat.
  - Get proactive notifications about delays, ETAs and completion.

The co‑pilot behaves like a digital colleague – it understands intake context, fault codes, pricing rules and historical patterns, and collaborates with humans instead of making opaque decisions.

---

## 2. Problem Statement

Workshops typically face the following challenges:

1. **Slow, manual intake**  
   - Advisors type long narratives, manually decode OBD reports and re‑enter customer/vehicle details.  
   - Peak‑time queues form at service desks, hurting satisfaction.

2. **Inconsistent and error‑prone estimates**  
   - Mapping fault codes to parts and labor is manual and varies by advisor.  
   - Estimation misses recommended operations, misprices parts, or misapplies insurance/warranty coverage.

3. **Reactive customer communication**  
   - Updates are via calls/WhatsApp, with no single source of truth.  
   - Customers do not understand why specific jobs are recommended, leading to low approval rates.

4. **Poor use of OBD and historical data**  
   - OBD logs are stored as files, not as structured signals usable for insights.  
   - There is no loop from past jobs to better future recommendations.

5. **Limited real‑time visibility for managers**  
   - Managers rely on static reports or ad‑hoc exports.  
   - It is hard to spot patterns like recurring delays, parts shortages, or high‑risk jobs.

This project addresses these challenges with a multi‑agent AI system layered on a clean data model and a role‑based web experience.

---

## 3. Solution Overview (for Business & Technical Stakeholders)

### 3.1 Business-Level Overview

The **Service Advisor Co‑Pilot** is a multi‑agent AI assistant running on synthetic workshop data. It:

- Listens to **intake complaints** (typed or spoken) and **OBD reports**, turning them into structured job cards.
- Converts faults and complaints into **AI‑generated estimates** with line‑items (parts, labor, taxes).
- Drives a **two‑sided conversation**: advisors and managers use a portal, customers use a chat UI.
- Shows **prototype ETA and risk levels** for jobs in the manager dashboard (currently heuristic; a dedicated ETA/Risk agent is planned).

Under the hood, there is:

- An **Orchestrator (Master) Agent** that understands user intent (intake, estimate, explanation, etc.).
- Three **specialist agents** implemented today:
   - **Intake Agent** – builds job cards from natural language + OBD.
   - **Estimation Agent** – maps fault codes to parts & labor and computes amounts.
   - **Communication Agent** – crafts customer‑facing messages and explanations.
   - *(Planned)* **ETA/Risk Agent** – a future agent to predict completion time and flag high‑risk combinations.

These agents are backed by **Azure OpenAI** and a **synthetic workshop database** (Azure SQL + JSON fixtures), and exposed as a simple **FastAPI backend** with a **React/Vite frontend**.

### 3.2 Key User Journeys

1. **New Intake**  
   - Advisor starts a "New Intake" from the portal.  
   - Provides customer/vehicle identifiers, free‑text complaint, and optionally uploads an OBD file.  
   - Intake Agent parses the complaint + OBD report and creates a structured job card (complaint, suspected systems, tasks, risk flags, OBD codes).

2. **Generate Estimate**  
   - From an open job card, the advisor clicks **Generate Estimate**.  
   - Estimation Agent uses fault codes, parts catalog, and labor operations to produce itemized estimates (parts, labor, taxes, totals).  
   - Estimate is stored against the job card and surfaced to both advisor and customer.

3. **Customer Approval & Chat**  
   - Customer logs into the **Customer Portal** or receives a deep link to the chat view.  
   - Customer sees the estimate summary, can ask "Why do I need new brake pads?" or similar questions.  
   - Communication Agent replies in natural language and guides the user to **approve** or **reject**.  
   - Approval status updates propagate back to the job card and manager dashboards.

4. **During-Service Updates & Completion**  
   - New findings or delays are recorded by the advisor.  
   - The system updates a simple ETA and risk level for jobs (currently heuristic; a dedicated ETA/Risk agent is on the roadmap), and the Communication Agent sends clear updates.  
   - On completion, the job card is marked closed and a concise summary is sent to the customer.

### 3.3 Technical Overview

At a high level, the system consists of:

- **Frontend (React + Vite SPA)** – Advisor, Manager and Customer portals with role‑based routing, dashboards, job card views, and an AI floating action button that triggers agent workflows.
- **Backend (FastAPI)** – REST APIs for auth, job cards, estimates, customers, dashboards, intake, speech, and the master agent endpoint.
- **Agent Orchestration Layer** – A Master Agent that builds structured prompts (action, job card context, question, etc.), and calls Azure OpenAI Responses API to execute multi‑step reasoning via specialist tools/agents.
- **Data Layer** – Azure SQL (primary) plus JSON fixture fallback for customers, vehicles, job cards, parts, labor, fault mappings. Azure Blob Storage for raw OBD report files is part of the target architecture but not yet wired into the current MVP.
- **AI & Speech Services** – Azure OpenAI for text (LLM + Responses) and audio transcription (speech‑to‑text).

---

## 4. Enterprise Architecture (Mermaid)

```mermaid
flowchart LR
    %% Users
    CU[Customer]:::user
    SA[Service Advisor]:::user
    WM[Workshop Manager]:::user

    %% Frontend
    subgraph FE[Service Intelligence Portal (React/Vite SPA)]
        FE_C[Customer Portal & Chat]
        FE_A[Advisor Portal]
        FE_M[Manager Dashboard]
        FE_AI[AI FAB & Chat Panel]
    end

    CU --> FE_C
    SA --> FE_A
    WM --> FE_M
    FE_AI --- FE_A
    FE_AI --- FE_C
    FE_AI --- FE_M

    %% Backend API
    subgraph BE[FastAPI Backend]
        API_AUTH[Auth & Roles API]
        API_JOB[Job Cards API]
        API_EST[Estimates API]
        API_CUST[Customers & Vehicles API]
        API_DASH[Dashboard API]
        API_AG[Master Agent API]
        API_SPEECH[Speech & WebSocket API]
    end

    FE_C --> BE
    FE_A --> BE
    FE_M --> BE

    %% Agent Layer
   subgraph AG[Agent Orchestration]
      MASTER[Orchestrator / Master Agent]
      INTAKE[Intake Agent]
      EST[Estimation Agent]
      COMM[Communication Agent]
   end

   API_AG --> MASTER
   MASTER --> INTAKE
   MASTER --> EST
   MASTER --> COMM

    %% AI Services
    subgraph AI[Azure OpenAI]
        LLM[Responses / Chat Completions]
        STT[Audio Transcription]
    end

    MASTER --> LLM
    API_SPEECH --> STT

    %% Data Layer
   subgraph DATA[Data & Storage]
      SQL[(Azure SQL Database)]
      JSON[(JSON Fixtures\nLocal Fallback)]
      BLOB[(Planned: Azure Blob Storage\nOBD Reports)]
   end

   API_JOB <--> SQL
   API_EST <--> SQL
   API_CUST <--> SQL
   API_DASH <--> SQL
   EST --> SQL

   BE --> JSON

    classDef user fill:#fdf2e9,stroke:#d35400,stroke-width:1.5px;
```

This diagram emphasizes clear layering: user channels → SPA frontend → FastAPI APIs → Agent orchestration using Azure OpenAI → data and storage in Azure SQL/Blob/JSON.

---

## 5. Components & Architecture Details

### 5.1 Backend – FastAPI

- **Entry point**: `sourcecode/app/main.py`  
  - Configures FastAPI, CORS, and registers routers for auth, customers, job cards, estimates, dashboards, intake, agents, and speech.  
  - Serves the React SPA build from `sourcecode/app/static` for all non‑API routes.

- **APIs (under `/api/...`)**:  
  - `auth_routes.py` – login, role handling (advisor/manager/customer).  
  - `customer_routes.py` – customer & vehicle retrieval.  
  - `job_card_routes.py` – list/get/create/update job cards and update status.  
  - `estimate_routes.py` – list/get/create/approve/reject estimates.  
  - `dashboard_routes.py` – workshop summary metrics.  
  - `agent_routes.py` – master agent endpoint (`POST /api/agents/master`).  
  - `speech_routes.py` – REST + WebSocket endpoints for audio transcription.

- **Application services**:  
  - `agent_orchestration_service.py` – builds rich prompts and calls the Master Agent.  
  - `db_service.py` – abstracts database access, with intelligent fallback to JSON fixtures when SQL is unavailable or disabled.  
   - `speech_service.py`, `auth_service.py` – encapsulate business logic for respective domains.

- **Infrastructure**:  
  - `sql_repository.py` – low‑level SQL access via `pyodbc`.  
  - `speech_client.py` – Azure OpenAI audio transcription client.  
  - `settings.py` – Pydantic settings model binding environment variables.

### 5.2 Agent Layer

- **Master Agent**
  - Single entrypoint that accepts a structured `MasterAgentRequest` (action, job card id, customer id, free‑form question, etc.).
  - Chooses which specialist agent to call and how to assemble their outputs into a unified `MasterAgentResponse`.

- **Specialist Agents**
  - **Intake Agent** – given a complaint + OBD content, infers likely systems, risk markers, and recommended tasks, then writes/updates job cards.  
  - **Estimation Agent** – given job context and fault/OBD codes, resolves required parts & labor from SQL/JSON and calculates totals.  
   - **Communication Agent** – turns structured outputs into customer‑friendly explanations and next‑step prompts.  
   - *(Planned)* **ETA/Risk Agent** – a future specialist agent to predict completion time and flag high‑risk combinations (safety, regulatory, customer priority).

- **LLM Integration**
  - All agents use Azure OpenAI via the Responses API, with structured tool calls and constrained outputs mapped to internal schemas.

### 5.3 Frontend – React + Vite SPA

- **Tech stack**: React 18, Vite, React Router, Axios, CSS token‑based design system.
- **Entry**: `sourcecode/frontend/src/main.jsx` and `sourcecode/frontend/src/App.jsx` configure routing and providers.
- **Role-based routes**:  
  - Advisor: dashboard, new intake, job cards list & detail, estimates.  
  - Manager: dashboard, job monitoring, reports.  
  - Customer: chat, job cards, job detail, service history, vehicles.
- **Key features**:  
  - **AI FAB** – floating action button that opens an AI chat panel wired to the Master Agent.  
  - **Auth & roles** – context hook ensures only appropriate pages are visible per role.  
  - **Responsive layout** – sidebar, top bar, and content area tailored to workshop workflows.

### 5.4 Data Model & Storage

- **Primary store – Azure SQL Database**:  
  - Tables for Customers, Vehicles, Job_Cards, Estimates, Estimate_Line_Items, Parts, Labor_Operations, Fault codes, OBD reports, Employees.  
  - SQL scripts live under `docs/backend/data` (`create_mvp_tables_v2.sql`, `insert_mvp_sample_data_v2.sql`).

- **Synthetic fixtures (JSON)**:  
  - Complete synthetic dataset for workshop operations: customers, vehicles, job cards, estimates, parts, labor, fault mappings, OBD reports.  
  - Used in two ways: to seed SQL and as fallback when `USE_JSON_FALLBACK` is enabled or DB is unavailable.

- **Azure Blob Storage**:  
   - Part of the target architecture for storing raw OBD report files.  
   - In the current MVP, OBD report content is handled via text fields in SQL/JSON; blob integration and blob URLs are not yet wired into the runtime.

---

## 6. Judging Criteria Alignment

### 6.1 Accuracy & Relevance (20%)

- Directly addresses the challenge of **AI‑assisted service operations** in automobile workshops.  
- PRD‑driven: flows and data structures match a detailed product requirements document and synthetic data model.  
- Multi‑role support (advisor, manager, customer) with realistic job statuses, estimates and OBD inputs.

### 6.2 Reasoning & Multi-step Thinking (20%)

- **Multi‑agent orchestration**: master agent routes to Intake, Estimation and Communication agents (with a dedicated ETA/Risk agent planned).  
- End‑to‑end flows: complaint + OBD → job card → estimate → customer Q&A & approval → manager dashboard with prototype ETA and risk levels.  
- Structured prompts and schemas enforce stepwise reasoning and consistent outputs, rather than one‑shot free‑text responses.

### 6.3 Creativity & Originality (15%)

- **Co‑pilot UX** via AI FAB and conversational panels integrated inside the operational portal.  
- Intelligent use of **OBD data** and synthetic mappings to parts & labor, turning raw codes into actionable recommendations.  
- Design intentionally **non‑disruptive**: augments existing DMS/ERP rather than attempting to replace them.

### 6.4 User Experience & Presentation (15%)

- Clean, modern SPA with role‑specific dashboards and navigation.  
- Customer‑facing chat flows emphasize explanation, consent and clarity, not just approval clicks.  
- Easy‑to‑demo: single backend and frontend, synthetic data, and quickstart instructions for local runs.

### 6.5 Reliability & Safety (20%)

- **Synthetic data only** – safe for demos and hackathons; no production data.  
- **Graceful degradation** – automatic JSON fallback when SQL is unavailable; avoids hard failures.  
- **Scoped integration** – external calls limited to Azure OpenAI and Azure SQL in the current MVP (Azure Blob is reserved for future OBD file storage); no destructive side effects.  
- Clear separation of concerns (frontend, API, agents, data) and environment‑based configuration of secrets.

---

## 7. Prerequisites

### 7.1 Local Tooling

- **Python**: 3.11+ recommended.  
- **Node.js**: 18+ (for Vite and React).  
- **npm**: comes with Node; used for frontend dependencies.  
- **Git**: for cloning the repository.

### 7.2 Azure Resources

To experience the full capability of the implemented MVP (agents, data, speech), provision:

1. **Azure OpenAI – Text (Responses / Chat)**  
   - One deployment supporting the Responses or Chat Completions API.

2. **Azure OpenAI – Audio (Speech-to-Text)**  
   - One deployment for audio transcription (or a separate compatible service).

3. **Azure SQL Database**  
   - Single database instance; apply schema and sample data from the SQL scripts under `docs/backend/data`.

For the **target architecture** (not yet fully wired), you can additionally provision:

4. **Azure Blob Storage**  
   - Storage account and a container (e.g., `obd-reports`) for OBD files, to be used once blob upload integration is enabled.

### 7.3 Environment Variables

Create a `.env` file under `sourcecode/` (or configure equivalent environment variables) with at least:

**Azure OpenAI (text / LLM)**

- `AZURE_OPENAI_ENDPOINT` – e.g., `https://<your-resource-name>.openai.azure.com/`  
- `AZURE_OPENAI_API_KEY` – API key for the OpenAI resource.  
- `AZURE_OPENAI_API_VERSION` – e.g., `2025-03-01-preview` (matching your deployment).  
- `AZURE_OPENAI_RESPONSES_DEPLOYMENT_NAME` – model deployment name for Responses API.

**Azure SQL**

- `AZURE_SQL_CONNECTION_STRING` – ADO‑style connection string (server, database, user, password). The backend derives the ODBC string from this.

**Azure Blob Storage (for future blob integration)**

- `AZURE_STORAGE_CONNECTION_STRING` – connection string for the storage account.  
- `BLOB_CONTAINER_NAME` – container name for OBD uploads.

**Azure OpenAI (Speech / Transcription)**

- `AZURE_OPENAI_TRANSCRIBE_ENDPOINT` – audio transcription endpoint.  
- `AZURE_OPENAI_TRANSCRIBE_API_KEY` – API key.  
- `AZURE_OPENAI_TRANSCRIBE_DEPLOYMENT_NAME` – deployment/model name for transcription.

**Optional**

- `USE_JSON_FALLBACK=true` – run entirely off local JSON fixtures instead of Azure SQL (useful when DB is not configured).  
- Logging level variables as needed (e.g., `LOG_LEVEL`).

---

## 8. Local Deployment Steps

All commands are run from the repository root unless stated otherwise.

### 8.1 Backend (FastAPI)

1. **Create and activate a virtual environment**

   ```bash
   cd sourcecode
   python -m venv .venv
   # Windows PowerShell
   .venv\Scripts\Activate.ps1
   # or Windows cmd
   .venv\Scripts\activate.bat
   ```

2. **Install backend dependencies**

   ```bash
   pip install -r requirements.txt
   ```

3. **Create `.env`** (if not already done) under `sourcecode/` with the variables from the prerequisites section.

4. **Run the FastAPI app with Uvicorn**

   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```

   The backend will be available at: `http://127.0.0.1:8000` and APIs under `http://127.0.0.1:8000/api/...`.

### 8.2 Frontend (React + Vite)

1. **Install frontend dependencies**

   ```bash
   cd sourcecode/frontend
   npm install
   ```

2. **Run the Vite dev server (for development)**

   ```bash
   npm run dev
   ```

   - Vite typically runs at `http://127.0.0.1:5173`.  
   - A proxy is configured so that calls to `/api` are forwarded to `http://127.0.0.1:8000/api`.

3. **(Optional) Build the SPA for FastAPI to serve**

   ```bash
   npm run build
   ```

   - This outputs a production build into `sourcecode/app/static`.  
   - When built, FastAPI will serve the SPA directly at `http://127.0.0.1:8000/`.

### 8.3 Smoke Test for Judges

Once both backend and frontend are running:

1. Navigate to the **Advisor Portal** and create a new intake using sample data.  
2. Generate an **estimate** from a job card and inspect the line items.  
3. Open the **Customer Portal**, view open jobs, and interact via chat for explanations and approvals.  
4. Explore the **Manager Dashboard** to see high‑level workshop metrics.

(If sample credentials/roles are configured, use those; otherwise the demo can be run in a simplified auth mode depending on configuration.)

---

## 9. Tools & Tech Stack

### 9.1 Frontend

- **Framework**: React 18  
- **Build Tool**: Vite  
- **Routing**: React Router  
- **HTTP Client**: Axios  
- **Styling**: CSS with design tokens and global styles

### 9.2 Backend

- **Framework**: FastAPI  
- **Server**: Uvicorn  
- **Data Validation**: Pydantic models  
- **Database Access**: `pyodbc` + custom repository layer  
- **AI SDKs**: Azure SDK / REST integrations for Azure OpenAI  
- **Multi-Agent Orchestration**: Python agents calling Azure OpenAI Responses API

### 9.3 AI & Data

- **LLM & Responses**: Azure OpenAI (GPT‑class models)  
- **Speech-to-Text**: Azure OpenAI (audio transcription)  
- **Primary Store**: Azure SQL Database  
- **Synthetic Data**: JSON fixtures and SQL seed scripts  
- *(Planned)* **Files**: Azure Blob Storage for raw OBD reports in future iterations

### 9.4 Dev & Ops

- **Language**: Python, JavaScript/TypeScript (optional)  
- **Package Managers**: `pip`, `npm`  
- **Version Control**: Git

---

## 10. Extensibility & Next Steps

This project is designed to be a **starting point** for enterprise‑grade service intelligence.

Potential next steps include:

- **New agents** – e.g., Parts Procurement Agent, Technician Support Agent, or OEM Policy Agent.  
- **Deeper DMS/ERP integration** – connect to real workshop systems via APIs, with strict role‑based access and auditing.  
- **Advanced analytics** – use Azure Synapse/Power BI on top of the SQL data for richer reporting.  
- **Safety enhancements** – add content filters, guardrails for pricing recommendations, and explainability tooling for audits.  
- **Production deployment** – containerize the stack (Docker), add CI/CD and infrastructure‑as‑code (Bicep/Terraform) targeting Azure App Service or AKS.

For hackathon judges, this README should be sufficient to:

- Understand the **business problem and value**.  
- See how **multi‑step reasoning and agents** are implemented.  
- Evaluate **creativity**, **UX**, and **reliability/safety** choices.  
- Run the project locally to experience the demo end‑to‑end.
