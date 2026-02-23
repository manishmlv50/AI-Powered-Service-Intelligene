"""Application configuration settings."""

from __future__ import annotations

import os
from dotenv import load_dotenv

load_dotenv()


def _get_required_env(name: str) -> str:
	value = os.getenv(name)
	if not value:
		raise RuntimeError(f"Missing required environment variable: {name}")
	return value


def get_openai_endpoint() -> str:
	return _get_required_env("AZURE_OPENAI_ENDPOINT")


def get_openai_api_version() -> str:
	return _get_required_env("AZURE_OPENAI_API_VERSION")


def get_openai_api_key() -> str:
	return _get_required_env("AZURE_OPENAI_API_KEY")


def get_openai_responses_deployment_name() -> str:
	return (
		os.getenv("AZURE_OPENAI_RESPONSES_DEPLOYMENT_NAME")
		or os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")
		or _get_required_env("AZURE_OPENAI_RESPONSES_DEPLOYMENT_NAME")
	)


def get_sql_connection_string() -> str:
	return (
		os.getenv("AZURE_SQL_CONNECTION_STRING")
	)

