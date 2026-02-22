"""Application entrypoint."""
from fastapi import FastAPI
from app.api.intake_routes import router as intake_router
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from app.api.speech_routes import router as speech_router
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

APP_DIR = Path(__file__).parent
STATIC_DIR = APP_DIR / "static"

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.include_router(intake_router, prefix="/api")
app.include_router(speech_router, prefix="/api")

@app.get("/speech-ui")
async def speech_ui():
    return FileResponse(STATIC_DIR / "speech" / "index.html")

# app.include_router(speech_to_text_router, prefix="/api")

def main() -> None:
	import uvicorn

	uvicorn.run("sourcecode.app.main:app", host="127.0.0.1", port=8000, reload=True)


if __name__ == "__main__":
	main()