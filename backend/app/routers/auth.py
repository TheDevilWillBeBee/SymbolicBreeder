"""Authentication endpoints: register, login, me."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session as DBSession

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..database import get_db
from ..models.db import User, _uuid
from ..models.schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=AuthResponse, status_code=201)
async def register(req: RegisterRequest, db: DBSession = Depends(get_db)):
    # Check username uniqueness (case-insensitive)
    existing = db.execute(
        select(User).where(func.lower(User.username) == req.username.lower())
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    # Check email uniqueness
    existing = db.execute(
        select(User).where(func.lower(User.email) == req.email.lower())
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = _uuid()
    user = User(
        id=user_id,
        external_id=f"local:{user_id}",
        username=req.username,
        email=req.email.lower(),
        display_name=req.username,
        password_hash=hash_password(req.password),
        is_verified=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest, db: DBSession = Depends(get_db)):
    # Try email first, then username
    user = db.execute(
        select(User).where(func.lower(User.email) == req.login.lower())
    ).scalar_one_or_none()
    if user is None:
        user = db.execute(
            select(User).where(func.lower(User.username) == req.login.lower())
        ).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.password_hash:
        raise HTTPException(status_code=400, detail="This account uses external authentication")

    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/auth/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return UserResponse.model_validate(user)
