"""Auth routes — POST /api/auth/login and /api/auth/logout."""
from fastapi import APIRouter, HTTPException
from app.domain.schemas import LoginRequest, LoginResponse
from app.application.auth_service import login, logout

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
def auth_login(payload: LoginRequest):
    session = login(payload.username, payload.password)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return LoginResponse(**session)

@router.post("/logout")
def auth_logout(token: str):
    logout(token)
    return {"status": "ok"}
