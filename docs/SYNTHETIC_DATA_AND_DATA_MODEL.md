# Synthetic Data and Data Model (Hackathon / MVP)

All data in this project is **non-production, synthetic or mocked** for demo and development. This document defines **what to generate** and the **data models** for mocks and seeds.

---

## 1. What to Generate

| Data Set | Purpose | Volume / Format | Consumed By |
|----------|---------|------------------|-------------|
| **Job cards / intake records** | RAG, testing, seed DB | 50–100 records | Intake Agent, RAG index |
| **OBD-style reports** | Upload flow, Vision/Document extraction | 20–30 PDF or .txt files | Intake Agent |
| **Parts catalog** | Estimation pricing | 50–150 parts (CSV/JSON or DB) | Estimation Agent |
| **Labor operations** | Estimation labor cost | 20–40 labor codes (CSV/JSON or DB) | Estimation Agent |
| **Insurance rules config** | Covered vs customer-pay logic | 1 JSON/YAML file | Estimation Agent |
| **RAG knowledge content** | Fault codes, repair types, warranty wording | 30–80 chunks (Azure AI Search) | All agents via RAG |
| **Customers (optional)** | Chatbot and approvals | 20–50 minimal profiles | Communication Agent, portal |

---

## 2. Data Models (Mocks and Schemas)

### 2.1 Job Card / Intake Record

Used for intake flow, RAG, and primary DB.

```json
{
  "id": "string (UUID)",
  "createdAt": "string (ISO 8601)",
  "status": "draft | pending_approval | in_progress | completed | closed",
  "customerName": "string",
  "vehicleMake": "string",
  "vehicleModel": "string",
  "vehicleYear": "number",
  "vin": "string (optional)",
  "mileage": "number",
  "complaint": "string (free text from advisor)",
  "serviceType": "string (e.g. maintenance | repair | inspection | diagnostic)",
  "riskIndicators": ["string"],
  "obdFaultCodes": ["string"],
  "obdDocumentId": "string (optional, reference to uploaded file)",
  "advisorId": "string (optional)"
}
```

**Synthetic generation:** Vary `complaint`, `serviceType`, `mileage`, `riskIndicators`, and `obdFaultCodes`; use realistic make/model/year and common DTCs (e.g. P0300, P0420, C1234).

---

### 2.2 OBD-Style Report (Upload / Vision Input)

Content for “upload OBD” in Phase 1. Stored as file reference or extracted text.

**File:** PDF or plain text.

**Example .txt structure (synthetic):**

```
OBD-II Report
Vehicle: [Make] [Model] [Year]
Mileage: [number]
Date: [ISO date]

Fault Codes:
- P0300 - Random/Multiple Cylinder Misfire Detected
- P0420 - Catalyst System Efficiency Below Threshold (Bank 1)

Freeze Frame / Additional:
[Short synthetic description]
```

**Data model for extracted result (after Vision/Document or stub):**

```json
{
  "documentId": "string",
  "vehicleMileage": "number",
  "reportDate": "string (ISO 8601)",
  "faultCodes": [
    { "code": "string (e.g. P0300)", "description": "string" }
  ],
  "rawTextSnippet": "string (optional)"
}
```

Generate 20–30 such files with varied DTCs and descriptions aligned to [Parts / fault code mapping](#24-fault-code-to-parts-mapping).

---

### 2.3 Parts (Parts and Labor Pricing DB)

**Table or collection: `parts`**

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `"part-001"` |
| `code` | string | `"BRK-PAD-F"` |
| `description` | string | `"Brake Pad Set - Front"` |
| `unitPrice` | number | `89.99` |
| `category` | string | `"brakes"` |

**Synthetic generation:** 50–150 parts across categories: brakes, engine, suspension, electrical, filters, fluids. Use codes and descriptions that map from [fault code → parts](#24-fault-code-to-parts-mapping).

---

### 2.4 Labor Operations (Parts and Labor Pricing DB)

**Table or collection: `labor_operations`**

| Field | Type | Example |
|-------|------|---------|
| `id` | string | `"labor-001"` |
| `code` | string | `"BRK-RPL"` |
| `description` | string | `"Brake pad replacement"` |
| `standardHours` | number | `1.5` |
| `ratePerHour` | number | `120.00` |

**Synthetic generation:** 20–40 operations aligned to service types and part categories (e.g. brake replacement, oil change, diagnostic, sensor replacement).

---

### 2.5 Fault Code to Parts Mapping

Used by Estimation Agent to map OBD codes to parts and labor. Store as config or table.

**Table or collection: `fault_code_mappings`** (or JSON config)

| Field | Type | Example |
|-------|------|---------|
| `faultCode` | string | `"P0420"` |
| `partIds` | string[] | `["part-001", "part-002"]` |
| `laborOperationId` | string | `"labor-001"` |
| `warrantyEligible` | boolean | `false` |

**Synthetic generation:** Map common DTCs (P0300, P0420, P0171, P0442, C1234, etc.) to synthetic part and labor IDs.

---

### 2.6 Insurance Rules Config

**File:** `config/insurance_rules.json` (or YAML).

**Purpose:** Mock “covered vs customer-pay” and optional deductible logic for Estimation Agent.

```json
{
  "rules": [
    {
      "id": "rule-1",
      "name": "Brake wear coverage",
      "condition": { "partCategory": "brakes", "mileageMax": 50000 },
      "coveredPercent": 0,
      "description": "Brake parts not covered beyond 50k miles"
    },
    {
      "id": "rule-2",
      "name": "Catalytic converter",
      "condition": { "faultCodePrefix": "P0420", "warrantyEligible": true },
      "coveredPercent": 80,
      "description": "Emission-related part, 80% covered if warranty eligible"
    }
  ],
  "defaultCustomerPayPercent": 100
}
```

**Synthetic generation:** 5–15 simple rules; conditions on `partCategory`, `faultCodePrefix`, `mileageMax`, or `warrantyEligible`; `coveredPercent` 0–100.

---

### 2.7 RAG Knowledge Content (Azure AI Search)

**Purpose:** Ground agent responses (fault code explanations, repair types, warranty/insurance wording).

**Chunks to generate or curate:**

- **Fault code explanations:** Short paragraphs per DTC (e.g. P0300, P0420, P0171) – cause, typical fix, parts involved.
- **Repair types:** Definitions for “brake replacement”, “diagnostic”, “oil change”, etc.
- **Warranty / insurance wording:** 2–5 short snippets on “what’s typically covered” for demo Q&A.

**Index schema (typical):**

| Field | Type | Use |
|-------|------|-----|
| `id` | string | Unique chunk id |
| `content` | string | Body text for retrieval |
| `sourceType` | string | `"fault_code"` \| `"repair_type"` \| `"warranty"` |
| `title` | string | Short label |
| `metadata` | object | e.g. `faultCode`, `category` for filters |

**Volume:** 30–80 chunks total for MVP.

---

### 2.8 Customer (Optional, Minimal)

For chatbot and “Send for Approval” flow.

```json
{
  "id": "string (UUID)",
  "name": "string",
  "phone": "string (optional)",
  "email": "string (optional)",
  "preferredContact": "chatbot | email"
}
```

**Synthetic generation:** 20–50 minimal profiles; link to job cards via `jobCard.customerId` or `customerName` match.

---

### 2.9 Estimate / Quote (Generated at Runtime)

Produced by Estimation Agent; stored in DB for approval and history.

```json
{
  "id": "string (UUID)",
  "jobCardId": "string",
  "createdAt": "string (ISO 8601)",
  "status": "pending_approval | approved | rejected",
  "lineItems": [
    {
      "partId": "string",
      "description": "string",
      "quantity": "number",
      "unitPrice": "number",
      "total": "number",
      "coveredByInsurance": "boolean"
    },
    {
      "laborOperationId": "string",
      "description": "string",
      "hours": "number",
      "ratePerHour": "number",
      "total": "number",
      "coveredByInsurance": "boolean"
    }
  ],
  "subtotal": "number",
  "customerPayableAmount": "number",
  "insurancePayableAmount": "number",
  "totalAmount": "number"
}
```

No pre-seeded synthetic estimates; generated from synthetic job cards, parts, labor, and insurance rules.

---

## 3. File and Storage Layout (Suggested)

```
config/
  insurance_rules.json
data/
  seed/
    job_cards.json
    parts.json
    labor_operations.json
    fault_code_mappings.json
    customers.json (optional)
  obd_reports/
    sample_obd_001.txt
    sample_obd_002.pdf
    ...
scripts/
  generate_synthetic_data.py  (or .ts)   # Optional generator script
```

RAG content: ingest from `data/rag_chunks/` or generated JSON into Azure AI Search.

---

## 4. References

- [PRD – Synthetic Data Strategy](PRD.md#8-synthetic-data-strategy)
- [PRD – End-to-End Workflow](PRD.md#9-end-to-end-workflow)
- [Tech Stack](TECH_STACK.md)
