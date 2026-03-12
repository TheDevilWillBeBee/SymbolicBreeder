"""LLM integration for generating programs across modalities."""

import logging
import os
import re
import random
from typing import Optional

from .context import get_system_context, get_seed_context, get_evolve_context
from .providers import get_provider, LLMRequest

logger = logging.getLogger(__name__)


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
            "You are an expert shader programmer and creative coder. You write GLSL fragment shaders using the "
            "Shadertoy-compatible mainImage convention. You output ONLY valid GLSL code, "
            "one shader per block, wrapped in ```glsl``` fences.\n\n"
            "IMPORTANT RULES:\n"
            "- Your code block must contain the mainImage function: void mainImage(out vec4 fragColor, in vec2 fragCoord)\n"
            "- You SHOULD define helper functions (e.g. noise, fbm, palette, sdf shapes, rotation) ABOVE mainImage in the same code block\n"
            "- Available uniforms: uniform vec2 iResolution; uniform float iTime;\n"
            "- iTime is elapsed time in seconds — use it freely for animation (sin(iTime), cos(iTime*0.5), fract(iTime), etc.)\n"
            "- Prefer concise, elegant code but don't sacrifice visual complexity for brevity\n"
            "- Use for loops for iterative effects: FBM noise octaves, raymarching steps, fractal iterations, repeated geometry\n"
            "- Use helper functions to keep mainImage readable and enable complex effects\n"
            "- Do NOT declare your own uniforms or attributes\n"
            "- Do NOT include a main() function — only mainImage() and optional helpers\n"
            "- Do NOT use textures, iChannel inputs, or iMouse\n"
            "- Prefer visually striking, colorful, artistic output — aim for Shadertoy quality\n"
            "- Use standard GLSL ES 1.0 functions only\n"
            "- For loops must have compile-time-known bounds (e.g. for(int i=0;i<8;i++))\n\n"
            "TECHNIQUES TO USE:\n"
            "- Cosine palettes: 0.5+0.5*cos(t+vec3(0,2,4))\n"
            "- FBM (fractal Brownian motion) for organic noise textures\n"
            "- Signed distance functions (SDFs) for crisp geometric shapes\n"
            "- Raymarching for 3D scenes\n"
            "- Domain repetition with mod() for infinite patterns\n"
            "- Domain warping for fluid, organic distortion\n"
            "- Polar coordinates for radial symmetry\n"
            "- Iterative geometric folding for fractal-like patterns\n"
            "- Compact math art using minimal code\n\n"
            "ORIGINALITY:\n"
            "- Do NOT copy or closely replicate the provided examples — they show valid syntax and techniques, but your output must be original\n"
            "- Combine techniques in novel ways, use different parameter values, and create your own visual ideas\n"
            "- Each shader should feel like a unique composition, not a variation of an example\n\n"
            "The wrapper around your code block is:\n"
            "```\n"
            "precision mediump float;\n"
            "uniform vec2  iResolution;\n"
            "uniform float iTime;\n"
            "\n"
            "// YOUR CODE IS INSERTED HERE\n"
            "// (helper functions first, then mainImage)\n"
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
            "Each should produce a visually distinct animated output using iTime. "
            "Include a variety of styles and techniques: "
            "FBM noise landscapes, raymarched 3D SDF scenes, fractal patterns (Julia/Mandelbrot), "
            "geometric patterns with domain repetition, plasma and domain warping, "
            "kaleidoscopes, particle-like effects, and abstract math art. "
            "Define helper functions (noise, fbm, sdf, palette, rotation) to enable complex effects. "
            "Use for loops where appropriate (FBM octaves, raymarching, fractal iteration)."
        ),
        "evolve_prompt": (
            "Generate {n} new GLSL shaders that are mutations or crossovers of the parents. "
            "Each should be visually related to the parents but distinctly different. "
            "Try variations in color palettes, geometry, animation speed, mathematical transformations, "
            "and complexity. You may introduce or remove helper functions, add for loops for "
            "iterative effects (FBM, raymarching, fractal iteration), change SDF shapes, "
            "alter domain warping, or combine techniques from multiple parents."
        ),
        "variety_suffix": (
            "\n\nVary your output: some simple elegant shaders, some using helpers and for loops for "
            "complex effects (FBM, raymarching, fractals), one experimental wildcard pushing creative boundaries. "
            "Output ONLY ```glsl``` code blocks containing helper functions (if any) followed by mainImage. "
            "No explanations."
        ),
    },
}


async def generate_programs(
    modality: str,
    parent_codes: list[str],
    population_size: int = 6,
    guidance: Optional[str] = None,
    provider_key: str = "anthropic",
    model: str = "claude-sonnet-4-20250514",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
) -> list[str]:
    """Generate new programs for the given modality. Uses LLM if API key is available, else mock."""
    if not api_key:
        api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY")
    if api_key:
        logger.info(
            "Using LLM (%s/%s) to generate %d %s programs",
            provider_key,
            model,
            population_size,
            modality,
        )
        return await _llm_generate(
            modality, parent_codes, population_size, guidance,
            provider_key, model, api_key, base_url,
        )
    logger.info("No API key available — using mock generation for %s", modality)
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
    provider_key: str,
    model: str,
    api_key: str,
    base_url: Optional[str],
) -> list[str]:
    provider = get_provider(provider_key, model, base_url)
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
                "\n\n## Technique Reference (do NOT replicate — create original variations of the parents)\n\n" + evolve_context + "\n\n"
            )

        prompt = (
            f"Here are the parent programs the user selected:\n\n"
            f"{parent_section}\n\n"
            f"{examples_section}" + config["evolve_prompt"].format(n=population_size)
        )
    else:
        # ── Seed mode ──
        seed_context = get_seed_context(modality)
        examples_section = ""
        if seed_context:
            examples_section = "\n\n## Reference Programs (for syntax and technique reference only — do NOT copy these)\n\n" + seed_context + "\n\n"

        prompt = f"{examples_section}" + config["seed_prompt"].format(n=population_size)

    if guidance:
        prompt += f'\n\nThe user requested: "{guidance}"'

    prompt += config.get("variety_suffix", "")

    logger.info(
        "Sending LLM request (provider=%s, model=%s, modality=%s, system=%d chars, user=%d chars)",
        provider_key,
        model,
        modality,
        len(system_prompt),
        len(prompt),
    )

    llm_request = LLMRequest(system=system_prompt, user=prompt)
    response = await provider.complete(llm_request, api_key)

    return _parse_code_blocks(
        response.text, fence, population_size, modality
    )


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
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 center = vec2(0.5);\n    float d = length(uv - center);\n    float r = 0.25 + 0.1 * sin(iTime);\n    float glow = smoothstep(r, r - 0.05, d);\n    vec3 col = glow * vec3(0.2, 0.6, 1.0);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float t = uv.x + iTime * 0.3;\n    vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float wave = sin(d * 30.0 - iTime * 4.0);\n    vec3 col = vec3(wave * 0.5 + 0.5) * vec3(0.9, 0.3, 0.6);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x) + iTime * 0.5;\n    float r = length(uv);\n    float pat = sin(a * 6.0) * cos(r * 20.0 + iTime * 2.0);\n    vec3 col = vec3(pat * 0.5 + 0.5, r, 0.8 - r);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy * 4.0;\n    float v = sin(uv.x * 3.0 + iTime * 2.0);\n    v += sin(uv.y * 3.0 + iTime * 1.5);\n    v += sin((uv.x + uv.y) * 2.0 + iTime);\n    v += sin(length(uv) * 3.0);\n    vec3 col = 0.5 + 0.5 * cos(v + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= 5.0 + sin(iTime) * 2.0;\n    float c = mod(floor(uv.x) + floor(uv.y), 2.0);\n    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(1.0, 0.8, 0.3), c);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    float spiral = sin(a * 3.0 + r * 20.0 - iTime * 3.0);\n    float brightness = 0.03 / (r + 0.03);\n    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.4, 0.6, 1.0) * brightness;\n    col += 0.01 / (r + 0.01) * vec3(1.0, 0.9, 0.7);\n    fragColor = vec4(col, 1.0);\n}',
        'float hash(vec2 p) {\n    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);\n}\n\nfloat noise(vec2 p) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n    f = f * f * (3.0 - 2.0 * f);\n    float a = hash(i);\n    float b = hash(i + vec2(1.0, 0.0));\n    float c = hash(i + vec2(0.0, 1.0));\n    float d = hash(i + vec2(1.0, 1.0));\n    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\nfloat fbm(vec2 p) {\n    float v = 0.0;\n    float a = 0.5;\n    for (int i = 0; i < 5; i++) {\n        v += a * noise(p);\n        p *= 2.0;\n        a *= 0.5;\n    }\n    return v;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float n = fbm(uv * 5.0 + iTime * 0.3);\n    vec3 col = 0.5 + 0.5 * cos(n * 6.0 + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float v = 0.0;\n    for (int i = 0; i < 6; i++) {\n        float fi = float(i);\n        vec2 p = vec2(sin(iTime * 0.7 + fi * 1.3), cos(iTime * 0.5 + fi * 1.7)) * 0.4;\n        v += 0.02 / length(uv - p);\n    }\n    vec3 col = 0.5 + 0.5 * cos(v * 0.5 + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    vec3 col = vec3(0.0);\n    for (int i = 0; i < 8; i++) {\n        float t = iTime * 0.5 + float(i) * 0.4;\n        uv = abs(uv) - 0.5;\n        uv *= mat2(cos(t), -sin(t), sin(t), cos(t));\n        col += 0.02 / abs(uv.x) * (0.5 + 0.5 * cos(float(i) * 0.5 + vec3(0.0, 2.0, 4.0)));\n    }\n    fragColor = vec4(col, 1.0);\n}',
        'mat2 rot(float a) {\n    float c = cos(a), s = sin(a);\n    return mat2(c, -s, s, c);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= rot(iTime * 0.2);\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    a = mod(a, 6.2831 / 6.0) - 3.1415 / 6.0;\n    vec2 p = vec2(cos(a), sin(a)) * r;\n    float pat = sin(p.x * 15.0 + iTime * 2.0) * cos(p.y * 15.0 + iTime * 1.5);\n    vec3 col = 0.5 + 0.5 * cos(pat * 3.0 + r * 5.0 + iTime + vec3(0.0, 2.0, 4.0));\n    col *= smoothstep(0.8, 0.0, r);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    uv += 0.1 * vec2(sin(uv.y * 10.0 + iTime), cos(uv.x * 10.0 + iTime * 0.7));\n    float stripe = sin(uv.y * 40.0 + iTime * 2.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.9, 0.7), stripe);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float breath = 0.7 + 0.3 * sin(iTime * 1.5);\n    float core = 0.05 / (d + 0.05) * breath;\n    float halo = 0.02 / (d + 0.02) * (1.0 - breath) * 0.5;\n    vec3 col = core * vec3(1.0, 0.3, 0.1) + halo * vec3(0.3, 0.5, 1.0);\n    float rays = sin(atan(uv.y, uv.x) * 8.0 + iTime * 2.0) * 0.5 + 0.5;\n    col += rays * 0.02 / (d + 0.1) * vec3(1.0, 0.8, 0.3);\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float bx = floor(uv.x * 4.0);\n    float by = floor(uv.y * 4.0);\n    float id = bx + by * 4.0;\n    vec3 col = 0.5 + 0.5 * cos(id * 0.7 + iTime * 1.5 + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
        'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = abs(uv.x) + abs(uv.y);\n    float wave = sin(d * 15.0 - iTime * 3.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), wave);\n    fragColor = vec4(col, 1.0);\n}',
    ],
}


def _mock_generate(
    modality: str, parent_codes: list[str], population_size: int
) -> list[str]:
    pool = _MOCK_POOLS.get(modality, _MOCK_POOLS["strudel"])
    parent_set = set(parent_codes)
    available = [p for p in pool if p not in parent_set]
    if len(available) < population_size:
        available = list(pool)
    return random.sample(available, min(population_size, len(available)))
