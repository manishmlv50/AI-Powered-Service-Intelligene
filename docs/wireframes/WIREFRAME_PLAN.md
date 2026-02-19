# Wireframe Plan – Service Intelligence MVP

This plan covers the **interactive wireframes** for the three entry points: **Service Advisor** (`index.html`), **Workshop Manager** (`workshop-manager.html`), and **Customer** (`customer.html`). Insurance is out of scope for the wireframe; estimates show parts, labor, and total only.

---

## 1. Structure

| File | Persona | Purpose |
|------|---------|--------|
| **index.html** | Service Advisor | Full New Intake flow; ERP-style sidebar; Job Cards list with statuses; flow ends when estimate is sent for customer approval. |
| **workshop-manager.html** | Workshop Manager | Tracking dashboard; view Job Cards (read-only); no New Intake. |
| **customer.html** | Customer | Receive estimate, Accept/Reject, ask questions, respond to revised estimate; completed job with Review. |

**AI Assistant:** Available to everyone via a floating button (FAB) that opens the AI panel on every screen in all three HTMLs.

---

## 2. Header (All Portals)

- **Left:** Logo / "Service Intelligence" (or "Service Center" for customer).
- **Right:** User name, role in parentheses, **Logout**.
- Example: `Sarah Chen (Service Advisor)  [Logout]`

---

## 3. Service Advisor (index.html)

### 3.1 Sidebar – ERP-style

- **Dashboard** – Landing; stats; recent jobs; quick action **New Intake**.
- **New Intake** – Start flow (complaint, OBD upload, Generate job card with AI).
- **Job Cards** – List of all jobs with filters (Draft, Pending approval, In progress, Completed). Click row → View/Edit job card. Actions: View, Edit; for Completed: View, **Review**.
- **Estimates** – Placeholder (realistic menu item; can link to Job Cards filtered or to same estimate screen).
- **Tracking** – Placeholder or link to job list by status.
- **Reports** – Placeholder.
- **Settings** – Placeholder.

### 3.2 New Intake Flow (Flow Ends After Send for Approval)

1. **New Intake** – Complaint text, Upload OBD, **Generate job card with AI**.
2. **Job Card** – Add/edit: Customer name, Vehicle (make/model/year), VIN, Mileage, Complaint, Service type, Risk indicators, OBD codes. **Save**. **Generate Estimate**.
3. **Estimate** – Line items (parts + labor only; **no insurance**). Subtotal, **Total**. Actions: **Revise estimate** (add/change line), **Send for Customer Approval**.
4. **Send for Approval** – Confirmation: "Estimate sent to customer. Job status: Pending approval." **Go to Job Cards** (flow ends; user continues from Job Cards list).
5. **Job Cards list** – Shows job with status **Pending approval**. User can open **View** to see job/estimate; no further flow steps until customer acts (demo’d in customer.html).

### 3.3 Edge Cases (Advisor)

- **Add/edit details in Job Card:** Form fields editable; **Save** persists (wireframe: visual only). From list, **Edit** opens same Job Card in edit mode.
- **Modify estimate:** From Estimate screen, **Revise estimate** → add line item or change (e.g. extra part) → **Send revised to customer** → same confirmation; job stays or goes to "Pending approval" for revised quote (customer can accept/reject in customer.html).
- **View job by status:** Job Cards list filter: All | Draft | Pending approval | In progress | Completed. Click row → **View Job Card** (or **View** button) → read-only or same screen in view mode. **Edit** for Draft/Pending allows edits.
- **Completed jobs:** In list with status **Completed**. Actions: **View**, **Review**. **Review** opens placeholder "Leave review / feedback" (wireframe).

### 3.4 Realistic Data Set (Advisor)

- Job IDs: JC-2025-0042, JC-2025-0041, JC-2025-0040, JC-2025-0039.
- Customers: Maria Santos, James Okonkwo, Priya Mehta, David Park.
- Vehicles: 2023 Honda CR-V, 2022 Toyota Camry LE, 2024 Hyundai Tucson, 2021 Ford Escape.
- Complaints: "Brake noise when stopping", "Check engine light on", "Oil change and tire rotation", "AC not cooling".
- Statuses: Draft, Pending approval, In progress, Completed.
- Dates: Today, Yesterday, 19 Feb 2025.

---

## 4. Workshop Manager (workshop-manager.html)

- **Header:** User: Raj Kumar (Workshop Manager) | Logout.
- **Sidebar:** Dashboard, Job Cards, Tracking, Reports, Settings.
- **Dashboard / Tracking:** KPIs (In progress, Pending approval, At risk, Completed today). Table: Job ID, Customer, Vehicle, Status, ETA, Risk. Click row → **View Job Card** (read-only).
- **Job Cards:** Same list concept; filter by status; View only (no Edit for manager in wireframe).
- **AI:** FAB + panel on every screen (e.g. "Which jobs are at risk?", "Why is JC-2025-0041 delayed?").
- **Data:** Same job IDs and customers as Advisor for consistency.

---

## 5. Customer (customer.html)

- **Header:** Service Center | Priya Mehta (Customer) | Logout (or minimal).
- **Content:** Chat-style UI (AI Assistant).
  - **Notification:** "Your estimate for job **JC-2025-0042** is ready. Total: **$429.00**. Please review and respond."
  - **Job/Estimate summary:** Vehicle, line items summary, Total. **View full estimate** | **Accept** | **Reject**.
  - **Ask question:** Free text; AI reply (e.g. "Why is brake pad replacement needed?").
  - **Revised estimate:** Message "We've sent a revised estimate." Same Accept/Reject and View.
  - **Completed:** "Your vehicle is ready for pickup." **Review your experience** (placeholder).
- **AI:** Chat is the main AI; FAB also available so "AI popup for everyone" is satisfied (optional duplicate entry to same chat or same panel style).

### 5.1 Edge Cases (Customer)

- **Accept** – Confirmation; "We'll start the work. You'll get updates here."
- **Reject** – "Your rejection has been sent. Advisor may contact you or send a revised estimate."
- **Reiterate:** Customer asks multiple questions; AI replies. Customer requests change → Advisor revises estimate (in index.html) → Customer sees revised estimate in chat and can Accept/Reject again.
- **Completed job:** In chat history or separate "Past jobs" with **Review** (placeholder screen).

---

## 6. Estimate – No Insurance

- **Columns:** Description, Qty, Unit price, Total (no Insurance column).
- **Totals:** Subtotal, **Total** (no "Customer payable | Insurance" split).
- Copy and labels: no mention of insurance anywhere.

---

## 7. AI Assistant (All Users, All Screens)

- **FAB:** Fixed bottom-right; label "AI" or icon; opens panel.
- **Panel:** Title "AI Assistant", short description, quick prompts, message area, text input + Send. Same behavior in index.html, workshop-manager.html, and customer.html (customer also has in-chat AI; FAB can open same panel for consistency).

---

## 8. Flow Summary

| Step | Advisor (index.html) | Customer (customer.html) |
|------|----------------------|---------------------------|
| 1 | New Intake | — |
| 2 | Job Card (add/edit, Save, Generate Estimate) | — |
| 3 | Estimate (revise if needed, Send for Approval) | — |
| 4 | Flow ends → Job Cards list; job = Pending approval | Notification: estimate ready |
| 5 | — | Accept / Reject / Ask |
| 6 | (Optional) Revise estimate, send again | Revised estimate → Accept/Reject |
| 7 | Mark job In progress → Completed (from list or flow) | "Vehicle ready" + Review |

---

## 9. Files to Create/Update

1. **docs/wireframes/WIREFRAME_PLAN.md** – This plan.
2. **docs/wireframes/index.html** – Rebuild: ERP sidebar, header with user, no insurance, flow end, Job Cards list with statuses and View/Edit/Review, realistic data, AI for everyone.
3. **docs/wireframes/workshop-manager.html** – New: Manager header, sidebar, tracking + Job Cards, View only, AI FAB.
4. **docs/wireframes/customer.html** – New: Customer header, chat UI, accept/reject/revise/completed/review, AI FAB.

All three are self-contained (no persona switcher; each file is one persona). Links between them: from index.html "Open customer view" can link to `customer.html`; from index.html "Open manager view" can link to `workshop-manager.html`.
