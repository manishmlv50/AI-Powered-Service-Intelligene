"""Shared Azure OpenAI Responses client factory."""
from __future__ import annotations

from typing import Optional

from agent_framework.azure import AzureOpenAIResponsesClient

from app.config.settings import (
    get_openai_api_key,
    get_openai_api_version,
    get_openai_endpoint,
    get_openai_responses_deployment_name,
)

_client: Optional[AzureOpenAIResponsesClient] = None

def get_reasoning_client() -> AzureOpenAIResponsesClient:
    global _client
    if _client is None:
        _client = AzureOpenAIResponsesClient(
            endpoint=get_openai_endpoint(),
            deployment_name=get_openai_responses_deployment_name(),
            api_version=get_openai_api_version(),
            api_key=get_openai_api_key(),
        )
    return _client



def get_responses_client() -> AzureOpenAIResponsesClient:
    global _client
    if _client is None:
        _client = AzureOpenAIResponsesClient(
            endpoint=get_openai_endpoint(),
            deployment_name=get_openai_responses_deployment_name(),
            api_version=get_openai_api_version(),
            api_key=get_openai_api_key(),
        )
    return _client
