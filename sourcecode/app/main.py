"""Application entrypoint."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pathlib import Path
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger("uvicorn.error")

# ─── Routers (always safe to import) ─────────────────────────────────────────
from app.api.auth_routes     import router as auth_router
from app.api.job_card_routes import router as job_card_router
from app.api.estimate_routes import router as estimate_router
from app.api.customer_routes import router as customer_router
from app.api.dashboard_routes import router as dashboard_router

# ─── Optional routers (require Azure services) ───────────────────────────────
agent_router = None
speech_router = None

try:
    from app.api.agent_routes import router as _agent_router
    agent_router = _agent_router
    logger.info(" Agent routes loaded")
except Exception as e:
    logger.warning(f"  Agent routes unavailable (Azure AI not configured): {e}")

try:
    from app.api.speech_routes import router as _speech_router
    speech_router = _speech_router
    logger.info(" Speech routes loaded")
except Exception as e:
    logger.warning(f"  Speech routes unavailable (Azure Speech not configured): {e}")

# ─── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="Service Intelligence API", version="1.0.0")

# ─── CORS (allow Vite dev at :5173) ──────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Static files ─────────────────────────────────────────────────────────────
APP_DIR   = Path(__file__).parent
STATIC_DIR = APP_DIR / "static"
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ─── CRUD API Routers ─────────────────────────────────────────────────────────
app.include_router(auth_router,      prefix="/api")
app.include_router(job_card_router,  prefix="/api")
app.include_router(estimate_router,  prefix="/api")
app.include_router(customer_router,  prefix="/api")
app.include_router(dashboard_router, prefix="/api")

# ─── Optional Routers ─────────────────────────────────────────────────────────
if agent_router:
    app.include_router(agent_router,  prefix="/api")
else:
    # Stub endpoint so the AI FAB doesn't hard-error in the UI
    from fastapi import APIRouter
    stub = APIRouter(prefix="/api/agents", tags=["Agents (stub)"])

    @stub.post("/master")
    async def stub_master(payload: dict = None):
        return {"result": {"reply": "🤖 AI agent is not configured yet. Connect Azure AI Foundry to enable this feature."}}

    app.include_router(stub)

if speech_router:
    app.include_router(speech_router, prefix="/api")

# ─── Legacy speech UI ────────────────────────────────────────────────────────
@app.get("/speech-ui")
async def speech_ui():
    idx = STATIC_DIR / "speech" / "index.html"
    if idx.exists():
        return FileResponse(idx)
    return JSONResponse({"message": "Speech UI not found"}, status_code=404)

# ─── SPA Catch-all (React build) ─────────────────────────────────────────────
SPA_INDEX = STATIC_DIR / "index.html"

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if SPA_INDEX.exists():
        return FileResponse(SPA_INDEX)
    return JSONResponse({"message": "Frontend SPA not built. Run: cd frontend && npm run build"})


def main() -> None:
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
    main()