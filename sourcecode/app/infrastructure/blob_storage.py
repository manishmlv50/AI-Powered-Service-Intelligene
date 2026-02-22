import os
from azure.storage.blob import BlobServiceClient

class BlobStorageService:

    def __init__(self):
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        container_name = os.getenv("BLOB_CONTAINER_NAME")

        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_client = self.blob_service_client.get_container_client(container_name)

    def upload_file(self, file_bytes: bytes, filename: str, job_id: str) -> str:
        """
        Upload OBD file to blob storage.
        Returns blob URL.
        """

        blob_path = f"intake/{job_id}/{filename}"

        blob_client = self.container_client.get_blob_client(blob_path)

        blob_client.upload_blob(file_bytes, overwrite=True)

        return blob_client.url