"""Auth service — simple in-memory session store for demo."""
from __future__ import annotations

import secrets
from typing import Optional
from app.application.db_service import find_employee, find_customer_by_email

# Demo credential map: username → {password, role, user_id, name}
_DEMO_USERS: dict[str, dict] = {
    "sarah.chen": {"password": "advisor123", "role": "advisor", "user_id": "A001", "name": "Sarah Chen"},
    "raj.kumar":  {"password": "manager123", "role": "manager", "user_id": "A002", "name": "Raj Kumar"},
    "priya.verma":{"password": "customer123", "role": "customer", "user_id": "C002", "name": "Priya Verma"},
    "rohit.sharma":{"password": "customer123", "role": "customer", "user_id": "C001", "name": "Rohit Sharma"},
    "arjun.reddy": {"password": "customer123", "role": "customer", "user_id": "C003", "name": "Arjun Reddy"},
    # Generic demo shortcut
    "advisor":    {"password": "demo", "role": "advisor", "user_id": "A001", "name": "Sarah Chen"},
    "manager":    {"password": "demo", "role": "manager", "user_id": "A002", "name": "Raj Kumar"},
    "customer":   {"password": "demo", "role": "customer", "user_id": "C002", "name": "Priya Verma"},
}

# token → user info
_sessions: dict[str, dict] = {}

def login(username: str, password: str) -> Optional[dict]:
    user = _DEMO_USERS.get(username.lower())
    if user and user["password"] == password:
        token = secrets.token_hex(24)
        session = {"token": token, "role": user["role"], "user_id": user["user_id"], "name": user["name"]}
        _sessions[token] = session
        return session
    return None

def get_session(token: str) -> Optional[dict]:
    return _sessions.get(token)

def logout(token: str) -> None:
    _sessions.pop(token, None)
