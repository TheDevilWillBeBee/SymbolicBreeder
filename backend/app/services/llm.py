"""LLM integration for generating programs across modalities."""

import logging
import os
import re
import random
from typing import Optional

from .context import get_system_context, get_seed_context, get_evolve_context

logger = logging.getLogger(__name__)

# Override via env var
DEFAULT_MODEL = os.getenv("LLM_MODEL", "claude-sonnet-4-20250514")


# ── Modality-specific prompt configuration ──

_MODALITY_PROMPTS: dict[str, dict[str, str]] = {
    "strudel": {
        "role": (
            "You are a music programmer. You write programs in the Strudel "
            "live-coding language (strudel.cc). You output ONLY valid Strudel code, "
            "one program per block, wrapped in ```strudel``` fences.\n\n"
            "IMPORTANT RULES:\n"
            "- Each program must be self-contained and runnable in the Strudel REPL\n"
            "- Use only standard Strudel functions documented below\n"
            "- Keep programs concise (1-15 lines) unless complexity is warranted\n"
            "- Prefer musical variety: different sounds, scales, rhythms, effects\n"
            "- Do NOT use external samples or custom sample URLs\n"
            "- Do NOT use slider(), initHydra(), or other interactive/visual features\n"
        ),
        "fence": "strudel",
        "reference_header": "Strudel Language Reference",
        "seed_prompt": (
            "Generate {n} diverse Strudel programs spanning "
            "different musical styles: drums, melodies, bass, ambient, etc. "
            "Each should be concise (1-5 lines). Draw inspiration from the "
            "examples but create original variations."
        ),
        "evolve_prompt": (
            "Generate {n} new Strudel programs that are "
            "variations, mutations, or crossovers of the parents. "
            "Each should be recognizably related but distinct."
        ),
        "variety_suffix": (
            "\n\nVary your output: some simple patterns, some layered compositions, "
            "one wild card. Output ONLY ```strudel``` code blocks, no explanations."
        ),
    },
    "shader": {
        "role": (
            "You are a shader programmer. You write GLSL fragment shaders using the "
            "Shadertoy-compatible mainImage convention. You output ONLY valid GLSL code, "
            "one shader per block, wrapped in ```glsl``` fences.\n\n"
            "IMPORTANT RULES:\n"
            "- Write ONLY the mainImage function: void mainImage(out vec4 fragColor, in vec2 fragCoord)\n"
            "- Available uniforms: uniform vec2 iResolution; uniform float uSin; uniform float uCos;\n"
            "- uSin = sin(2*PI*t/5), uCos = cos(2*PI*t/5) where t is time — use these for 5-second looping animation\n"
            "- Keep programs SHORT: 10-60 lines maximum. Prefer concise, elegant math.\n"
            "- Do NOT declare your own uniforms or attributes\n"
            "- Do NOT include a main() function — only mainImage()\n"
            "- Do NOT use textures, iChannel inputs, or iMouse\n"
            "- Prefer visually striking, colorful output\n"
            "- Use standard GLSL ES 1.0 functions only\n\n"
            "The wrapper around your code is:\n"
            "```\n"
            "precision mediump float;\n"
            "uniform vec2  iResolution;\n"
            "uniform float uSin;\n"
            "uniform float uCos;\n"
            "\n"
            "// YOUR mainImage CODE IS INSERTED HERE\n"
            "\n"
            "void main() {\n"
            "  vec4 col = vec4(0.0);\n"
            "  mainImage(col, gl_FragCoord.xy);\n"
            "  gl_FragColor = col;\n"
            "}\n"
            "```\n"
        ),
        "fence": "glsl",
        "reference_header": "GLSL Reference",
        "seed_prompt": (
            "Generate {n} diverse GLSL fragment shaders using the mainImage convention. "
            "Each should produce a visually distinct animated output using uSin and uCos uniforms. "
            "Include a variety of styles: geometric patterns, color gradients, noise-based textures, "
            "pulsing shapes, spiral forms, and abstract art. Keep each shader under 60 lines."
        ),
        "evolve_prompt": (
            "Generate {n} new GLSL shaders that are mutations or crossovers of the parents. "
            "Each should be visually related to the parents but distinctly different. "
            "Try variations in color, geometry, animation speed, and mathematical transformations."
        ),
        "variety_suffix": (
            "\n\nVary your output: some simple geometric patterns, some complex animated effects, "
            "one experimental wildcard. Output ONLY ```glsl``` code blocks containing mainImage functions, "
            "no explanations."
        ),
    },
}


async def generate_programs(
    modality: str,
    parent_codes: list[str],
    population_size: int = 6,
    guidance: Optional[str] = None,
) -> list[str]:
    """Generate new programs for the given modality. Uses LLM if API key is set, else mock."""
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if api_key:
        logger.info(
            "Using LLM (Anthropic) to generate %d %s programs",
            population_size,
            modality,
        )
        return await _llm_generate(modality, parent_codes, population_size, guidance, api_key)
    logger.info("No ANTHROPIC_API_KEY set — using mock generation for %s", modality)
    return _mock_generate(modality, parent_codes, population_size)


def _build_system_prompt(modality: str) -> str:
    """Build the full system prompt by combining modality instructions with context."""
    config = _MODALITY_PROMPTS.get(modality, _MODALITY_PROMPTS["strudel"])
    base = config["role"]
    system_context = get_system_context(modality)
    if system_context:
        header = config.get("reference_header", "Reference")
        return base + f"\n\n## {header}\n\n" + system_context
    return base


async def _llm_generate(
    modality: str,
    parent_codes: list[str],
    population_size: int,
    guidance: Optional[str],
    api_key: str,
) -> list[str]:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=api_key)
    config = _MODALITY_PROMPTS.get(modality, _MODALITY_PROMPTS["strudel"])
    system_prompt = _build_system_prompt(modality)
    fence = config["fence"]

    if parent_codes:
        # ── Evolution mode ──
        parent_section = "\n\n".join(
            f"Parent {i + 1}:\n```{fence}\n{code}\n```"
            for i, code in enumerate(parent_codes)
        )

        evolve_context = get_evolve_context(modality)
        examples_section = ""
        if evolve_context:
            examples_section = (
                "\n\n## Example Programs for Inspiration\n\n"
                + evolve_context
                + "\n\n"
            )

        prompt = (
            f"Here are the parent programs the user selected:\n\n"
            f"{parent_section}\n\n"
            f"{examples_section}"
            + config["evolve_prompt"].format(n=population_size)
        )
    else:
        # ── Seed mode ──
        seed_context = get_seed_context(modality)
        examples_section = ""
        if seed_context:
            examples_section = (
                "\n\n## Example Programs\n\n"
                + seed_context
                + "\n\n"
            )

        prompt = (
            f"{examples_section}"
            + config["seed_prompt"].format(n=population_size)
        )

    if guidance:
        prompt += f'\n\nThe user requested: "{guidance}"'

    prompt += config.get("variety_suffix", "")

    logger.info(
        "Sending LLM request (model=%s, modality=%s, system=%d chars, user=%d chars)",
        DEFAULT_MODEL,
        modality,
        len(system_prompt),
        len(prompt),
    )

    response = await client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_code_blocks(response.content[0].text, fence, population_size, modality)


def _parse_code_blocks(
    text: str, fence: str, expected: int, modality: str
) -> list[str]:
    """Extract code blocks from LLM response."""
    # Match both specific fence and generic code blocks
    pattern = rf"```(?:{fence})?\s*\n(.*?)```"
    blocks = re.findall(pattern, text, re.DOTALL)
    blocks = [b.strip() for b in blocks if b.strip()]
    if not blocks:
        return _mock_generate(modality, [], expected)
    return blocks[:expected]


# ── Mock generation (no LLM) ──

_MOCK_POOLS: dict[str, list[str]] = {
    "strudel": [
        's("bd sd:1 [bd bd] sd:2")',
        'note("c3 eb3 g3 bb3").s("sawtooth").cutoff(800)',
        's("hh*8").gain("[0.8 0.5]*4")',
        'note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600).gain(0.6)',
        's("bd*2, ~ sd, hh*4")',
        'note("c4 e4 g4 c5").s("triangle").delay(0.3).delaytime(0.125)',
        'note("e4 [b3 c4] d4 a3").s("sine").room(0.5)',
        's("bd:3 [sd:1 sd:2] bd:0 sd:5").speed(1.2)',
        'note("<c3 e3 g3 b3>/2").s("square").lpf(1200)',
        'note("a2 c3 e3 a3").s("sawtooth").cutoff(sine.range(200,2000).slow(4))',
        'note("c3 g3 c4 g3").s("triangle")',
        's("bd ~ sd ~, hh*4").gain(0.8)',
        'note("[c3,e3,g3] [d3,f3,a3]").s("sine").room(0.3)',
        's("bd:1*2, sd:2 ~ sd:3 ~, hh*8").gain(0.7)',
        'note("c2 c2 g2 g2").s("sawtooth").lpf(400).gain(0.5)',
        'note("<c4 d4 e4 f4 g4>*2").s("square").lpf(800).room(0.2)',
        's("bd [~ bd] sd [~ sd:2]").slow(2)',
        'note("g3 a3 b3 d4").s("sawtooth").cutoff(1000).gain(0.5)',
        'note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.4)',
        's("hh*16").gain("[1 0.5 0.7 0.3]*4")',
    ],
    "shader": [
        # 1 — Pulsing circle
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = fragCoord / iResolution.xy;\n"
            "    vec2 center = vec2(0.5);\n"
            "    float d = length(uv - center);\n"
            "    float r = 0.25 + 0.1 * uSin;\n"
            "    float glow = smoothstep(r, r - 0.05, d);\n"
            "    vec3 col = glow * vec3(0.2, 0.6, 1.0);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 2 — Rainbow gradient
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = fragCoord / iResolution.xy;\n"
            "    float t = uv.x + uSin * 0.3;\n"
            "    vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 3 — Concentric rings
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n"
            "    float d = length(uv);\n"
            "    float wave = sin(d * 30.0 - uSin * 10.0);\n"
            "    vec3 col = vec3(wave * 0.5 + 0.5) * vec3(0.9, 0.3, 0.6);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 4 — Rotating grid
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n"
            "    float a = atan(uv.y, uv.x) + uSin * 0.5;\n"
            "    float r = length(uv);\n"
            "    float pat = sin(a * 6.0) * cos(r * 20.0 + uCos * 5.0);\n"
            "    vec3 col = vec3(pat * 0.5 + 0.5, r, 0.8 - r);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 5 — Plasma
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = fragCoord / iResolution.xy * 4.0;\n"
            "    float v = sin(uv.x * 3.0 + uSin * 5.0);\n"
            "    v += sin(uv.y * 3.0 + uCos * 5.0);\n"
            "    v += sin((uv.x + uv.y) * 2.0 + uSin * 3.0);\n"
            "    v += sin(length(uv) * 3.0);\n"
            "    vec3 col = 0.5 + 0.5 * cos(v + vec3(0.0, 2.0, 4.0));\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 6 — Checkerboard warp
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n"
            "    uv *= 5.0 + uSin * 2.0;\n"
            "    float c = mod(floor(uv.x) + floor(uv.y), 2.0);\n"
            "    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(1.0, 0.8, 0.3), c);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 7 — Spiral
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n"
            "    float a = atan(uv.y, uv.x);\n"
            "    float r = length(uv);\n"
            "    float spiral = sin(a * 3.0 + r * 20.0 - uSin * 8.0);\n"
            "    vec3 col = vec3(spiral * 0.5 + 0.5) * vec3(0.3, 0.7, 1.0);\n"
            "    col += 0.1 / (r + 0.1);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 8 — Color blocks
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = fragCoord / iResolution.xy;\n"
            "    float bx = floor(uv.x * 4.0);\n"
            "    float by = floor(uv.y * 4.0);\n"
            "    float id = bx + by * 4.0;\n"
            "    vec3 col = 0.5 + 0.5 * cos(id * 0.7 + uSin * 3.0 + vec3(0.0, 2.0, 4.0));\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 9 — Noise-like pattern
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = fragCoord / iResolution.xy;\n"
            "    float n = fract(sin(dot(uv * (10.0 + uSin), vec2(12.9898, 78.233))) * 43758.5453);\n"
            "    vec3 col = vec3(n) * vec3(0.6 + 0.4 * uCos, 0.3, 0.8);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 10 — Diamond wave
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n"
            "    float d = abs(uv.x) + abs(uv.y);\n"
            "    float wave = sin(d * 15.0 - uSin * 6.0) * 0.5 + 0.5;\n"
            "    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), wave);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 11 — Breathing glow
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n"
            "    float d = length(uv);\n"
            "    float intensity = 0.05 / (d + 0.05) * (0.7 + 0.3 * uSin);\n"
            "    vec3 col = intensity * vec3(1.0, 0.4, 0.7);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
        # 12 — Stripe warp
        (
            "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n"
            "    vec2 uv = fragCoord / iResolution.xy;\n"
            "    float y = uv.y + sin(uv.x * 10.0 + uSin * 4.0) * 0.1;\n"
            "    float stripe = sin(y * 40.0) * 0.5 + 0.5;\n"
            "    vec3 col = mix(vec3(0.0, 0.2, 0.4), vec3(0.0, 0.9, 0.7), stripe);\n"
            "    fragColor = vec4(col, 1.0);\n"
            "}"
        ),
    ],
}


def _mock_generate(modality: str, parent_codes: list[str], population_size: int) -> list[str]:
    pool = _MOCK_POOLS.get(modality, _MOCK_POOLS["strudel"])
    parent_set = set(parent_codes)
    available = [p for p in pool if p not in parent_set]
    if len(available) < population_size:
        available = list(pool)
    return random.sample(available, min(population_size, len(available)))
