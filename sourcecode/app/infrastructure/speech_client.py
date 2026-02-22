import os
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

class SpeechClient:

    def __init__(self):
        self.client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_TRANSCRIBE_API_KEY"),
            azure_endpoint=os.getenv("AZURE_OPENAI_TRANSCRIBE_ENDPOINT"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION"),
        )

        self.model = os.getenv("AZURE_OPENAI_TRANSCRIBE_DEPLOYMENT_NAME")

    def transcribe_file_buffer(self, buffer):
        result = self.client.audio.transcriptions.create(
            model=self.model,
            file=buffer,
            language="en"
        )
        return (getattr(result, "text", None) or "").strip()