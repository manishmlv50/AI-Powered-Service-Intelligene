# AI-Powered Service Intelligence

## Service Advisor AI Intelligence for Modern Workshops

> *“Your car will be ready by evening.”*
>
> That sentence is said thousands of times a day across service centers often without real data behind it.

In busy automobile workshops, advisors juggle customers, OBD diagnostics, parts availability, insurance checks, and technician workloads all while trying to provide fast, transparent service. The result?

* Delays.
* Inconsistent estimates.
* Frustrated customers.
* Revenue leakage.
* Managers flying blind.

**Service Advisor AI Intelligence** is an AI-powered multi-agent system that augments existing workshop systems (not replaces them), transforming raw complaints and OBD codes into structured job cards, intelligent estimates, proactive communication, and live operational visibility.

Built on **Azure OpenAI + FastAPI + React + Azure SQL**, it is designed to be enterprise-ready, hackathon-safe (synthetic data), and demo-friendly.

---

# The Story: From Chaos to Intelligence

### Meet Sarah, a Service Advisor

It’s 9:15 AM. Five customers are already waiting.

A customer says:

> “The car shakes at high speed and there’s a weird noise when braking.”

Sarah:

* Types a long narrative.
* Uploads an OBD report.
* Tries to remember common failure mappings.
* Manually checks parts and labor.
* Calls the customer later to explain charges.

Now multiply this by 20 cars per day.

The system today:

* Treats OBD files as text type file.
* Stores complaints as unstructured text.
* Requires manual estimate mapping.
* Communicates reactively.
* Offers managers only static reports.

---

### With Service Advisor AI Intelligence

Sarah clicks **“New Intake”**.

* Speaks the complaint.
* Uploads the OBD file.
* AI instantly:

  * Extracts fault codes.
  * Maps likely systems.
  * Creates a structured job card.
  * Flags risk level.
  * Suggests tasks.

She clicks **Generate Estimate**.

* Parts + labor are auto-resolved.
* Tax + totals computed.
* A customer-friendly explanation is generated.

Customer receives:

> “We recommend replacing brake pads due to DTC C1234 indicating excessive wear. Estimated completion: 6–8 hours.”

Manager dashboard updates in real time:

* Revenue at risk
* Delayed jobs
* High-complexity repairs

The workshop becomes:

* Faster
* More transparent
* Data-driven
* Predictive instead of reactive

---

# Problem Statement

Modern automobile workshops face systemic inefficiencies:

## 1. Manual, Slow Intake

* Unstructured complaints.
* OBD logs treated as attachments.
* High variability between advisors.

## 2. Inconsistent Estimates

* Fault-to-part mapping is experience-based.
* Revenue leakage from missed operations.
* Misapplied warranty or insurance logic.

## 3. Reactive Customer Communication

* Calls and WhatsApp messages.
* No explainability.
* Low estimate approval rates.

## 4. Poor Use of Historical Data

* No learning loop from past jobs.
* No structured fault trend analysis.

## 5. No Predictive Visibility

* Managers rely on static reports.
* No ETA intelligence.
* No risk classification.

---

# Solution Overview

## Multi-Agent Service Intelligence System

The system uses a **Master Orchestrator Agent** that coordinates specialist agents.

### Core Agents (Implemented)

| Agent                   | Responsibility                                 |
| ----------------------- | ---------------------------------------------- |
| **Intake Agent**        | Converts complaint + OBD → structured job card |
| **Estimation Agent**    | Fault codes → parts + labor + pricing          |
| **Communication Agent** | Customer-friendly explanations & negotiation   |
| **Master Agent**        | Intent routing & multi-step orchestration      |

### Enterprise Architecture Diagram

flowchart LR

    %% Users
    CU[Customer]
    SA[Service Advisor]
    WM[Workshop Manager]

    %% Frontend
    subgraph FE[Service Intelligence Portal - React SPA]
        CP[Customer Portal & Chat]
        AP[Advisor Portal]
        MP[Manager Dashboard]
    end

    CU --> CP
    SA --> AP
    WM --> MP

    %% Backend
    subgraph BE[FastAPI Backend]
        AUTH[Auth & Role API]
        JOB[Job Card API]
        ESTAPI[Estimate API]
        DASH[Dashboard API]
        AGAPI[Master Agent API]
        SPEECH[Speech API]
    end

    CP --> BE
    AP --> BE
    MP --> BE

    %% Agent Layer
    subgraph AG[AI Orchestration Layer]
        MASTER[Master Orchestrator]
        INTAKE[Intake Agent]
        EST[Estimation Agent]
        COMM[Communication Agent]
    end

    AGAPI --> MASTER
    MASTER --> INTAKE
    MASTER --> EST
    MASTER --> COMM

    %% AI Services
    subgraph AI[Azure OpenAI Services]
        LLM[LLM - Responses API]
        STT[Speech-to-Text]
    end

    MASTER --> LLM
    SPEECH --> STT

    %% Data Layer
    subgraph DATA[Data Layer]
        SQL[(Azure SQL Database)]
        JSON[(JSON Synthetic Fallback)]
    end

    JOB <--> SQL
    ESTAPI <--> SQL
    DASH <--> SQL
    BE --> JSON

![Enterprise Architecture](docs\assets\enterprise_architecture_diagram.png)


### Process Flow Diagram

flowchart TD

    A[Customer Complaint or Voice Input]
    B[Speech-to-Text (Optional)]
    C[Intake Agent - Structure Complaint + OBD]
    D[Structured Job Card Created]
    E[Estimation Agent - Map Faults to Parts & Labor]
    F[Itemized Estimate Generated]
    G[Communication Agent - Customer Explanation]
    H[Customer Approval / Rejection]
    I[Job Card Status Updated]
    J[Manager Dashboard Metrics Updated]

    A --> B
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J

![Process flow](docs\assets\process_flow.png)


### Future Scope (Planned Agent)

| Agent                | Responsibility                                      |
| -------------------- | --------------------------------------------------- |
| **ETA & Risk Agent** | Predicts completion time and flags operational risk |

---

# ETA & Risk Agent (Future Scope – Strategic Differentiator)

The current MVP uses heuristic ETA calculations.

The **ETA & Risk Agent (Planned)** will:

### Multi-Factor ETA Prediction

* Historical job durations
* Technician skill mapping
* Bay occupancy
* Parts availability
* Fault complexity score

### Risk Classification

* Safety-critical faults
* Regulatory impact
* Repeat failures
* High-value revenue jobs
* Insurance dependency

### Manager Benefits

* Early delay detection
* Smart workload balancing
* Predictive SLA adherence
* Revenue forecasting

### Business Value Impact

| Metric                 | Expected Improvement |
| ---------------------- | -------------------- |
| Estimate Approval Rate | +15–25%              |
| Intake Time            | -40%                 |
| Revenue Leakage        | -10–18%              |
| Customer Satisfaction  | +20%                 |
| On-time Delivery       | +30%                 |

This transforms the workshop from operational to predictive intelligence.

---

# Architecture Overview

## Layered Enterprise Architecture

Users → React SPA → FastAPI → Agent Orchestration → Azure OpenAI → Azure SQL

### Key Principles

* Clear separation of concerns
* Role-based access
* Structured LLM outputs
* Synthetic data only
* Graceful fallback

---

# Reasoning & Multi-Step Thinking

This is NOT a single prompt chatbot.

Each flow involves:

1. Intent detection (Master Agent)
2. Context assembly (job card + DB data)
3. Tool selection (specialist agent)
4. Structured response validation
5. State persistence
6. UI synchronization

Example flow:
Complaint → Parse → Map fault → Retrieve parts → Calculate totals → Generate explanation → Await approval → Update job status → Update dashboard

This demonstrates:

* Context retention
* Multi-agent orchestration
* Deterministic schema mapping
* Structured reasoning

---

# Business Value & ROI Narrative

### For Service Advisors

* Faster intake
* Fewer errors
* Guided communication
* Higher approval rates

### For Managers

* Live workshop visibility
* Revenue insight
* Risk-based prioritization
* Data-driven staffing

### For Customers

* Transparent explanations
* Real-time updates
* Predictable delivery
* Trust & clarity

### Strategic Value

The AI service:

* Augments existing DMS/ERP
* Reduces dependency on tribal knowledge
* Improves compliance & auditability
* Builds long-term fault intelligence database

This is not automation.
This is augmentation.

---

# Technology Stack

## Frontend

* React 18
* Vite
* React Router
* Axios
* Role-based UI

## Backend

* FastAPI
* Uvicorn
* Pydantic
* Structured API design
* Repository abstraction layer

## AI & Intelligence

* Azure OpenAI (Responses API)
* Structured tool calling
* Audio transcription
* Prompt orchestration
* Schema-bound outputs

## Data Layer

* Azure SQL (Primary)
* JSON synthetic fallback

---

# Reliability & Safety Design

This solution is hackathon-safe and enterprise-aligned.

### Synthetic Data Only

No production data used.

### Structured LLM Outputs

Responses validated against Pydantic schemas.

### Graceful Degradation

Automatic JSON fallback if SQL unavailable.

### Role-Based Access

Advisor / Manager / Customer segregation.

### Limited External Calls

Only Azure OpenAI & Azure SQL.

### Clear Audit Trail

Estimates tied to job cards and users.

---

# Creativity & Originality

* AI embedded directly inside operational portal
* OBD → actionable structured intelligence
* Conversational estimate negotiation
* Predictive ETA agent roadmap
* AI Chat UX for service related conversation 

---

# Deployment

## Local Deployment

Backend:

```bash
cd sourcecode
python -m venv .venv
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend:

```bash
cd sourcecode/frontend
npm install
npm run dev
```

Optional:

```bash
npm run build
```

---


# Future Roadmap

* ETA & Risk Agent
* Parts Procurement Agent
* Technician Assistance Agent
* Advanced analytics (Power BI / Synapse)
* Docker + CI/CD
* Azure App Service / AKS deployment
* Guardrails & explainability layer

---