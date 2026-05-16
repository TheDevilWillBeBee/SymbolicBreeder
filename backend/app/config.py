"""Central configuration and settings for SymbolicBreeder.

Keeps all environment-variable lookups in one place so that changes to
provider names or key names only need to happen here.
"""

import os
from functools import lru_cache

# Maps provider key → expected environment variable name.
# Used by both the LLM service (to look up the active key) and the
# /providers endpoint (to tell the frontend whether a server-side key exists).
PROVIDER_ENV_KEYS: dict[str, str] = {
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "gemini": "GOOGLE_API_KEY",
    "qwen": "DASHSCOPE_API_KEY",
}


# ---------------------------------------------------------------------------
# Auth / JWT settings
# ---------------------------------------------------------------------------
JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "")
JWT_ALGORITHM: str = "HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
)


# ---------------------------------------------------------------------------
# Signup OTP / Email settings
# ---------------------------------------------------------------------------
OTP_CODE_LENGTH: int = 6
OTP_EXPIRE_SECONDS: int = 300
OTP_RESEND_COOLDOWN_SECONDS: int = 30
OTP_MAX_VERIFY_ATTEMPTS: int = 5

RESEND_API_BASE: str = os.getenv("RESEND_API_BASE", "https://api.resend.com")
RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")
RESEND_FROM_EMAIL: str = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")


def get_server_api_key() -> str | None:
    """Return the first available server-side API key, or None.

    The key is used as a fallback when the frontend has not supplied its own
    key (i.e. the user is relying on the deployment's shared key).
    """
    for env_var in PROVIDER_ENV_KEYS.values():
        value = os.getenv(env_var)
        if value:
            return value
    return None


def any_server_key_available() -> bool:
    """Return True if at least one provider API key is configured server-side."""
    return get_server_api_key() is not None
