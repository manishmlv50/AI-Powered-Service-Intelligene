# """Cosmos DB repository adapter (Azure SDK wrapper)."""
# import os
# from azure.cosmos import CosmosClient
# from dotenv import load_dotenv

# load_dotenv()

# class CosmosRepository:

#     def __init__(self):
#         endpoint = os.getenv("COSMOS_ENDPOINT")
#         key = os.getenv("COSMOS_KEY")
#         database_name = os.getenv("COSMOS_DATABASE")
#         container_name = os.getenv("COSMOS_CONTAINER")

#         client = CosmosClient(endpoint, key)
#         database = client.get_database_client(database_name)
#         self.container = database.get_container_client(container_name)

#     def create_intake_record(self, record: dict):
#         return self.container.create_item(body=record)