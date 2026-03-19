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

  // ── OpenSCAD programs ──

  // OpenSCAD 1: Simple 2-gen — crystal cluster evolved into a garden
  {
    id: 'shared-openscad-1',
    programId: 'prog-o1-final',
    sharerName: 'cad_sculptor',
    modality: 'openscad',
    code: `$fn = 48;
// Crystal garden on a pedestal
color("DarkSlateGray") cylinder(h=2, r=25, center=true);

for (i = [0:11]) {
    a = i * 137.508;
    r = 3 + i * 1.5;
    h = 8 + (i % 5) * 6;
    translate([r * cos(a), r * sin(a), 1])
      color([0.5 + i*0.04, 0.7, 1 - i*0.03])
        cylinder(h=h, r1=2.5 - i*0.1, r2=0.3, $fn=6);
}

color("Gold") translate([0, 0, 1])
  sphere(r=4);`,
    llmModel: 'Mock',
    createdAt: '2026-03-16T11:00:00Z',
    lineage: [
      {
        id: 'prog-o1-g0',
        code: `$fn = 6;
for (i = [0:8]) {
    a = i * 137.508;
    r = 3 + i * 1.2;
    h = 8 + (i % 4) * 5;
    translate([r * cos(a), r * sin(a), 0])
      color([0.6 + i*0.04, 0.8, 1])
        cylinder(h=h, r1=2.5, r2=0.5);
}`,
        modality: 'openscad',
        generation: 0,
        parentIds: [],
        guidance: 'create a crystal cluster',
        llmModel: 'Mock',
        contextProfile: 'simple',
      },
      {
        id: 'prog-o1-final',
        code: `$fn = 48;
color("DarkSlateGray") cylinder(h=2, r=25, center=true);

for (i = [0:11]) {
    a = i * 137.508;
    r = 3 + i * 1.5;
    h = 8 + (i % 5) * 6;
    translate([r * cos(a), r * sin(a), 1])
      color([0.5 + i*0.04, 0.7, 1 - i*0.03])
        cylinder(h=h, r1=2.5 - i*0.1, r2=0.3, $fn=6);
}

color("Gold") translate([0, 0, 1])
  sphere(r=4);`,
        modality: 'openscad',
        generation: 1,
        parentIds: ['prog-o1-g0'],
        guidance: 'add a pedestal and golden centerpiece, refine the growth pattern',
        llmModel: 'Mock',
        contextProfile: 'intermediate',
      },
    ],
  },

  // OpenSCAD 2: Architectural arch evolved from a simple column
  {
    id: 'shared-openscad-2',
    programId: 'prog-o2-final',
    sharerName: 'arch_dreamer',
    modality: 'openscad',
    code: `$fn = 48;

// Base platform
color("DarkSlateGray") cube([40, 10, 3], center=true);

// Twin columns
for (x = [-14, 14]) {
    translate([x, 0, 3])
      color("White") cylinder(h=30, r=2.5);
    translate([x, 0, 33])
      color("Gold") cylinder(h=2, r1=2.5, r2=3.5);
}

// Arch
color("Coral")
  translate([0, 0, 35])
    rotate([90, 0, 0])
      difference() {
          cylinder(h=10, r=16, center=true);
          cylinder(h=12, r=13, center=true);
          translate([0, -20, 0]) cube([40, 40, 14], center=true);
      }`,
    llmModel: 'Several models',
    createdAt: '2026-03-15T16:20:00Z',
    lineage: [
      {
        id: 'prog-o2-g0a',
        code: `$fn = 48;
color("White") cylinder(h=25, r=3);
color("Gold") translate([0, 0, 25])
  cylinder(h=2, r1=3, r2=5);`,
        modality: 'openscad',
        generation: 0,
        parentIds: [],
        guidance: 'create a classical column',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-o2-g0b',
        code: `$fn = 48;
color("Coral")
  rotate([90, 0, 0])
    difference() {
        cylinder(h=4, r=12);
        cylinder(h=6, r=9, center=true);
        translate([0, -15, 0]) cube([30, 30, 8], center=true);
    }`,
        modality: 'openscad',
        generation: 0,
        parentIds: [],
        guidance: 'create a classical column',
        llmModel: 'openai/gpt-4o',
        contextProfile: 'simple',
      },
      {
        id: 'prog-o2-final',
        code: `$fn = 48;

color("DarkSlateGray") cube([40, 10, 3], center=true);

for (x = [-14, 14]) {
    translate([x, 0, 3])
      color("White") cylinder(h=30, r=2.5);
    translate([x, 0, 33])
      color("Gold") cylinder(h=2, r1=2.5, r2=3.5);
}

color("Coral")
  translate([0, 0, 35])
    rotate([90, 0, 0])
      difference() {
          cylinder(h=10, r=16, center=true);
          cylinder(h=12, r=13, center=true);
          translate([0, -20, 0]) cube([40, 40, 14], center=true);
      }`,
        modality: 'openscad',
        generation: 1,
        parentIds: ['prog-o2-g0a', 'prog-o2-g0b'],
        guidance: 'combine column and arch into a full architectural element with a base',
        llmModel: 'anthropic/claude-sonnet-4-20250514',
        contextProfile: 'intermediate',
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
];
