# AI-Powered Service Intelligence

> Multi-agent AI system for automobile service centres — built with Microsoft Agent Framework + Azure OpenAI Responses API.

---

## 1. Local Setup

### Prerequisites

- **Python 3.11+** (required — older versions are not supported)
- **ODBC Driver 18 for SQL Server** — [download here](https://learn.microsoft.com/en-us/sql/connect/odbc/download-odbc-driver-for-sql-server)
- An **Azure OpenAI** resource with a deployment supporting the Responses API (`2025-03-01-preview`)
- An **Azure SQL Database** with the application tables (`Vehicles`, `Customers`, `Parts`, etc.)
- An **Azure Blob Storage** account with a container for OBD file uploads

### Clone and navigate

```bash
git clone https://github.com/<your-org>/AI-Powered-Service-Intelligence.git
cd AI-Powered-Service-Intelligence/sourcecode
```

### Create the `.env` file

Create a file named `.env` inside the `sourcecode/` folder with the following values:

```env
# Azure OpenAI (Responses API)
AZURE_OPENAI_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=<your-api-key>
AZURE_OPENAI_API_VERSION=2025-03-01-preview
AZURE_OPENAI_RESPONSES_DEPLOYMENT_NAME=gpt-4.1-mini

# Azure SQL Database
AZURE_SQL_CONNECTION_STRING=Driver={ODBC Driver 18 for SQL Server};Server=tcp:<server>.database.windows.net,1433;Database=<db>;Uid=<user>;Pwd=<password>;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=<account>;AccountKey=<key>;EndpointSuffix=core.windows.net
BLOB_CONTAINER_NAME=obd-reports

# Speech Transcription (optional — only needed for Speech-to-Text UI)
AZURE_OPENAI_TRANSCRIBE_ENDPOINT=https://<your-resource>.cognitiveservices.azure.com/
AZURE_OPENAI_TRANSCRIBE_API_KEY=<your-api-key>
AZURE_OPENAI_TRANSCRIBE_DEPLOYMENT_NAME=gpt-4o-mini-transcribe
```

> **Never commit `.env` files or API keys to source control.**

---

## 2. Install Packages

**Python version required: 3.11 or higher.**

```bash
# Create a virtual environment
python -m venv .venv

# Activate it
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

The `requirements.txt` contains ~155 packages. Key dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `agent-framework-core` | 1.0.0rc1 | Microsoft Agent Framework core |
| `agent-framework-azure-ai` | 1.0.0rc1 | `AzureOpenAIResponsesClient` for Azure OpenAI |
| `agent-framework-orchestrations` | 1.0.0b260219 | Multi-agent orchestration primitives |
| `fastapi` | 0.129.0 | REST API framework |
| `uvicorn` | 0.41.0 | ASGI server |
| `pydantic` | 2.12.5 | Request/response validation & structured output |
| `SQLAlchemy` | 2.1.0b1 | Azure SQL data access |
| `pyodbc` | 5.2.0 | ODBC driver for SQL Server |
| `openai` | 2.21.0 | Azure OpenAI client (speech transcription) |
| `azure-storage-blob` | 12.29.0b1 | OBD report file uploads |
| `python-dotenv` | 1.2.1 | `.env` file loading |

---

## 3. Run the Application

From the `sourcecode/` directory:

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Once running, open **http://127.0.0.1:8000/docs** in a browser to see the interactive Swagger UI with all available endpoints.

---

## 4. Test the Endpoints

### 4.1 Master Agent — `POST /api/agents/master`

**What it does:** This is the main endpoint. It sends user input to the **Master Agent**, which analyses the request and routes it to exactly one specialist agent (Intake, Estimator, Communication, or ETA). The specialist agent reasons over the input — optionally querying Azure SQL for live vehicle/customer/parts data — and returns strict structured JSON.

**When to use:** Any time you want to trigger an AI-powered service workflow (create a job card, get a cost estimate, generate a customer message, or predict an ETA).

```bash
curl -X POST http://127.0.0.1:8000/api/agents/master ^
  -H "Content-Type: application/json" ^
  -d "{\"vehicle_id\":\"VH-1023\",\"customer_complaint\":\"brake noise when stopping\",\"obd_report_text\":\"P0500 vehicle speed sensor malfunction\"}"
```

**Request fields:**

| Field | Type | Description |
|-------|------|-------------|
| `vehicle_id` | string (optional) | Vehicle identifier for SQL lookup |
| `customer_complaint` | string (optional) | Customer's complaint text |
| `obd_report_text` | string (optional) | Raw OBD-II fault code report |
| `user_input` | string (optional) | Free-form text (alternative to structured fields) |

Provide either the three structured fields **or** a single `user_input` string.

**Example response (Intake Agent routed):**

```json
{
  "agent": "intake_agent",
  "vehicle_id": "VH-1023",
  "customer_complaint": "brake noise when stopping",
  "obd_report_summary": "P0500 — Vehicle Speed Sensor malfunction detected.",
  "job_details": "Job card created for VH-1023. Suggested: inspect brake pads, check speed sensor."
}
```

**Example response (Estimator Agent routed):**

```json
{
  "agent": "estimator_agent",
  "estimated_cost": "12500",
  "currency": "INR",
  "notes": "Includes brake pad replacement and speed sensor diagnostic."
}
```

---

### 4.2 Intake File Upload — `POST /api/intake/start`

**What it does:** Accepts a customer complaint (text) and an OBD report file upload. The file is stored in Azure Blob Storage and a unique job ID is returned. This endpoint handles the **file-based intake flow** — uploading the physical OBD report before any agent reasoning.

**When to use:** When a service advisor has an OBD report file (PDF/TXT) to upload as part of the intake process.

```bash
curl -X POST http://127.0.0.1:8000/api/intake/start ^
  -F "complaint_text=Engine light on, rough idle" ^
  -F "file=@sample_obd_report.txt"
```

**Response:**

```json
{
  "job_id": "a1b2c3d4-...",
  "complaint_text": "Engine light on, rough idle",
  "blob_url": "https://<account>.blob.core.windows.net/obd-reports/intake/a1b2c3d4-.../sample_obd_report.txt",
  "status": "INTAKE_RECEIVED"
}
```

---

### 4.3 Speech Transcription — `POST /api/speech/transcribe`

**What it does:** Accepts an audio file upload (WAV format) and returns the transcribed text using Azure OpenAI's `gpt-4o-mini-transcribe` model. This enables voice-based intake where the service advisor dictates the complaint instead of typing.

**When to use:** When you have a pre-recorded audio file to transcribe.

```bash
curl -X POST http://127.0.0.1:8000/api/speech/transcribe ^
  -F "file=@recording.wav"
```

**Response:**

```json
{
  "text": "Customer says the brakes are making a grinding noise when stopping at low speed."
}
```

---

### 4.4 Speech Health Check — `POST /api/speech/transcribe/health`

**What it does:** Simple health check to verify the speech transcription service is loaded and reachable. No authentication or Azure calls are made.

**When to use:** To verify the speech module is running before attempting transcription.

```bash
curl -X POST http://127.0.0.1:8000/api/speech/transcribe/health
```

**Response:**

```json
{
  "status": "ok"
}
```

---

### 4.5 Real-Time Speech WebSocket — `WS /api/speech/ws/transcribe`

**What it does:** A WebSocket endpoint for **streaming real-time speech-to-text**. The browser sends raw PCM audio chunks over the WebSocket; the server converts each chunk to WAV and transcribes it on the fly. Partial transcriptions are streamed back as they become available. Send `"__flush__"` as a text message to flush the remaining audio buffer and get the final transcription.

**When to use:** For the live Speech-to-Text UI (see section 5 below). Not called directly with curl — connect via WebSocket client or the built-in browser UI.

**Message flow:**

```
Client → Server:  binary PCM audio bytes (16kHz, 16-bit, mono)
Server → Client:  {"type": "partial", "text": "..."}   (streaming partials)
Client → Server:  "__flush__"                            (end of speech)
Server → Client:  {"type": "final", "text": "..."}     (final transcription)
```

---

### 4.6 Swagger UI — `GET /docs`

**What it does:** FastAPI auto-generates interactive API documentation. You can explore all endpoints, see request/response schemas, and test calls directly from the browser.

**Open:** http://127.0.0.1:8000/docs

---

## 5. Speech-to-Text UI

The application includes a built-in browser-based speech transcription interface.

### How to run it

1. Make sure the server is running (see section 3).
2. Make sure the speech environment variables are set in `.env`:
   ```
   AZURE_OPENAI_TRANSCRIBE_ENDPOINT=...
   AZURE_OPENAI_TRANSCRIBE_API_KEY=...
   AZURE_OPENAI_TRANSCRIBE_DEPLOYMENT_NAME=gpt-4o-mini-transcribe
   ```
3. Open **http://127.0.0.1:8000/speech-ui** in your browser.
4. Click the microphone button to start recording.
5. Speak your complaint — partial transcriptions appear in real time.
6. Click stop to flush the buffer and get the final transcription.

The UI connects to the `WS /api/speech/ws/transcribe` WebSocket endpoint. It captures audio from the browser microphone as raw PCM (16 kHz, 16-bit, mono), streams it to the server in 2-second chunks, and displays the transcribed text as it arrives.

The source files for the UI are located in `app/static/speech/` (`index.html`, `app.js`, `styles.css`).
