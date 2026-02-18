# Tech Stack – AI-Powered Service Intelligence (Hackathon / MVP)

This document defines the technologies and boundaries for the **Agents League** Reasoning Agents track. Scope is **hackathon and MVP only**; use **synthetic or simulated data** wherever real systems are out of scope.

---

## 1. Stack Overview

| Layer | Technology | Notes |
|-------|------------|--------|
| **Agent orchestration & LLM** | Microsoft Foundry (Azure AI Foundry Agent Service) | Single project; one model (e.g. GPT-4o); Connected Agents for Orchestrator + 4 specialists. |
| **RAG / search** | Azure AI Search | One index for service/OBD/parts knowledge; agents attach via Foundry tools. |
| **Primary data store** | Azure SQL Database **or** Azure Cosmos DB for NoSQL | Job cards, estimates, customers; agents access via API/tools only. |
| **Config & mock data** | JSON/YAML files + DB tables or Cosmos containers | Insurance rules, parts/labor data; no real external APIs. |
| **Application backend** | Python (FastAPI) **or** Node.js (Express) | API Layer + Workflow Controller; calls Foundry agents. |
| **Frontend – portal** | React (Vite) or Next.js | Minimal Service Advisor UI; no SSO required for MVP. |
| **Frontend – chatbot** | Same app (embedded chat) or simple Bot Framework / Web Chat | Customer approvals and Q&A; in-app or simple channel only. |
| **Speech / vision (optional)** | Azure AI Speech, Document Intelligence **or** stubs | Intake: speech-to-text and OBD doc extraction; can be mocked for MVP. |

---

## 2. Boundaries (Hackathon / MVP)

- **No full ERP** – Only the flows in the [PRD](PRD.md): intake, estimation, approval, during-service updates, completion.
- **No real external integrations** – No live insurance APIs, OBD hardware, or telephony. Use config files and synthetic data only.
- **One LLM, one RAG index** – Shared across all agents to simplify deployment and cost.
- **Minimal auth** – No enterprise SSO required; simple API key or local auth is acceptable for demo.
- **Synthetic data only** – All operational and reference data is generated or mocked; see [Synthetic Data and Data Model](SYNTHETIC_DATA_AND_DATA_MODEL.md).

---

## 3. Preferred Choices for Simplicity

| Need | Prefer | Avoid for MVP |
|------|--------|----------------|
| Database | Azure SQL (simple schema) or Cosmos DB (flexible JSON) | Multiple DBs, complex migrations |
| Backend language | Python (Foundry SDK, FastAPI) | Multiple runtimes |
| Frontend | Single SPA (React + Vite) with portal + chat | Separate mobile app, native apps |
| Notifications | In-app chatbot + optional in-memory/queue | SMS, email providers, telephony |
| ETA/Risk | Rule-based or single small model | Full forecasting pipeline |
| Speech/Vision | Stub or one Azure service each | Multiple regions, custom models |

---

## 4. Out-of-Scope for This Stack

- Real insurance provider APIs  
- Real OBD / vehicle telematics hardware  
- Telephony (calls, SMS)  
- Production SSO (e.g. Entra tenant, full RBAC)  
- Multi-region deployment and DR  
- Full observability (beyond basic logs; optional Application Insights is fine)  

---

## 5. References

- [PRD](PRD.md) – Vision, workflow, and scope  
- [Synthetic Data and Data Model](SYNTHETIC_DATA_AND_DATA_MODEL.md) – What to generate and mock data schemas  
- [Agents League – Reasoning Agents](https://github.com/microsoft/agentsleague/tree/main/starter-kits/2-reasoning-agents)  
- [Microsoft Foundry Agent Service](https://learn.microsoft.com/en-us/azure/ai-foundry/agents/overview)  
