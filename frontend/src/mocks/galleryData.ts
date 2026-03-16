import { SharedProgram } from '../types';

export const MOCK_SHARED_PROGRAMS: SharedProgram[] = [
  // ── Shader programs ──
  {
    id: 'shared-shader-1',
    programId: 'prog-s1-final',
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
    llmModel: 'claude-sonnet-4-20250514',
    createdAt: '2026-03-14T10:30:00Z',
    lineage: [
      {
        id: 'prog-s1-g0',
        code: `void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 col = 0.5 + 0.5 * cos(iTime + uv.xyx + vec3(0,2,4));
    fragColor = vec4(col, 1.0);
}`,
        modality: 'shader',
        generation: 0,
        parentIds: [],
      },
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
        parentIds: ['prog-s1-g0'],
      },
      {
        id: 'prog-s1-final',
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
        generation: 2,
        parentIds: ['prog-s1-g1a'],
      },
    ],
  },
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
    llmModel: 'gpt-4o',
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
      },
    ],
  },
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
    llmModel: 'claude-sonnet-4-20250514',
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
      },
    ],
  },
  {
    id: 'shared-shader-4',
    programId: 'prog-s4-final',
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
    llmModel: 'gemini-2.0-flash',
    createdAt: '2026-03-12T20:10:00Z',
    lineage: [
      {
        id: 'prog-s4-g0',
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
      },
      {
        id: 'prog-s4-final',
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
        generation: 1,
        parentIds: ['prog-s4-g0'],
      },
    ],
  },

  // ── Strudel programs ──
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
    llmModel: 'claude-sonnet-4-20250514',
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
      },
    ],
  },
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
    llmModel: 'gpt-4o',
    createdAt: '2026-03-13T18:30:00Z',
    lineage: [
      {
        id: 'prog-t2-g0a',
        code: `setcpm(80/4)
$: note("c3 eb3 g3 bb2").s("sine").room(0.5)._pianoroll()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
      },
      {
        id: 'prog-t2-g0b',
        code: `setcpm(60/4)
$: s("bd ~ sd ~").room(0.3)._scope()
$: s("hh*4").gain(0.4)._scope()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
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
      },
    ],
  },
  {
    id: 'shared-strudel-3',
    programId: 'prog-t3-final',
    sharerName: 'synth_surfer',
    modality: 'strudel',
    code: `setcpm(140/4)
var scale = "E:minor"
$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4")._scope()
$: s("[~ <~ cp:1>]*2")._scope()
$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()`,
    llmModel: 'claude-sonnet-4-20250514',
    createdAt: '2026-03-15T09:15:00Z',
    lineage: [
      {
        id: 'prog-t3-g0',
        code: `setcpm(130/4)
$: s("bd*4")._scope()
$: note("<e2 b2>").s("sawtooth").lpf(400)._pianoroll()`,
        modality: 'strudel',
        generation: 0,
        parentIds: [],
      },
      {
        id: 'prog-t3-g1',
        code: `setcpm(135/4)
var scale = "E:minor"
$: n("<4 0 5 0>*4").scale(scale).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4")._scope()
$: note("<e1 b1>").s("triangle").lpf(350).gain(0.6)._pianoroll()`,
        modality: 'strudel',
        generation: 1,
        parentIds: ['prog-t3-g0'],
      },
      {
        id: 'prog-t3-final',
        code: `setcpm(140/4)
var scale = "E:minor"
$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()
$: s("bd:1!4")._scope()
$: s("[~ <~ cp:1>]*2")._scope()
$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()`,
        modality: 'strudel',
        generation: 2,
        parentIds: ['prog-t3-g1'],
      },
    ],
  },
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
    llmModel: 'gemini-2.0-flash',
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
      },
    ],
  },
];
