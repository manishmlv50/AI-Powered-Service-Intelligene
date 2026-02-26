"""SQL lookup tool for communication agent."""
from __future__ import annotations

import asyncio

from app.domain.schemas import JobCardStatusResponse
from app.infrastructure.sql_repository import SqlRepository

_repo: SqlRepository | None = None


def _get_repo() -> SqlRepository:
    global _repo
    if _repo is None:
        _repo = SqlRepository.from_env()
    return _repo


async def sql_communication_tool(
    customer_id: str | None = None,
    job_card_id: str | None = None,
) -> str:
    repo = _get_repo()

    def _run() -> JobCardStatusResponse:
        job_card = repo.get_job_card_details(job_card_id) if job_card_id else None
        status_value = job_card.get("status") if job_card else None
        return JobCardStatusResponse(
            job_card_id=job_card_id or "",
            status=status_value,
        )

    try:
        result = await asyncio.to_thread(_run)
    except Exception as exc:
        raise RuntimeError("Failed to retrieve job card status.") from exc
    return result.model_dump_json()
