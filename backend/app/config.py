"""Central configuration and settings for SymbolicBreeder.

Keeps all environment-variable lookups in one place so that changes to
provider names or key names only need to happen here.
"""

import os

# Maps provider key → expected environment variable name.
# Used by both the LLM service (to look up the active key) and the
# /providers endpoint (to tell the frontend whether a server-side key exists).
PROVIDER_ENV_KEYS: dict[str, str] = {
    "anthropic": "ANTHROPIC_API_KEY",
    "openai": "OPENAI_API_KEY",
    "gemini": "GOOGLE_API_KEY",
    "qwen": "DASHSCOPE_API_KEY",
}


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
