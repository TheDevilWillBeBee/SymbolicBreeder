"""Authentication endpoints: register, verify, login, me."""

import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, func, select
from sqlalchemy.exc import IntegrityError, ProgrammingError
from sqlalchemy.orm import Session as DBSession

from ..auth import create_access_token, get_current_user, hash_password, verify_password
from ..config import (
    OTP_CODE_LENGTH,
    OTP_EXPIRE_SECONDS,
    OTP_MAX_VERIFY_ATTEMPTS,
    OTP_RESEND_COOLDOWN_SECONDS,
)
from ..database import get_db
from ..models.db import PendingSignup, User, _uuid
from ..models.schemas import (
    AuthResponse,
    LoginRequest,
    RegisterRequest,
    RegisterResendRequest,
    RegisterResendResponse,
    RegisterStartResponse,
    RegisterVerifyRequest,
    UserResponse,
)
from ..services.email import EmailDeliveryError, send_signup_otp_email

router = APIRouter(tags=["auth"])


def _now() -> datetime:
    # SQLAlchemy models currently use timezone-naive DateTime columns.
    # Keep helper values naive UTC to avoid aware/naive subtraction errors.
    return datetime.utcnow()


def _generate_otp_code() -> str:
    upper = 10 ** OTP_CODE_LENGTH
    return f"{secrets.randbelow(upper):0{OTP_CODE_LENGTH}d}"


def _seconds_until(moment: datetime) -> int:
    remaining = int((moment - _now()).total_seconds())
    return max(remaining, 0)


def _cleanup_expired_pending_signups(db: DBSession) -> None:
    try:
        db.execute(delete(PendingSignup).where(PendingSignup.otp_expires_at < _now()))
    except ProgrammingError as exc:
        db.rollback()
        raise HTTPException(
            status_code=503,
            detail=(
                "Database schema is missing pending_signups. "
                "Run Alembic migrations (alembic upgrade head)."
            ),
        ) from exc


@router.post("/auth/register", response_model=RegisterStartResponse)
async def register(req: RegisterRequest, db: DBSession = Depends(get_db)):
    _cleanup_expired_pending_signups(db)

    # Check username uniqueness against existing accounts (case-insensitive).
    existing = db.execute(
        select(User).where(func.lower(User.username) == req.username.lower())
    ).scalar_one_or_none()
    if existing:
        db.rollback()
        raise HTTPException(status_code=409, detail="Username already taken")

    # Check email uniqueness against existing accounts.
    normalized_email = req.email.lower()
    existing = db.execute(
        select(User).where(func.lower(User.email) == normalized_email)
    ).scalar_one_or_none()
    if existing:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")

    otp_code = _generate_otp_code()
    now = _now()
    pending = db.execute(
        select(PendingSignup).where(func.lower(PendingSignup.email) == normalized_email)
    ).scalar_one_or_none()

    if pending is None:
        pending = PendingSignup(
            id=_uuid(),
            email=normalized_email,
            username=req.username,
            password_hash=hash_password(req.password),
            otp_hash=hash_password(otp_code),
            otp_expires_at=now + timedelta(seconds=OTP_EXPIRE_SECONDS),
            resend_available_at=now + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS),
            verify_attempt_count=0,
        )
        db.add(pending)
    else:
        pending.username = req.username
        pending.password_hash = hash_password(req.password)
        pending.otp_hash = hash_password(otp_code)
        pending.otp_expires_at = now + timedelta(seconds=OTP_EXPIRE_SECONDS)
        pending.resend_available_at = now + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
        pending.verify_attempt_count = 0

    try:
        send_signup_otp_email(
            to_email=normalized_email,
            username=req.username,
            otp_code=otp_code,
            expires_minutes=max(1, OTP_EXPIRE_SECONDS // 60),
        )
    except EmailDeliveryError as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Unable to send verification code: {exc}")

    db.commit()
    db.refresh(pending)
    return RegisterStartResponse(
        challenge_id=pending.id,
        email=normalized_email,
        expires_in_seconds=_seconds_until(pending.otp_expires_at),
        resend_after_seconds=_seconds_until(pending.resend_available_at),
    )


@router.post("/auth/register/verify", response_model=AuthResponse, status_code=201)
async def verify_signup_code(req: RegisterVerifyRequest, db: DBSession = Depends(get_db)):
    _cleanup_expired_pending_signups(db)
    pending = db.get(PendingSignup, req.challenge_id)
    if pending is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="Signup challenge expired or not found")

    now = _now()
    if pending.otp_expires_at < now:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired")

    if pending.verify_attempt_count >= OTP_MAX_VERIFY_ATTEMPTS:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=429, detail="Maximum verification attempts reached")

    if not verify_password(req.code, pending.otp_hash):
        pending.verify_attempt_count += 1
        if pending.verify_attempt_count >= OTP_MAX_VERIFY_ATTEMPTS:
            db.delete(pending)
            db.commit()
            raise HTTPException(status_code=429, detail="Maximum verification attempts reached")
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid verification code")

    # Final uniqueness checks happen here so pending signups do not reserve names/emails.
    username_taken = db.execute(
        select(User).where(func.lower(User.username) == pending.username.lower())
    ).scalar_one_or_none()
    if username_taken:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=409, detail="Username already taken")

    email_taken = db.execute(
        select(User).where(func.lower(User.email) == pending.email.lower())
    ).scalar_one_or_none()
    if email_taken:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=409, detail="Email already registered")

    user_id = _uuid()
    user = User(
        id=user_id,
        external_id=f"local:{user_id}",
        username=pending.username,
        email=pending.email,
        display_name=pending.username,
        password_hash=pending.password_hash,
        is_verified=True,
    )

    db.add(user)
    db.delete(pending)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Email or username is no longer available. Please restart signup.",
        )

    db.refresh(user)
    token = create_access_token(user.id)
    return AuthResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/auth/register/resend", response_model=RegisterResendResponse)
async def resend_signup_code(req: RegisterResendRequest, db: DBSession = Depends(get_db)):
    _cleanup_expired_pending_signups(db)
    pending = db.get(PendingSignup, req.challenge_id)
    if pending is None:
        db.rollback()
        raise HTTPException(status_code=404, detail="Signup challenge expired or not found")

    now = _now()
    if pending.otp_expires_at < now:
        db.delete(pending)
        db.commit()
        raise HTTPException(status_code=400, detail="Verification code has expired")

    if pending.resend_available_at > now:
        remaining_seconds = _seconds_until(pending.resend_available_at)
        raise HTTPException(
            status_code=429,
            detail=f"You can resend code in {remaining_seconds} seconds",
        )

    otp_code = _generate_otp_code()
    pending.otp_hash = hash_password(otp_code)
    pending.otp_expires_at = now + timedelta(seconds=OTP_EXPIRE_SECONDS)
    pending.resend_available_at = now + timedelta(seconds=OTP_RESEND_COOLDOWN_SECONDS)
    pending.verify_attempt_count = 0

    try:
        send_signup_otp_email(
            to_email=pending.email,
            username=pending.username,
            otp_code=otp_code,
            expires_minutes=max(1, OTP_EXPIRE_SECONDS // 60),
        )
    except EmailDeliveryError as exc:
        db.rollback()
        raise HTTPException(status_code=502, detail=f"Unable to resend verification code: {exc}")

    db.commit()
    return RegisterResendResponse(
        challenge_id=pending.id,
        expires_in_seconds=_seconds_until(pending.otp_expires_at),
        resend_after_seconds=_seconds_until(pending.resend_available_at),
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
