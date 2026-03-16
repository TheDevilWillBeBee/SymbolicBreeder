"""LLM integration for generating programs across modalities."""

import logging
import os
import re
import random
from dataclasses import dataclass
from typing import Optional

from .context import get_system_context
from .providers import get_provider, LLMRequest

logger = logging.getLogger(__name__)


@dataclass
class GenerationResult:
    """Result of program generation with source metadata."""
    codes: list[str]
    source: str  # "llm" or "mock"
    message: str | None = None


# ── Modality-specific prompt configuration ──

_MODALITY_PROMPTS: dict[str, dict[str, str]] = {
    "strudel": {
        "role": (
            "You are a music composer and live-coder. You write programs in the Strudel "
            "live-coding language (strudel.cc). You output ONLY valid Strudel code, "
            "one program per block, wrapped in ```strudel``` fences.\n\n"
            "IMPORTANT RULES:\n"
            "- Each program must be self-contained and runnable in the Strudel REPL\n"
            "- Use only standard Strudel functions documented below\n"
            "- ALWAYS start every program with setcpm(tempo) (e.g. setcpm(120/4) for 120bpm)\n"
            "- Use $: to run multiple parts in parallel — each $: line is a separate musical part\n"
            "- For drum-like sounds, append ._scope() to show the waveform\n"
            "- For melodic/pitched sounds, append ._pianoroll() or ._punchcard() to visualize notes\n"
            "- Do NOT use slider(), initHydra(), or other interactive/visual features\n"
            "- Do NOT use external samples or custom sample URLs\n\n"
            "COMPOSITION RULES — FOLLOW THESE CAREFULLY:\n"
            "- Think like a music producer: songs have PARTS (drums, bass, chords, melody, pads, leads)\n"
            "- All melodic parts in a song MUST share a common scale or chord progression for harmonic coherence\n"
            '  Use `var scale = "D:minor"` at the top to define a shared scale, then reference it in all melodic parts\n'
            '  OR use `const chords = chord("Dm C F G")` for a shared chord progression\n'
            '  OR use `.scale("<D:dorian G:mixolydian C:dorian F:mixolydian>")` for scale progressions\n'
            "- Parts should be RHYTHMICALLY ALIGNED — use the same time subdivision or complementary rhythms\n"
            "- Use `stack()` or multiple `$:` lines to layer parts simultaneously\n"
            "- Use `arrange()` for song structure with intros, verses, choruses, breakdowns\n"
            "- Use `rand`, `perlin`, `irand`, `wchoose` for variation in rhythms, gains, and parameters\n"
            "- Prefer musical variety: different timbres, registers, and rhythmic roles per part\n"
            "- Keep programs concise but musically complete — aim for 2-6 distinct parts\n"
        ),
        "fence": "strudel",
        "reference_header": "Strudel Language Reference",
        "seed_prompt": (
            "Generate {n} diverse Strudel compositions. Each should be a COMPLETE MUSICAL PIECE with "
            "multiple parts layered using $: lines. Every song must:\n"
            "1. Start with setcpm(tempo) — vary tempos (80-160 bpm range, expressed as setcpm(bpm/4))\n"
            '2. Define a shared scale or chord progression (var scale = "X:minor" or similar)\n'
            "3. Have at least 2-4 distinct parts (e.g. drums + bass + chords, or drums + bass + melody + pad)\n"
            "4. End each $: line with ._scope() for drums or ._pianoroll() for melodic parts\n\n"
            "Vary the styles: some tracks should be electronic/dance, some ambient/atmospheric, "
            "some hip-hop/lo-fi, some jazz/funk, some experimental. "
            "Use different drum banks, synth sounds, GM instruments, and effects."
        ),
        "evolve_prompt": (
            "Generate {n} new Strudel compositions descended from the parent programs below. "
            "The children MUST be clearly recognizable as descendants — a listener should hear the family resemblance.\n\n"
            "MUTATION STRATEGIES (from subtle to bold):\n"
            "- TWEAK: Change specific values — tempo, note choices within the scale, pattern density, gain, effect parameters\n"
            "- SUBSTITUTE: Swap a sound/bank for a different one, replace one effect chain with another\n"
            "- AUGMENT: Add one new part or layer to an existing parent (e.g. add a pad, a counter-melody, a percussion fill)\n"
            "- RESTRUCTURE: Rearrange parts using arrange(), add intro/breakdown, change time feel\n"
            "- CROSSOVER: Take parts from different parents and combine them into one coherent piece (align scales and tempos)\n"
            "- INSPIRED: Keep the mood/genre/harmonic language of a parent but write a new variation in the same spirit\n\n"
            "CRITICAL RULES:\n"
            "- All melodic parts MUST share a common scale or chord progression\n"
            "- Every song must start with setcpm()\n"
            "- Every $: line must end with ._scope() or ._pianoroll() or ._punchcard()\n"
            "- Preserve the parents' core identity: keep their key/scale, tempo (or close), and signature sounds unless deliberately crossing over"
        ),
        "variety_suffix": (
            "\n\nDistribute your {n} outputs across the mutation spectrum: "
            "~half should be close mutations (small tweaks, substitutions, single additions to a parent), "
            "~1-2 should be crossovers combining elements from multiple parents, "
            "and ~1 can be a bolder reinterpretation inspired by the parents' style. "
            "Output ONLY ```strudel``` code blocks, no explanations."
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
            "- Available uniforms (always): uniform vec2 iResolution; uniform float iTime;\n"
            "- iTime is elapsed time in seconds — use it freely for animation (sin(iTime), cos(iTime*0.5), fract(iTime), etc.)\n"
            "- Prefer concise, elegant code but don't sacrifice visual complexity for brevity\n"
            "- Use for loops for iterative effects: FBM noise octaves, raymarching steps, fractal iterations, repeated geometry\n"
            "- Use helper functions to keep mainImage readable and enable complex effects\n"
            "- Do NOT declare your own uniforms or attributes\n"
            "- Do NOT include a main() function — only mainImage() and optional helpers\n"
            "- Do NOT use iMouse or iChannel1–iChannel3. You MAY use iChannel0 for ping-pong buffer effects (see below)\n"
            "- Prefer visually striking, colorful, artistic output — aim for Shadertoy quality\n"
            "- Use standard GLSL ES 3.0 (WebGL 2) functions — tanh, sinh, cosh, round, trunc, etc. are all available\n"
            "- For loops may use dynamic bounds in ES 3.0, but prefer reasonable limits for performance\n\n"
            "TECHNIQUES TO USE:\n"
            "- Cosine palettes: 0.5+0.5*cos(t+vec3(0,2,4))\n"
            "- FBM (fractal Brownian motion) for organic noise textures\n"
            "- Signed distance functions (SDFs) for crisp geometric shapes\n"
            "- Raymarching for 3D scenes\n"
            "- Domain repetition with mod() for infinite patterns\n"
            "- Domain warping for fluid, organic distortion\n"
            "- Polar coordinates for radial symmetry\n"
            "- Iterative geometric folding for fractal-like patterns\n"
            "- Compact math art using minimal code\n"
            "- Ping-pong buffer effects for stateful simulations (see below)\n\n"
            "PING-PONG BUFFER SHADERS (optional, advanced):\n"
            "- For effects that need frame-to-frame memory (Game of Life, reaction-diffusion, fluid, trails):\n"
            "  use `uniform sampler2D iChannel0` to read the previous frame's output\n"
            "- The system auto-detects buffer mode when iChannel0 appears in your code\n"
            "- Read previous frame: texture(iChannel0, uv) where uv = fragCoord / iResolution.xy (0-1 range)\n"
            "- Additional uniform in buffer mode: uniform int iFrame (frame counter, starts at 0)\n"
            "- Initialize buffer state inline: use `if (iFrame == 0) { /* seed state */; return; }` at the top of mainImage\n"
            "  Buffers start as black (vec4(0.0)) — use iFrame == 0 for effects that need non-trivial initial state\n"
            "- Do NOT define a separate initImage function — all initialization must be inline in mainImage\n"
            "- mainImage runs every frame: read iChannel0, compute new state, write to fragColor\n"
            "- IMPORTANT: use fragCoord / iResolution.xy for texture lookups (0-1 normalized), NOT centered coordinates\n"
            "- WHEN TO USE: only when the effect genuinely needs frame-to-frame memory\n"
            "  Most effects (noise, SDF, raymarching, fractals) do NOT need buffers — prefer memoryless shaders when possible\n\n"
            "ORIGINALITY:\n"
            "- Do NOT copy or closely replicate the provided examples — they show valid syntax and techniques, but your output must be original\n"
            "- Combine techniques in novel ways, use different parameter values, and create your own visual ideas\n"
            "- Each shader should feel like a unique composition, not a variation of an example\n\n"
            "GLSL ES 3.0 FUNCTIONS (use these freely for richer effects):\n"
            "- tanh(x): hyperbolic tangent — excellent for soft clamping and tone mapping (e.g. col = tanh(col * 2.0) for white balancing)\n"
            "- sinh(x), cosh(x): hyperbolic sine/cosine for smooth exponential curves\n"
            "- round(x), trunc(x): rounding and truncation — useful for pixelation and quantization effects\n"
            "- uint type and bitwise operators (&, |, ^, <<, >>): useful for hash functions and cellular automata\n"
            "- texture() replaces texture2D() — use texture(sampler, uv) for all texture lookups\n"
            "- transpose(m), determinant(m), inverse(m): matrix operations\n\n"
            "The wrapper around your code block is:\n"
            "```\n"
            "#version 300 es\n"
            "// Standard mode:\n"
            "precision mediump float;\n"
            "out vec4 fragColor_out;\n"
            "uniform vec2  iResolution;\n"
            "uniform float iTime;\n"
            "\n"
            "#version 300 es\n"
            "// Buffer mode (auto-applied when iChannel0 is used):\n"
            "precision mediump float;\n"
            "out vec4 fragColor_out;\n"
            "uniform vec2  iResolution;\n"
            "uniform float iTime;\n"
            "uniform int   iFrame;\n"
            "uniform sampler2D iChannel0;\n"
            "\n"
            "// YOUR CODE IS INSERTED HERE\n"
            "// (helper functions first, then mainImage)\n"
            "\n"
            "void main() {\n"
            "  vec4 col = vec4(0.0);\n"
            "  mainImage(col, gl_FragCoord.xy);\n"
            "  fragColor_out = col;\n"
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
            "kaleidoscopes, particle-like effects, abstract math art, "
            "and optionally 1-2 ping-pong buffer shaders (Game of Life, reaction-diffusion, trail effects using iChannel0). "
            "Define helper functions (noise, fbm, sdf, palette, rotation) to enable complex effects. "
            "Use for loops where appropriate (FBM octaves, raymarching, fractal iteration)."
        ),
        "evolve_prompt": (
            "Generate {n} new GLSL shaders descended from the parent shaders below. "
            "Each child MUST be visually recognizable as a descendant — the viewer should see the family resemblance.\n\n"
            "MUTATION STRATEGIES (from subtle to bold):\n"
            "- TWEAK: Adjust constants — color offsets, frequencies, speeds, scale factors, iteration counts\n"
            "- REPARAMETRIZE: Change the math slightly — swap sin for cos, adjust exponents, shift phase offsets\n"
            "- AUGMENT: Add one new visual element — an extra layer, a glow, a vignette, domain repetition, a color remap\n"
            "- RECOMBINE: Swap a helper function from one parent into another parent's structure\n"
            "- CROSSOVER: Merge the SDF/noise/color techniques of multiple parents into one shader\n"
            "- INSPIRED: Keep the visual mood and palette of a parent but explore a new geometric or procedural idea in the same style\n\n"
            "PRESERVE the parents' core identity: keep their dominant colors, animation tempo, and spatial structure unless deliberately crossing over."
        ),
        "variety_suffix": (
            "\n\nDistribute your {n} outputs across the mutation spectrum: "
            "~half should be close mutations (tweaked constants, swapped functions, single additions), "
            "~1-2 should be crossovers blending techniques from multiple parents, "
            "and ~1 can be a bolder reinterpretation inspired by the parents' visual language. "
            "Output ONLY ```glsl``` code blocks containing helper functions (if any) followed by mainImage "
            "(use `if (iFrame == 0)` inline for buffer initialization). No explanations."
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
) -> GenerationResult:
    """Generate new programs for the given modality. Uses LLM if API key is available, else mock."""
    if not api_key:
        api_key = os.getenv("ANTHROPIC_API_KEY") or os.getenv("OPENAI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("DASHSCOPE_API_KEY")
    if api_key:
        logger.info(
            "Using LLM (%s/%s) to generate %d %s programs",
            provider_key,
            model,
            population_size,
            modality,
        )
        try:
            codes = await _llm_generate(
                modality,
                parent_codes,
                population_size,
                guidance,
                provider_key,
                model,
                api_key,
                base_url,
            )
            return GenerationResult(codes=codes, source="llm")
        except Exception as exc:
            logger.warning("LLM call failed (%s), falling back to mock: %s", type(exc).__name__, exc)
            codes = _mock_generate(modality, parent_codes, population_size)
            return GenerationResult(
                codes=codes,
                source="mock",
                message=f"LLM error: {exc} — used mock examples instead",
            )
    logger.info("No API key available — using mock generation for %s", modality)
    codes = _mock_generate(modality, parent_codes, population_size)
    return GenerationResult(
        codes=codes,
        source="mock",
        message="No API key available — used mock examples",
    )


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

        prompt = (
            f"Here are the parent programs the user selected:\n\n"
            f"{parent_section}\n\n"
            + config["evolve_prompt"].format(n=population_size)
        )
    else:
        # ── Seed mode ──
        prompt = config["seed_prompt"].format(n=population_size)

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

    return _parse_code_blocks(response.text, fence, population_size, modality)


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
        # Multi-part compositions with setcpm, scale, and visualization
        'setcpm(120/4)\nvar scale = "D:minor"\n$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")._scope()\n$: note("<d2 a2 bb2 g2>").s("sawtooth").lpf(600).gain(0.6).scale(scale)._pianoroll()',
        'setcpm(130/4)\nvar scale = "C:minor"\n$: s("bd [~ bd] sd [~ sd:2], hh*8").bank("RolandTR808")._scope()\n$: note("<c2 eb2 f2 g2>*2").s("sawtooth").lpf(500).gain(0.5)._pianoroll()\n$: n("0 2 4 <[6,8] [7,9]>").scale("C4:minor").s("gm_epiano1").room(0.5)._pianoroll()',
        'setcpm(90/4)\nvar scale = "A:minor"\n$: s("bd sd:1 [bd bd] sd:2, hh*8").gain(0.8)._scope()\n$: note("<a1 e2 f2 g2>").s("triangle").lpf(400).gain(0.7)._pianoroll()\n$: n("0 [2 4] <3 5> [~ <4 1>]").scale("A4:minor").s("gm_xylophone").room(0.4).delay(0.125)._pianoroll()',
        'setcpm(100/4)\n$: s("bd*4").duck("2:3").duckdepth(0.8).duckattack(0.2)._scope()\n$: s("[~ <~ cp:1>]*2")._scope()\n$: s("hh*8").gain("[0.5 0.3]*4")._scope()\n$: note("<c2 c2 eb2 f2>").s("sawtooth").lpf(400).gain(0.6)._pianoroll()',
        'setcpm(140/4)\nvar scale = "E:minor"\n$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()\n$: s("bd:1!4")._scope()\n$: s("[~ <~ cp:1>]*2")._scope()\n$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()',
        'setcpm(85/4)\nvar scale = "F:major"\n$: s("bd ~ sd ~, hh*4").bank("RolandTR707")._scope()\n$: note("<f2 c2 bb1 c2>").s("gm_acoustic_bass").gain(0.8)._pianoroll()\n$: chord("<Fmaj7 Am7 Bbmaj7 C7>").voicing().s("gm_epiano1").room(0.5)._pianoroll()',
        'setcpm(150/4)\nvar scale = "D:dorian"\n$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909").gain(0.7)._scope()\n$: note("<d2 d2 c2 a1>*2").s("sawtooth").lpf(500)._pianoroll()\n$: n("0 3 5 <7 [5 3]>").scale("D4:dorian").s("triangle").delay(0.3).room(0.4)._pianoroll()',
        'setcpm(110/4)\nvar scale = "G:mixolydian"\n$: s("bd [~ bd] sd ~, hh*8").bank("RolandTR808")._scope()\n$: note("<g1 f1 c2 d2>").s("sawtooth").lpf(600).gain(0.6)._pianoroll()\n$: n("[0,2,4] [1,3,5]").scale("G3:mixolydian").s("gm_epiano1").room(0.5)._pianoroll()',
        'setcpm(70/4)\nvar scale = "C:minor"\n$: note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()\n$: s("bd ~ sd ~").room(0.3)._scope()\n$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()',
        'setcpm(95/4)\nvar scale = "Bb:major"\n$: s("bd sd bd sd, hh*8").bank("RolandTR909").gain(0.6)._scope()\n$: note("<bb1 f2 eb2 f2>*2").s("gm_synth_bass_1").lpf(500)._pianoroll()\n$: chord("<Bb F Gm Eb>").voicing().s("gm_epiano1").room(0.4).delay(0.25)._pianoroll()\n$: n("0 2 4 <6 [4 2]>").scale("Bb4:major").s("sine").fm(2).delay(0.3)._pianoroll()',
        'setcpm(128/4)\nvar scale = "A:minor"\n$: stack(\n  s("bd:4").struct("x <x -> - <- x> - - - - x - x <- x> -"),\n  s("sd:5").struct("- - - - x - - x").gain(0.5),\n  s("hh:4").struct("x x x - x - x x").gain(0.75)\n).room(".4:.5")._scope()\n$: s("supersaw, sine").n("<<0!3 [-2 -1]> <3!3 [3 4]>>").scale("A2:minor").seg(16).clip(0.9).cutoff(perlin.range(1000,4000).slow(2))._pianoroll()',
        'setcpm(120/4)\nvar scale = "C:major"\nlet BASS = note("<[c2 c3]*4 [g1 g2]*4 [a1 a2]*4 [f1 f2]*4>").sound("gm_synth_bass_1").lpf(800)\nlet PIANO = chord("<C G Am F>").voicing().s("gm_epiano1").room(0.5)\nlet DRUMS = s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")\narrange(\n  [4, stack(BASS, PIANO)],\n  [4, stack(BASS, PIANO, DRUMS)],\n  [2, stack(BASS, PIANO)],\n  [9999, silence]\n)',
        'setcpm(135/4)\nvar scale = "E:minor"\n$: s("bd*4")._scope()\n$: s("[~ hh]*4").gain("[0.05 0.2]*4")._scope()\n$: s("[~ sd]*2").gain(0.75)._scope()\n$: note("<e1 e2 g1 g2 a1 a2 b1 b2>").s("wt_digital").lpf("200 400").gain(0.8)._pianoroll()\n$: note("[~ [<[e3,g3,b3]!2 [e3,g3,a3]!2> ~]]*2").s("gm_electric_guitar_muted").delay("0.8:0.6:0.5").gain(0.5)._pianoroll()',
        'setcpm(60/4)\nvar scale = "D:minor"\n$: note("d3 [f3 a3] c3 [e3 g3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()\n$: s("bd ~ sd ~").room(0.3).delay(0.5)._scope()\n$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()\n$: n("0 [2 4] <3 5> [~ <4 1>]").scale("D5:minor").s("gm_music_box").room(0.6).gain(0.4)._pianoroll()',
        'setcpm(100/4)\nvar scale = "G:minor"\n$: s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)._scope()\n$: s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)._scope()\n$: s("hh*8").gain("[0.4 0.6]*4")._scope()\n$: n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale("G3:minor").sound("gm_synth_strings_1").attack(0.4).sustain(3).gain(0.4)._pianoroll()',
        'setcpm(91/4)\nvar scale = "F:minor"\n$: s("bd [~ bd] sd [~ sd], hh*4").bank("RolandTR707").gain(0.8)._scope()\n$: n("2").set(chord("<Fm Cm Db Gb>")).anchor(chord("<Fm Cm Db Gb>").rootNotes(1)).voicing().s("gm_acoustic_bass").gain(0.8).lpf(900)._pianoroll()\n$: chord("<Fm Cm Db Gb>").voicing().s("sawtooth").lpf(perlin.range(900,4000)).struct("[~ x]*2").clip(0.5).delay(".5:.125:.8").room(1).gain(0.3)._pianoroll()',
        'setcpm(120/4)\n$: s("bd!4")._scope()\n$: s("[~ hh]*4").gain(0.5)._scope()\n$: s("[~ sd]*2")._scope()\n$: note("<[a1,a2] [e1,e2] [f1,f2] [g1,g2]>").s("sawtooth").lpf(400).gain(0.7)._pianoroll()\n$: chord("<Am Em F G>").voicing().s("gm_epiano1").room(0.5).delay(0.3)._pianoroll()',
        'setcpm(140/4)\nvar scale = "C:minor"\nlet SYNTH = n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale("C3:minor")\n  .sound("gm_synth_strings_1").attack(0.4).sustain(3).distort("2:.4").gain(0.4)\nlet KICK = s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)\nlet SNARE = s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)\nlet HH = s("hh*8").gain("[0.4 0.6]*4")\n$: arrange(\n  [4, stack(SYNTH)],\n  [4, stack(SYNTH, KICK, HH)],\n  [4, stack(SYNTH, KICK, HH, SNARE)],\n  [9999, silence]\n)',
    ],
    "shader": [
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 center = vec2(0.5);\n    float d = length(uv - center);\n    float r = 0.25 + 0.1 * sin(iTime);\n    float glow = smoothstep(r, r - 0.05, d);\n    vec3 col = glow * vec3(0.2, 0.6, 1.0);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float t = uv.x + iTime * 0.3;\n    vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float wave = sin(d * 30.0 - iTime * 4.0);\n    vec3 col = vec3(wave * 0.5 + 0.5) * vec3(0.9, 0.3, 0.6);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x) + iTime * 0.5;\n    float r = length(uv);\n    float pat = sin(a * 6.0) * cos(r * 20.0 + iTime * 2.0);\n    vec3 col = vec3(pat * 0.5 + 0.5, r, 0.8 - r);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy * 4.0;\n    float v = sin(uv.x * 3.0 + iTime * 2.0);\n    v += sin(uv.y * 3.0 + iTime * 1.5);\n    v += sin((uv.x + uv.y) * 2.0 + iTime);\n    v += sin(length(uv) * 3.0);\n    vec3 col = 0.5 + 0.5 * cos(v + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= 5.0 + sin(iTime) * 2.0;\n    float c = mod(floor(uv.x) + floor(uv.y), 2.0);\n    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(1.0, 0.8, 0.3), c);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    float spiral = sin(a * 3.0 + r * 20.0 - iTime * 3.0);\n    float brightness = 0.03 / (r + 0.03);\n    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.4, 0.6, 1.0) * brightness;\n    col += 0.01 / (r + 0.01) * vec3(1.0, 0.9, 0.7);\n    fragColor = vec4(col, 1.0);\n}",
        "float hash(vec2 p) {\n    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);\n}\n\nfloat noise(vec2 p) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n    f = f * f * (3.0 - 2.0 * f);\n    float a = hash(i);\n    float b = hash(i + vec2(1.0, 0.0));\n    float c = hash(i + vec2(0.0, 1.0));\n    float d = hash(i + vec2(1.0, 1.0));\n    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\nfloat fbm(vec2 p) {\n    float v = 0.0;\n    float a = 0.5;\n    for (int i = 0; i < 5; i++) {\n        v += a * noise(p);\n        p *= 2.0;\n        a *= 0.5;\n    }\n    return v;\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float n = fbm(uv * 5.0 + iTime * 0.3);\n    vec3 col = 0.5 + 0.5 * cos(n * 6.0 + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float v = 0.0;\n    for (int i = 0; i < 6; i++) {\n        float fi = float(i);\n        vec2 p = vec2(sin(iTime * 0.7 + fi * 1.3), cos(iTime * 0.5 + fi * 1.7)) * 0.4;\n        v += 0.02 / length(uv - p);\n    }\n    vec3 col = 0.5 + 0.5 * cos(v * 0.5 + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    vec3 col = vec3(0.0);\n    for (int i = 0; i < 8; i++) {\n        float t = iTime * 0.5 + float(i) * 0.4;\n        uv = abs(uv) - 0.5;\n        uv *= mat2(cos(t), -sin(t), sin(t), cos(t));\n        col += 0.02 / abs(uv.x) * (0.5 + 0.5 * cos(float(i) * 0.5 + vec3(0.0, 2.0, 4.0)));\n    }\n    fragColor = vec4(col, 1.0);\n}",
        "mat2 rot(float a) {\n    float c = cos(a), s = sin(a);\n    return mat2(c, -s, s, c);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= rot(iTime * 0.2);\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    a = mod(a, 6.2831 / 6.0) - 3.1415 / 6.0;\n    vec2 p = vec2(cos(a), sin(a)) * r;\n    float pat = sin(p.x * 15.0 + iTime * 2.0) * cos(p.y * 15.0 + iTime * 1.5);\n    vec3 col = 0.5 + 0.5 * cos(pat * 3.0 + r * 5.0 + iTime + vec3(0.0, 2.0, 4.0));\n    col *= smoothstep(0.8, 0.0, r);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    uv += 0.1 * vec2(sin(uv.y * 10.0 + iTime), cos(uv.x * 10.0 + iTime * 0.7));\n    float stripe = sin(uv.y * 40.0 + iTime * 2.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.9, 0.7), stripe);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float breath = 0.7 + 0.3 * sin(iTime * 1.5);\n    float core = 0.05 / (d + 0.05) * breath;\n    float halo = 0.02 / (d + 0.02) * (1.0 - breath) * 0.5;\n    vec3 col = core * vec3(1.0, 0.3, 0.1) + halo * vec3(0.3, 0.5, 1.0);\n    float rays = sin(atan(uv.y, uv.x) * 8.0 + iTime * 2.0) * 0.5 + 0.5;\n    col += rays * 0.02 / (d + 0.1) * vec3(1.0, 0.8, 0.3);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float bx = floor(uv.x * 4.0);\n    float by = floor(uv.y * 4.0);\n    float id = bx + by * 4.0;\n    vec3 col = 0.5 + 0.5 * cos(id * 0.7 + iTime * 1.5 + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = abs(uv.x) + abs(uv.y);\n    float wave = sin(d * 15.0 - iTime * 3.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), wave);\n    fragColor = vec4(col, 1.0);\n}",
        # ES 3.0: tanh bloom
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    vec3 col = vec3(0.0);\n    for (int i = 0; i < 8; i++) {\n        float fi = float(i);\n        float t = iTime * (0.3 + fi * 0.07);\n        vec2 p = 0.35 * vec2(cos(t + fi), sin(t * 1.4 + fi * 0.8));\n        col += (0.5 + 0.5 * cos(fi + iTime * 0.4 + vec3(0.0, 2.0, 4.0))) * 0.03 / (length(uv - p) + 0.005);\n    }\n    col = tanh(col * 0.7);\n    fragColor = vec4(col, 1.0);\n}",
        # ES 3.0: round mosaic
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    float sz = 8.0 + 4.0 * sin(iTime * 0.3);\n    vec2 qc = round(fragCoord / sz) * sz;\n    vec2 uv = qc / iResolution.xy;\n    float id = dot(floor(qc / sz), vec2(1.0, 37.0));\n    vec3 col = 0.5 + 0.5 * cos(id * 0.1 + iTime + vec3(0.0, 2.0, 4.0));\n    float d = length(fract(fragCoord / sz) - 0.5);\n    col *= smoothstep(0.5, 0.3, d);\n    fragColor = vec4(col, 1.0);\n}",
        # Buffer shaders (ping-pong)
        "float hash(vec2 p) {\n    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    if (iFrame == 0) {\n        float r = hash(fragCoord + vec2(42.0, 17.0));\n        float alive = step(0.62, r);\n        fragColor = vec4(alive, alive, alive, 1.0);\n        return;\n    }\n    vec2 px = 1.0 / iResolution.xy;\n    float sum = 0.0;\n    for (int x = -1; x <= 1; x++) {\n        for (int y = -1; y <= 1; y++) {\n            if (x == 0 && y == 0) continue;\n            sum += texture(iChannel0, uv + vec2(float(x), float(y)) * px).r;\n        }\n    }\n    vec2 prev = texture(iChannel0, uv).rg;\n    float self = prev.r;\n    float trail = prev.g;\n    float alive = 0.0;\n    if (self > 0.5) {\n        alive = (sum > 1.5 && sum < 3.5) ? 1.0 : 0.0;\n    } else {\n        alive = (sum > 2.5 && sum < 3.5) ? 1.0 : 0.0;\n    }\n    trail = max(trail * 0.95, alive);\n    vec3 col = mix(vec3(0.0, 0.02, 0.1) * trail, vec3(0.1, 0.8, 0.4), alive);\n    fragColor = vec4(alive, trail, 0.0, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec3 prev = texture(iChannel0, uv).rgb * 0.97;\n    float t = iTime * 0.8;\n    vec2 center = 0.5 + 0.3 * vec2(cos(t), sin(t * 1.3));\n    float d = length(uv - center);\n    float spot = smoothstep(0.04, 0.0, d);\n    vec3 spotCol = 0.5 + 0.5 * cos(iTime + vec3(0.0, 2.0, 4.0));\n    vec3 col = max(prev, spot * spotCol);\n    fragColor = vec4(col, 1.0);\n}",
        "void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    if (iFrame == 0) {\n        float u = 1.0;\n        float v = 0.0;\n        vec2 center = abs(uv - 0.5);\n        if (center.x < 0.05 && center.y < 0.05) v = 0.5;\n        fragColor = vec4(u, v, 0.0, 1.0);\n        return;\n    }\n    vec2 px = 1.0 / iResolution.xy;\n    vec2 val = texture(iChannel0, uv).rg;\n    float u = val.r;\n    float v = val.g;\n    float lu = -u;\n    float lv = -v;\n    for (int x = -1; x <= 1; x++) {\n        for (int y = -1; y <= 1; y++) {\n            float w = (x == 0 || y == 0) ? 0.2 : 0.05;\n            if (x == 0 && y == 0) continue;\n            vec2 s = texture(iChannel0, uv + vec2(float(x), float(y)) * px).rg;\n            lu += w * s.r;\n            lv += w * s.g;\n        }\n    }\n    float f = 0.037;\n    float k = 0.06;\n    float Du = 0.21;\n    float Dv = 0.105;\n    float dt = 0.9;\n    float uvv = u * v * v;\n    float nu = clamp(u + dt * (Du * lu - uvv + f * (1.0 - u)), 0.0, 1.0);\n    float nv = clamp(v + dt * (Dv * lv + uvv - (f + k) * v), 0.0, 1.0);\n    vec3 col = 0.5 + 0.5 * cos(nv * 6.0 + vec3(0.0, 2.0, 4.0));\n    col = mix(col, vec3(0.02), step(nv, 0.01));\n    fragColor = vec4(nu, nv, 0.0, 1.0);\n}",
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
