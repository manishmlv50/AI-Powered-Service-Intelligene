import io
import wave
from app.infrastructure.speech_client import SpeechClient

speech_client = SpeechClient()

AUDIO_SAMPLE_RATE = 16000
AUDIO_CHANNELS = 1
AUDIO_SAMPLE_WIDTH = 2

def build_wav_from_pcm(pcm_bytes: bytes):
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav:
        wav.setnchannels(AUDIO_CHANNELS)
        wav.setsampwidth(AUDIO_SAMPLE_WIDTH)
        wav.setframerate(AUDIO_SAMPLE_RATE)
        wav.writeframes(pcm_bytes)
    buffer.seek(0)
    buffer.name = "audio.wav"
    return buffer

def transcribe_pcm_chunk(pcm_bytes: bytes):
    wav_buffer = build_wav_from_pcm(pcm_bytes)
    return speech_client.transcribe_file_buffer(wav_buffer)