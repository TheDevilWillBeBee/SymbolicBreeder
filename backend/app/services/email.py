"""Email delivery via Resend for signup OTP messages."""

from __future__ import annotations

import resend

from ..config import RESEND_API_KEY, RESEND_FROM_EMAIL


class EmailDeliveryError(RuntimeError):
    """Raised when outbound email delivery fails."""


def send_signup_otp_email(*, to_email: str, username: str, otp_code: str, expires_minutes: int) -> None:
    if not RESEND_API_KEY:
        raise EmailDeliveryError("RESEND_API_KEY is not configured")

    resend.api_key = RESEND_API_KEY

    subject = "Your Symbolic Breeder verification code"
    text = (
        f"Hi {username},\\n\\n"
        f"Your verification code is: {otp_code}\\n"
        f"This code expires in {expires_minutes} minutes.\\n\\n"
        "If you did not request this code, you can ignore this email."
    )
    html = (
        f"<p>Hi {username},</p>"
        f"<p>Your verification code is: <strong>{otp_code}</strong></p>"
        f"<p>This code expires in {expires_minutes} minutes.</p>"
        "<p>If you did not request this code, you can ignore this email.</p>"
    )

    try:
        resend.Emails.send(
            {
                "from": RESEND_FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "text": text,
                "html": html,
            }
        )
    except Exception as exc:  # pragma: no cover
        detail = str(exc).strip() or exc.__class__.__name__
        raise EmailDeliveryError(f"Resend SDK send failed: {detail}") from exc
