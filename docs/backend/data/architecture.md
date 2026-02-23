# AI-Powered Service Intelligence – Data Model Overview

## 1. Tables & Primary Relationships

| Table | Primary Key | Related Tables | Relation Type | Notes |
|-------|------------|----------------|---------------|------|
| **Customers** | `id` | Vehicles, Job_Cards | 1-to-many | A customer can have multiple vehicles and job cards |
| **Vehicles** | `id` | Job_Cards | 1-to-many | Each vehicle can have multiple job cards |
| **Job_Cards** | `id` | Vehicles, Customers, OBD_Reports, Estimates | 1-to-many | Central table linking customer and vehicle to service data |
| **OBD_Reports** | `id` | Job_Cards, OBD_Error_Codes | 1-to-many | Each OBD report belongs to a job card |
| **OBD_Error_Codes** | `(obdReportId, errorCode)` | OBD_Reports, Fault_Code_Mappings | many-to-many | Each report may have multiple fault codes |
| **Fault_Code_Mappings** | `faultCode` | FaultCode_Parts, OBD_Error_Codes, Labor_Operations | 1-to-many | Maps fault codes to parts and labor operations |
| **FaultCode_Parts** | `(faultCode, partId)` | Fault_Code_Mappings, Parts | many-to-many | Links fault codes to parts used in repair |
| **Parts** | `id` | FaultCode_Parts, Estimate_Line_Items | 1-to-many | Car parts used in repairs and estimates |
| **Labor_Operations** | `id` | Fault_Code_Mappings, Estimate_Line_Items | 1-to-many | Labor operations linked to fault codes and estimates |
| **Estimates** | `id` | Job_Cards, Estimate_Line_Items | 1-to-many | Cost estimates generated for a job card |
| **Estimate_Line_Items** | `id` | Estimates, Parts, Labor_Operations | 1-to-many | Line items for parts or labor in an estimate |

---

## 2. Tree-Style Data Overview
CUSTOMERS
├─ VEHICLES
│ └─ JOB_CARDS
│ ├─ OBD_REPORTS
│ │ └─ OBD_ERROR_CODES
│ │ └─ FAULT_CODE_MAPPINGS
│ │ └─ FAULTCODE_PARTS
│ │ └─ PARTS
│ │ └─ LABOR_OPERATIONS
│ └─ ESTIMATES
│ └─ ESTIMATE_LINE_ITEMS
│ ├─ PARTS
│ └─ LABOR_OPERATIONS


### Explanation

- **Customers → Vehicles → Job Cards**: Each customer can own multiple vehicles; each vehicle can have multiple service job cards.  
- **OBD Reports → Fault Codes → Parts & Labor**: Each job card may include OBD reports; each report may contain multiple fault codes, which map to required parts and labor operations.  
- **Estimates → Line Items**: Each job card can have one or more estimates; each estimate contains line items for parts and labor.  
- **Many-to-Many Relationships**:  
  - `FaultCode_Parts` links fault codes to multiple parts.  
  - `OBD_Error_Codes` links OBD reports to multiple fault codes.

---

## 3. Key Notes

- Job cards are the central entity connecting **Customers, Vehicles, OBD Reports, and Estimates**.  
- Fault codes extracted from OBD reports drive automatic estimation by linking to **Parts** and **Labor Operations**.  
- The structure supports **end-to-end workflow simulation** for the AI-powered service MVP: intake → OBD analysis → estimate → customer approval → completion.  
