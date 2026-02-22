from fastapi import APIRouter, UploadFile, File
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from app.application.speech_service import transcribe_pcm_chunk

AUDIO_SAMPLE_RATE = 16000
AUDIO_SAMPLE_WIDTH = 2
AUDIO_CHUNK_SECONDS = 2

router = APIRouter(prefix="/speech", tags=["Speech"])

@router.post("/transcribe/health")
def transcribe_health() -> dict[str, str]:
    return {"status": "ok"}

@router.post("/transcribe")
async def transcribe_endpoint(file: UploadFile = File(...)):
    file_bytes = await file.read()

    text = await transcribe_pcm_chunk(
        file_bytes=file_bytes,
        filename=file.filename or "upload.wav"
    )

    return {
        "text": text
    }

@router.websocket("/ws/transcribe")
async def ws_transcribe(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "ready"})

    buffer = bytearray()
    bytes_per_chunk = int(AUDIO_SAMPLE_RATE * AUDIO_SAMPLE_WIDTH * AUDIO_CHUNK_SECONDS)

    try:
        while True:
            msg = await websocket.receive()

            if msg.get("bytes"):
                buffer.extend(msg["bytes"])

                while len(buffer) >= bytes_per_chunk:
                    chunk = bytes(buffer[:bytes_per_chunk])
                    del buffer[:bytes_per_chunk]

                    text = await asyncio.to_thread(transcribe_pcm_chunk, chunk)

                    if text:
                        await websocket.send_json({"type": "partial", "text": text})

            elif msg.get("text") == "__flush__":
                if buffer:
                    text = await asyncio.to_thread(transcribe_pcm_chunk, bytes(buffer))
                    buffer.clear()
                    await websocket.send_json({"type": "final", "text": text})

    except WebSocketDisconnect:
        return