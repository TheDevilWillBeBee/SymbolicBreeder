import { SharedProgram } from '../types';

export const MOCK_SHARED_PROGRAMS: SharedProgram[] = [
  // ── Shader programs ──

  // Shader 1: Complex 4-gen tree with branching and merging
  // Gen 3 (final) ← Gen 2a, Gen 2b ← Gen 1a, Gen 1b, Gen 1c ← Gen 0a, Gen 0b, Gen 0c
  {
    id: 'shared-shader-1',
    programId: 'prog-s1-g3',
    sharerName: 'glsl_wizard',
    modality: 'shader',
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float a = atan(uv.y, uv.x);
    float spiral = sin(a * 5.0 + d * 20.0 - iTime * 3.0);
    float bloom = 0.04 / (d + 0.04);
    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.3, 0.5, 1.0) * bloom;
    col += 0.02 / (d + 0.02) * vec3(1.0, 0.7, 0.3);
    col = pow(col, vec3(0.85));
    fragColor = vec4(col, 1.0);
}`,
    llmModel: 'Several models',
    createdAt: '2026-03-14T10:30:00Z',
    lineage: [
      // Gen 0: three seed programs
      {
        id: 'prog-s1-g0a',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'create a colorful gradient shader',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s1-g0b',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    vec3 col = 0.05 / d * vec3(0.3, 0.5, 1.0);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'create a colorful gradient shader',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s1-g0c',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float v = sin(uv.x * 10.0 + iTime) * sin(uv.y * 10.0 + iTime);
    vec3 col = vec3(v * 0.5 + 0.5, 0.3, 0.7);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'create a colorful gradient shader',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      // Gen 1: three variants bred from pairs of Gen 0
      {
        id: 'prog-s1-g1a',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float bloom = 0.05 / (d + 0.05);
    vec3 col = bloom * vec3(0.4, 0.6, 1.0);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s1-g0a', 'prog-s1-g0b'],
        guidance: 'add a glowing center bloom effect',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-s1-g1b',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float a = atan(uv.y, uv.x);
    float d = length(uv);
    float wave = sin(a * 6.0 + d * 12.0 - iTime * 2.0);
    vec3 col = (wave * 0.5 + 0.5) * vec3(0.8, 0.3, 0.5);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s1-g0a', 'prog-s1-g0c'],
        guidance: 'add a glowing center bloom effect',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-s1-g1c',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    vec3 col = 0.03 / (d + 0.01) * vec3(1.0, 0.7, 0.3);
    col += 0.5 + 0.5 * cos(iTime + d * 8.0 + vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s1-g0b', 'prog-s1-g0c'],
        guidance: 'add a glowing center bloom effect',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      // Gen 2: two programs bred from Gen 1
      {
        id: 'prog-s1-g2a',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float a = atan(uv.y, uv.x);
    float spiral = sin(a * 5.0 + d * 15.0 - iTime * 2.5);
    float bloom = 0.04 / (d + 0.04);
    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.3, 0.5, 1.0) * bloom;
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 2,
        parentIds: ['prog-s1-g1a', 'prog-s1-g1b'],
        guidance: 'combine the bloom and spiral into one shader with depth',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'advanced',
      },
      {
        id: 'prog-s1-g2b',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float bloom = 0.03 / (d + 0.03);
    vec3 col = bloom * vec3(1.0, 0.6, 0.2);
    col += 0.02 / (d + 0.015) * vec3(0.2, 0.4, 1.0);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 2,
        parentIds: ['prog-s1-g1b', 'prog-s1-g1c'],
        guidance: 'combine the bloom and spiral into one shader with depth',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'advanced',
      },
      // Gen 3: final merged from both Gen 2
      {
        id: 'prog-s1-g3',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    float a = atan(uv.y, uv.x);
    float spiral = sin(a * 5.0 + d * 20.0 - iTime * 3.0);
    float bloom = 0.04 / (d + 0.04);
    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.3, 0.5, 1.0) * bloom;
    col += 0.02 / (d + 0.02) * vec3(1.0, 0.7, 0.3);
    col = pow(col, vec3(0.85));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 3,
        parentIds: ['prog-s1-g2a', 'prog-s1-g2b'],
        guidance: 'add spiral motion and warm secondary glow, polish the final look',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'advanced',
      },
    ],
  },

  // Shader 2: Two Gen 0 seeds merged into one (simple fan-in)
  {
    id: 'shared-shader-2',
    programId: 'prog-s2-final',
    sharerName: 'pixel_poet',
    modality: 'shader',
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy * 4.0;
    float v = sin(uv.x * 3.0 + iTime * 2.0);
    v += sin(uv.y * 3.0 + iTime * 1.5);
    v += sin((uv.x + uv.y) * 2.0 + iTime);
    v += sin(length(uv) * 3.0);
    v *= 0.5;
    vec3 col = 0.5 + 0.5 * cos(v + iTime * 0.5 + vec3(0.0, 2.0, 4.0));
    col = mix(col, vec3(1.0), smoothstep(0.95, 1.0, abs(sin(v * 3.14159))));
    fragColor = vec4(col, 1.0);
}`,
    llmModel: 'Several models',
    createdAt: '2026-03-13T15:45:00Z',
    lineage: [
      {
        id: 'prog-s2-g0a',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float v = sin(uv.x * 10.0 + iTime);
    vec3 col = vec3(v * 0.5 + 0.5);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'generate a simple wave pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s2-g0b',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'generate a simple wave pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s2-final',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy * 4.0;
    float v = sin(uv.x * 3.0 + iTime * 2.0);
    v += sin(uv.y * 3.0 + iTime * 1.5);
    v += sin((uv.x + uv.y) * 2.0 + iTime);
    v += sin(length(uv) * 3.0);
    v *= 0.5;
    vec3 col = 0.5 + 0.5 * cos(v + iTime * 0.5 + vec3(0.0, 2.0, 4.0));
    col = mix(col, vec3(1.0), smoothstep(0.95, 1.0, abs(sin(v * 3.14159))));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s2-g0a', 'prog-s2-g0b'],
        guidance: 'combine into a plasma interference pattern with bright edges',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
    ],
  },

  // Shader 3: Simple linear 2-gen
  {
    id: 'shared-shader-3',
    programId: 'prog-s3-final',
    sharerName: 'neon_dreams',
    modality: 'shader',
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float t = iTime * (0.4 + fi * 0.1);
        vec2 p = 0.3 * vec2(cos(t + fi), sin(t * 1.3 + fi * 0.7));
        float d = length(uv - p);
        col += (0.5 + 0.5 * cos(fi * 1.2 + iTime + vec3(0,2,4))) * 0.025 / (d + 0.005);
    }
    col = tanh(col * 0.6);
    fragColor = vec4(col, 1.0);
}`,
    llmModel: 'Mock',
    createdAt: '2026-03-15T08:20:00Z',
    lineage: [
      {
        id: 'prog-s3-g0',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    float d = length(uv);
    vec3 col = 0.03 / d * vec3(0.5, 0.3, 1.0);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'create a point light in the center',
        llmModel: 'Mock',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s3-final',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    vec3 col = vec3(0.0);
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float t = iTime * (0.4 + fi * 0.1);
        vec2 p = 0.3 * vec2(cos(t + fi), sin(t * 1.3 + fi * 0.7));
        float d = length(uv - p);
        col += (0.5 + 0.5 * cos(fi * 1.2 + iTime + vec3(0,2,4))) * 0.025 / (d + 0.005);
    }
    col = tanh(col * 0.6);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s3-g0'],
        guidance: 'make it more psychedelic with multiple orbiting lights',
        llmModel: 'Mock',
        contextProfile: 'simple',
      },
    ],
  },

  // Shader 4: 3-gen with multiple children per gen and model switch mid-evolution
  {
    id: 'shared-shader-4',
    programId: 'prog-s4-g2',
    sharerName: 'fractal_fox',
    modality: 'shader',
    code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 5.0 + 2.0 * sin(iTime * 0.3);
    float c = mod(floor(uv.x) + floor(uv.y), 2.0);
    vec2 fuv = fract(uv) - 0.5;
    float d = length(fuv);
    float circle = smoothstep(0.35, 0.3, d);
    vec3 col = mix(vec3(0.05, 0.05, 0.15), vec3(0.9, 0.4, 0.1), c * circle);
    col += 0.1 * sin(iTime + uv.x * 3.0 + uv.y * 3.0);
    fragColor = vec4(col, 1.0);
}`,
    llmModel: 'Several models',
    createdAt: '2026-03-12T20:10:00Z',
    lineage: [
      {
        id: 'prog-s4-g0a',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 5.0;
    float c = mod(floor(uv.x) + floor(uv.y), 2.0);
    vec3 col = mix(vec3(0.1), vec3(0.9, 0.8, 0.3), c);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'generate a tiled geometric pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s4-g0b',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    float d = length(uv - 0.5);
    vec3 col = smoothstep(0.3, 0.0, d) * vec3(0.9, 0.4, 0.1);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
        guidance: 'generate a tiled geometric pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-s4-g1a',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 5.0;
    float c = mod(floor(uv.x) + floor(uv.y), 2.0);
    vec2 fuv = fract(uv) - 0.5;
    float d = length(fuv);
    float circle = smoothstep(0.35, 0.3, d);
    vec3 col = mix(vec3(0.1), vec3(0.9, 0.4, 0.1), c * circle);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s4-g0a', 'prog-s4-g0b'],
        guidance: 'add circles inside each tile with warm colors',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-s4-g1b',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 4.0;
    float c = mod(floor(uv.x) + floor(uv.y), 2.0);
    vec3 col = mix(vec3(0.05, 0.05, 0.15), vec3(0.6, 0.3, 0.8), c);
    col += 0.15 * sin(iTime + uv.xyx * 2.0 + vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 1,
        parentIds: ['prog-s4-g0a', 'prog-s4-g0b'],
        guidance: 'add circles inside each tile with warm colors',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-s4-g2',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;
    uv *= 5.0 + 2.0 * sin(iTime * 0.3);
    float c = mod(floor(uv.x) + floor(uv.y), 2.0);
    vec2 fuv = fract(uv) - 0.5;
    float d = length(fuv);
    float circle = smoothstep(0.35, 0.3, d);
    vec3 col = mix(vec3(0.05, 0.05, 0.15), vec3(0.9, 0.4, 0.1), c * circle);
    col += 0.1 * sin(iTime + uv.x * 3.0 + uv.y * 3.0);
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 2,
        parentIds: ['prog-s4-g1a', 'prog-s4-g1b'],
        guidance: 'increase fractal detail and add breathing animation',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'advanced',
      },
    ],
  },

  // ── Strudel programs ──

  // Strudel 1: Simple linear 2-gen
  {
    id: 'shared-strudel-1',
    programId: 'prog-t1-final',
    sharerName: 'beat_maker',
    modality: 'strudel',
    code: `setcpm(120/4)
var scale = "D:minor"
$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909").gain(0.7)._scope()
$: note("<d2 a2 bb2 g2>").s("sawtooth").lpf(600).gain(0.6).scale(scale)._pianoroll()
$: n("0 2 4 <[6,8] [7,9]>").scale("D4:minor").s("gm_epiano1").room(0.5).delay(0.25)._pianoroll()`,
    llmModel: 'Mock',
    createdAt: '2026-03-14T12:00:00Z',
    lineage: [
      {
        id: 'prog-t1-g0',
        code: `setcpm(120/4)
$: s("bd*4").bank("RolandTR909")._scope()
$: note("<d2 a2>").s("sawtooth").lpf(500)._pianoroll()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a minimal techno beat with bass',
        llmModel: 'Mock',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-t1-final',
        code: `setcpm(120/4)
var scale = "D:minor"
$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909").gain(0.7)._scope()
$: note("<d2 a2 bb2 g2>").s("sawtooth").lpf(600).gain(0.6).scale(scale)._pianoroll()
$: n("0 2 4 <[6,8] [7,9]>").scale("D4:minor").s("gm_epiano1").room(0.5).delay(0.25)._pianoroll()`,
        modality: 'strudel',
        generation: 1,
        parentIds: ['prog-t1-g0'],
        guidance: 'add hi-hats and an electric piano melody',
        llmModel: 'Mock',
        contextProfile: 'intermediate',
      },
    ],
  },

  // Strudel 2: Two Gen 0 seeds merged
  {
    id: 'shared-strudel-2',
    programId: 'prog-t2-final',
    sharerName: 'ambient_alice',
    modality: 'strudel',
    code: `setcpm(70/4)
var scale = "C:minor"
$: note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()
$: s("bd ~ sd ~").room(0.3)._scope()
$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()`,
    llmModel: 'Several models',
    createdAt: '2026-03-13T18:30:00Z',
    lineage: [
      {
        id: 'prog-t2-g0a',
        code: `setcpm(80/4)
$: note("c3 eb3 g3 bb2").s("sine").room(0.5)._pianoroll()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a mellow chord progression',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-t2-g0b',
        code: `setcpm(60/4)
$: s("bd ~ sd ~").room(0.3)._scope()
$: s("hh*4").gain(0.4)._scope()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a mellow chord progression',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-t2-final',
        code: `setcpm(70/4)
var scale = "C:minor"
$: note("c3 [eb3 g3] bb2 [f3 ab3]").s("triangle").room(0.8).delay(0.5).delayfeedback(0.6)._pianoroll()
$: s("bd ~ sd ~").room(0.3)._scope()
$: s("hh*4").gain(perlin.range(0.2, 0.6)).pan(rand)._scope()`,
        modality: 'strudel',
        generation: 1,
        parentIds: ['prog-t2-g0a', 'prog-t2-g0b'],
        guidance: 'add reverb and delay, make it dreamy and ambient',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'advanced',
      },
    ],
  },

  // Strudel 3: Complex 3-gen with branching — 3 Gen 0 seeds, 2 Gen 1, 1 Gen 2
  {
    id: 'shared-strudel-3',
    programId: 'prog-t3-g2',
    sharerName: 'synth_surfer',
    modality: 'strudel',
    code: `setcpm(140/4)
var scale = "E:minor"
$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4")._scope()
$: s("[~ <~ cp:1>]*2")._scope()
$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()`,
    llmModel: 'Several models',
    createdAt: '2026-03-15T09:15:00Z',
    lineage: [
      {
        id: 'prog-t3-g0a',
        code: `setcpm(130/4)
$: s("bd*4")._scope()
$: note("<e2 b2>").s("sawtooth").lpf(400)._pianoroll()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a driving bass and kick pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-t3-g0b',
        code: `setcpm(130/4)
$: n("0 2 4 7").scale("E4:minor").s("gm_epiano1")._pianoroll()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a driving bass and kick pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-t3-g0c',
        code: `setcpm(135/4)
$: s("[~ cp]*2")._scope()
$: s("hh*8").gain(0.3)._scope()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a driving bass and kick pattern',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-t3-g1a',
        code: `setcpm(135/4)
var scale = "E:minor"
$: n("<4 0 5 0>*4").scale(scale).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4")._scope()
$: note("<e1 b1>").s("triangle").lpf(350).gain(0.6)._pianoroll()`,
        modality: 'strudel',
        generation: 1,
        parentIds: ['prog-t3-g0a', 'prog-t3-g0b'],
        guidance: 'add arpeggio pattern and a bass line',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-t3-g1b',
        code: `setcpm(135/4)
$: s("bd:1!4")._scope()
$: s("[~ <~ cp:1>]*2")._scope()
$: s("hh*8").gain("[0.3 0.5]*4")._scope()`,
        modality: 'strudel',
        generation: 1,
        parentIds: ['prog-t3-g0a', 'prog-t3-g0c'],
        guidance: 'add arpeggio pattern and a bass line',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-t3-g2',
        code: `setcpm(140/4)
var scale = "E:minor"
$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4")._scope()
$: s("[~ <~ cp:1>]*2")._scope()
$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()`,
        modality: 'strudel',
        generation: 2,
        parentIds: ['prog-t3-g1a', 'prog-t3-g1b'],
        guidance: 'merge the melodic and rhythmic branches, extend the chord progression',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'advanced',
      },
    ],
  },

  // Strudel 4: Simple 2-gen with guidance on Gen 0
  {
    id: 'shared-strudel-4',
    programId: 'prog-t4-final',
    sharerName: 'rhythm_queen',
    modality: 'strudel',
    code: `setcpm(100/4)
var scale = "G:minor"
$: s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)._scope()
$: s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)._scope()
$: s("hh*8").gain("[0.4 0.6]*4")._scope()
$: n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale("G3:minor").sound("gm_synth_strings_1").attack(0.4).sustain(3).gain(0.4)._pianoroll()`,
    llmModel: 'Mock',
    createdAt: '2026-03-11T14:45:00Z',
    lineage: [
      {
        id: 'prog-t4-g0',
        code: `setcpm(95/4)
$: s("bd*4, sd*2").bank("Linn9000")._scope()
$: s("hh*8").gain(0.5)._scope()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
        guidance: 'create a drum pattern with Linn drum machine',
        llmModel: 'Mock',
        contextProfile: 'simple',
      },
      {
        id: 'prog-t4-final',
        code: `setcpm(100/4)
var scale = "G:minor"
$: s("bd:4(<3 5>,8)").bank("Linn9000").gain(0.8)._scope()
$: s("sd:3").struct("<[~ x]!8 [~ x ~ [x x]]>").gain(0.7)._scope()
$: s("hh*8").gain("[0.4 0.6]*4")._scope()
$: n(irand(10).seg(0.5).add("[0 3]/4").add("0, 2, 4")).scale("G3:minor").sound("gm_synth_strings_1").attack(0.4).sustain(3).gain(0.4)._pianoroll()`,
        modality: 'strudel',
        generation: 1,
        parentIds: ['prog-t4-g0'],
        guidance: 'add euclidean rhythms and a generative string pad',
        llmModel: 'Mock',
        contextProfile: 'simple',
      },
    ],
  },

  // ── SVG programs ──

  // SVG 1: Geometric logo — 3-gen evolution
  {
    id: 'shared-svg-1',
    programId: 'prog-svg1-g2',
    sharerName: 'vector_artist',
    modality: 'svg',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <style>
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes pulse { 0%, 100% { r: 15; } 50% { r: 20; } }
    .outer-hex { animation: spin 20s linear infinite; transform-origin: 100px 100px; }
    .inner-hex { animation: spin 15s linear infinite reverse; transform-origin: 100px 100px; }
    .core { animation: pulse 3s ease-in-out infinite; }
  </style>
  <defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#667eea"/>
      <stop offset="100%" stop-color="#764ba2"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="#0a0a1a"/>
  <g transform="translate(100,100)">
    <polygon class="outer-hex" points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32" fill="url(#g1)" opacity="0.9"/>
    <polygon class="inner-hex" points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" fill="#0a0a1a"/>
    <circle class="core" cx="0" cy="0" r="15" fill="#667eea"/>
    <circle cx="0" cy="0" r="8" fill="#0a0a1a"/>
  </g>
</svg>`,
    llmModel: 'anthropic/claude-sonnet-4-20250514',
    createdAt: '2026-03-15T14:20:00Z',
    lineage: [
      {
        id: 'prog-svg1-g0a',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1a2e"/><g transform="translate(100,100)"><polygon points="0,-60 52,-30 52,30 0,60 -52,30 -52,-30" fill="none" stroke="#e94560" stroke-width="3"/><circle cx="0" cy="0" r="15" fill="#e94560"/></g></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a geometric tech logo',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg1-g0b',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#0a0a1a"/><g transform="translate(100,100)"><rect x="-45" y="-45" width="90" height="90" rx="10" fill="#667eea" opacity="0.8"/><circle cx="0" cy="0" r="20" fill="#0a0a1a"/></g></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a geometric tech logo',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg1-g1',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs><rect width="200" height="200" fill="#0a0a1a"/><g transform="translate(100,100)"><polygon points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32" fill="url(#g1)"/><circle cx="0" cy="0" r="20" fill="#0a0a1a"/></g></svg>`,
        modality: 'svg',
        generation: 1,
        parentIds: ['prog-svg1-g0a', 'prog-svg1-g0b'],
        guidance: 'merge hexagon shape with gradient fill, add depth',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-svg1-g2',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#667eea"/><stop offset="100%" stop-color="#764ba2"/></linearGradient></defs><rect width="200" height="200" fill="#0a0a1a"/><g transform="translate(100,100)"><polygon points="0,-65 56,-32 56,32 0,65 -56,32 -56,-32" fill="url(#g1)" opacity="0.9"/><polygon points="0,-40 35,-20 35,20 0,40 -35,20 -35,-20" fill="#0a0a1a"/><circle cx="0" cy="0" r="15" fill="#667eea"/><circle cx="0" cy="0" r="8" fill="#0a0a1a"/></g></svg>`,
        modality: 'svg',
        generation: 2,
        parentIds: ['prog-svg1-g1'],
        guidance: 'add inner hexagon cutout and nested circles for more depth',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
    ],
  },

  // SVG 2: Abstract color mark — 2-gen evolution
  {
    id: 'shared-svg-2',
    programId: 'prog-svg2-g1',
    sharerName: 'logo_lab',
    modality: 'svg',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#fff"/>
  <g transform="translate(100,100)">
    <circle cx="-22" cy="-15" r="35" fill="#e74c3c" opacity="0.75">
      <animate attributeName="cx" values="-22;-18;-22" dur="4s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="-15;-18;-15" dur="4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="22" cy="-15" r="35" fill="#3498db" opacity="0.75">
      <animate attributeName="cx" values="22;18;22" dur="4s" repeatCount="indefinite"/>
      <animate attributeName="cy" values="-15;-18;-15" dur="4s" repeatCount="indefinite"/>
    </circle>
    <circle cx="0" cy="18" r="35" fill="#f1c40f" opacity="0.75">
      <animate attributeName="cy" values="18;22;18" dur="4s" repeatCount="indefinite"/>
    </circle>
  </g>
</svg>`,
    llmModel: 'openai/gpt-4o',
    createdAt: '2026-03-16T09:45:00Z',
    lineage: [
      {
        id: 'prog-svg2-g0a',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#ecf0f1"/><circle cx="100" cy="100" r="50" fill="#e74c3c" opacity="0.8"/><circle cx="100" cy="100" r="30" fill="#3498db" opacity="0.8"/></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a colorful abstract logo',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg2-g0b',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><g transform="translate(100,100)"><circle cx="-20" cy="0" r="30" fill="#f1c40f" opacity="0.7"/><circle cx="20" cy="0" r="30" fill="#e74c3c" opacity="0.7"/></g></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a colorful abstract logo',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg2-g1',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><g transform="translate(100,100)"><circle cx="-22" cy="-15" r="35" fill="#e74c3c" opacity="0.75"/><circle cx="22" cy="-15" r="35" fill="#3498db" opacity="0.75"/><circle cx="0" cy="18" r="35" fill="#f1c40f" opacity="0.75"/></g></svg>`,
        modality: 'svg',
        generation: 1,
        parentIds: ['prog-svg2-g0a', 'prog-svg2-g0b'],
        guidance: 'use three overlapping circles in a triadic arrangement',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'intermediate',
      },
    ],
  },

  // SVG 3: Nature motif — 3-gen with crossover
  {
    id: 'shared-svg-3',
    programId: 'prog-svg3-g2',
    sharerName: 'organic_forms',
    modality: 'svg',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2c3e50"/>
      <stop offset="100%" stop-color="#3498db"/>
    </linearGradient>
    <radialGradient id="sun" cx="50%" cy="50%">
      <stop offset="0%" stop-color="#f9ca24"/>
      <stop offset="100%" stop-color="#f0932b"/>
    </radialGradient>
  </defs>
  <rect width="200" height="200" fill="url(#sky)"/>
  <circle cx="155" cy="40" r="22" fill="url(#sun)"/>
  <g transform="translate(100,115)">
    <path d="M-55,0 C-55,-60 55,-60 55,0" fill="#2ecc71"/>
    <path d="M-35,0 C-35,-42 35,-42 35,0" fill="#27ae60"/>
    <rect x="-5" y="0" width="10" height="30" fill="#8b6914" rx="2"/>
  </g>
  <path d="M-10,170 Q50,155 100,170 T210,170" fill="#27ae60" opacity="0.3"/>
</svg>`,
    llmModel: 'anthropic/claude-sonnet-4-20250514',
    createdAt: '2026-03-17T16:00:00Z',
    lineage: [
      {
        id: 'prog-svg3-g0a',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#87ceeb"/><circle cx="150" cy="40" r="20" fill="#f1c40f"/><g transform="translate(100,130)"><path d="M-40,0 C-40,-50 40,-50 40,0" fill="#2ecc71"/><rect x="-4" y="0" width="8" height="25" fill="#8b6914"/></g></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a nature-themed logo with a tree',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg3-g0b',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#3498db"/></linearGradient></defs><rect width="200" height="200" fill="url(#sky)"/><circle cx="100" cy="100" r="40" fill="#f39c12" opacity="0.8"/></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a nature-themed logo with a tree',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg3-g1',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#3498db"/></linearGradient></defs><rect width="200" height="200" fill="url(#sky)"/><circle cx="155" cy="40" r="20" fill="#f1c40f" opacity="0.9"/><g transform="translate(100,120)"><path d="M-50,0 C-50,-55 50,-55 50,0" fill="#2ecc71"/><rect x="-5" y="0" width="10" height="28" fill="#8b6914"/></g></svg>`,
        modality: 'svg',
        generation: 1,
        parentIds: ['prog-svg3-g0a', 'prog-svg3-g0b'],
        guidance: 'combine gradient sky with tree, position sun in corner',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
      {
        id: 'prog-svg3-g2',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c3e50"/><stop offset="100%" stop-color="#3498db"/></linearGradient><radialGradient id="sun" cx="50%" cy="50%"><stop offset="0%" stop-color="#f9ca24"/><stop offset="100%" stop-color="#f0932b"/></radialGradient></defs><rect width="200" height="200" fill="url(#sky)"/><circle cx="155" cy="40" r="22" fill="url(#sun)"/><g transform="translate(100,115)"><path d="M-55,0 C-55,-60 55,-60 55,0" fill="#2ecc71"/><path d="M-35,0 C-35,-42 35,-42 35,0" fill="#27ae60"/><rect x="-5" y="0" width="10" height="30" fill="#8b6914" rx="2"/></g><path d="M-10,170 Q50,155 100,170 T210,170" fill="#27ae60" opacity="0.3"/></svg>`,
        modality: 'svg',
        generation: 2,
        parentIds: ['prog-svg3-g1'],
        guidance: 'add radial sun gradient, layered canopy, ground line',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
      },
    ],
  },

  // SVG 4: Typographic logo — 2-gen evolution
  {
    id: 'shared-svg-4',
    programId: 'prog-svg4-g1',
    sharerName: 'type_smith',
    modality: 'svg',
    code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6c5ce7"/>
      <stop offset="100%" stop-color="#a29bfe"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="#0a0a0a"/>
  <text x="100" y="112" text-anchor="middle" font-family="sans-serif" font-size="68" font-weight="bold" fill="url(#tg)">SB</text>
  <line x1="35" y1="135" x2="165" y2="135" stroke="#6c5ce7" stroke-width="2"/>
  <text x="100" y="155" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#a29bfe" letter-spacing="8">BREEDER</text>
</svg>`,
    llmModel: 'Mock',
    createdAt: '2026-03-18T11:15:00Z',
    lineage: [
      {
        id: 'prog-svg4-g0',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#111"/><text x="100" y="115" text-anchor="middle" font-family="sans-serif" font-size="60" font-weight="bold" fill="#6c5ce7">SB</text></svg>`,
        modality: 'svg',
        generation: 0,
        parentIds: [],
        guidance: 'create a typographic logo with initials',
        llmModel: 'Mock',
        contextProfile: 'simple',
      },
      {
        id: 'prog-svg4-g1',
        code: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#6c5ce7"/><stop offset="100%" stop-color="#a29bfe"/></linearGradient></defs><rect width="200" height="200" fill="#0a0a0a"/><text x="100" y="112" text-anchor="middle" font-family="sans-serif" font-size="68" font-weight="bold" fill="url(#tg)">SB</text><line x1="35" y1="135" x2="165" y2="135" stroke="#6c5ce7" stroke-width="2"/><text x="100" y="155" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#a29bfe" letter-spacing="8">BREEDER</text></svg>`,
        modality: 'svg',
        generation: 1,
        parentIds: ['prog-svg4-g0'],
        guidance: 'add gradient fill, subtitle text, and a divider line',
        llmModel: 'Mock',
        contextProfile: 'intermediate',
      },
    ],
  },
];
