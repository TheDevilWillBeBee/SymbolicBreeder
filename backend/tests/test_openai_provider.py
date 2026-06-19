"""Unit tests for OpenAI provider (reasoning models, token limits, response parsing)."""

from unittest.mock import MagicMock

import pytest

from app.services.providers.openai_provider import (
    OpenAIProvider,
    _completion_limit_kwargs,
    _is_reasoning_style_model,
    _message_text,
    _reasoning_extra_body,
    _stream_delta_text,
)


def test_is_reasoning_style_model():
    assert _is_reasoning_style_model("gpt-5")
    assert _is_reasoning_style_model("gpt-5-nano")
    assert _is_reasoning_style_model("o3-mini")
    assert not _is_reasoning_style_model("gpt-4o")


def test_completion_limit_gpt5_floor():
    kw = _completion_limit_kwargs("gpt-5-nano", 4096)
    assert kw == {"max_completion_tokens": 32768}


def test_completion_limit_gpt5_respects_large_request():
    kw = _completion_limit_kwargs("gpt-5", 64_000)
    assert kw == {"max_completion_tokens": 64_000}


def test_completion_limit_caps_at_128k():
    kw = _completion_limit_kwargs("gpt-5", 200_000)
    assert kw == {"max_completion_tokens": 128_000}


def test_completion_limit_gpt4o():
    assert _completion_limit_kwargs("gpt-4o", 4096) == {"max_tokens": 4096}


def test_reasoning_extra_body_only_gpt5():
    assert _reasoning_extra_body("gpt-5-nano") == {"reasoning": {"effort": "low"}}
    assert _reasoning_extra_body("o3-mini") is None


def test_message_text_happy():
    msg = MagicMock()
    msg.content = "  hello  "
    msg.refusal = None
    choice = MagicMock()
    choice.message = msg
    r = MagicMock()
    r.choices = [choice]
    assert _message_text(r) == "hello"


def test_message_text_refusal():
    msg = MagicMock()
    msg.content = None
    msg.refusal = "blocked"
    choice = MagicMock()
    choice.message = msg
    r = MagicMock()
    r.choices = [choice]
    with pytest.raises(RuntimeError, match="refusal"):
        _message_text(r)


def test_message_text_empty():
    msg = MagicMock()
    msg.content = None
    msg.refusal = None
    choice = MagicMock()
    choice.message = msg
    choice.finish_reason = "length"
    r = MagicMock()
    r.choices = [choice]
    with pytest.raises(RuntimeError, match="empty message"):
        _message_text(r)


def test_stream_delta_text():
    d = MagicMock()
    d.content = "x"
    assert _stream_delta_text(d) == "x"
    assert _stream_delta_text(None) == ""


def test_chat_create_kwargs_includes_extra_body_for_gpt5():
    p = OpenAIProvider(model="gpt-5-nano")
    from app.services.providers.base import LLMRequest

    req = LLMRequest(system="s", user="u", max_tokens=4096)
    kw = p._chat_create_kwargs(req, stream=False)
    assert kw["max_completion_tokens"] == 32768
    assert kw["extra_body"] == {"reasoning": {"effort": "low"}}
