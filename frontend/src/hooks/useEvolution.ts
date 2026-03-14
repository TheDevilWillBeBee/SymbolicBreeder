import { useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { api, setApiLLMConfig } from '../api/client';
import { Program } from '../types';

// ── Mock pools (per modality) ──

const MOCK_STRUDEL_SEEDS = [
  'setcpm(120/4)\nvar scale = "D:minor"\n$: s("bd*4, [~ sd]*2, hh*8").bank("RolandTR909")._scope()\n$: note("<d2 a2 bb2 g2>").s("sawtooth").lpf(600).gain(0.6).scale(scale)._pianoroll()',
  'setcpm(130/4)\nvar scale = "C:minor"\n$: s("bd [~ bd] sd [~ sd:2], hh*8").bank("RolandTR808")._scope()\n$: note("<c2 eb2 f2 g2>*2").s("sawtooth").lpf(500).gain(0.5)._pianoroll()\n$: n("0 2 4 <[6,8] [7,9]>").scale("C4:minor").s("gm_epiano1").room(0.5)._pianoroll()',
  'setcpm(90/4)\nvar scale = "A:minor"\n$: s("bd sd:1 [bd bd] sd:2, hh*8").gain(0.8)._scope()\n$: note("<a1 e2 f2 g2>").s("triangle").lpf(400).gain(0.7)._pianoroll()\n$: n("0 [2 4] <3 5> [~ <4 1>]").scale("A4:minor").s("gm_xylophone").room(0.4).delay(0.125)._pianoroll()',
  'setcpm(100/4)\n$: s("bd*4").duck("2:3").duckdepth(0.8).duckattack(0.2)._scope()\n$: s("[~ <~ cp:1>]*2")._scope()\n$: s("hh*8").gain("[0.5 0.3]*4")._scope()\n$: note("<c2 c2 eb2 f2>").s("sawtooth").lpf(400).gain(0.6)._pianoroll()',
  'setcpm(140/4)\nvar scale = "E:minor"\n$: n("<4 0 <5 9> 0>*8").scale(scale).s("sawtooth").o(2)._pianoroll()\n$: s("bd:1!4")._scope()\n$: s("[~ <~ cp:1>]*2")._scope()\n$: note("<e1 b1 c2 d2>").s("triangle").lpf(300).gain(0.7)._pianoroll()',
  'setcpm(85/4)\nvar scale = "F:major"\n$: s("bd ~ sd ~, hh*4").bank("RolandTR707")._scope()\n$: note("<f2 c2 bb1 c2>").s("gm_acoustic_bass").gain(0.8)._pianoroll()\n$: chord("<Fmaj7 Am7 Bbmaj7 C7>").voicing().s("gm_epiano1").room(0.5)._pianoroll()',
];

const MOCK_SHADER_SEEDS = [
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 center = vec2(0.5);\n    float d = length(uv - center);\n    float r = 0.25 + 0.1 * sin(iTime);\n    float glow = smoothstep(r, r - 0.05, d);\n    vec3 col = glow * vec3(0.2, 0.6, 1.0);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float t = uv.x + iTime * 0.3;\n    vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float wave = sin(d * 30.0 - iTime * 4.0);\n    vec3 col = vec3(wave * 0.5 + 0.5) * vec3(0.9, 0.3, 0.6);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x) + iTime * 0.5;\n    float r = length(uv);\n    float pat = sin(a * 6.0) * cos(r * 20.0 + iTime * 2.0);\n    vec3 col = vec3(pat * 0.5 + 0.5, r, 0.8 - r);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy * 4.0;\n    float v = sin(uv.x * 3.0 + iTime * 2.0);\n    v += sin(uv.y * 3.0 + iTime * 1.5);\n    v += sin((uv.x + uv.y) * 2.0 + iTime);\n    v += sin(length(uv) * 3.0);\n    vec3 col = 0.5 + 0.5 * cos(v + iTime + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= 5.0 + sin(iTime) * 2.0;\n    float c = mod(floor(uv.x) + floor(uv.y), 2.0);\n    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(1.0, 0.8, 0.3), c);\n    fragColor = vec4(col, 1.0);\n}',
];

const MOCK_STRUDEL_POOL = [
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

];

const MOCK_SHADER_POOL = [
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    float spiral = sin(a * 3.0 + r * 20.0 - iTime * 3.0);\n    float brightness = 0.03 / (r + 0.03);\n    vec3 col = (spiral * 0.5 + 0.5) * vec3(0.4, 0.6, 1.0) * brightness;\n    col += 0.01 / (r + 0.01) * vec3(1.0, 0.9, 0.7);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float bx = floor(uv.x * 4.0);\n    float by = floor(uv.y * 4.0);\n    float id = bx + by * 4.0;\n    vec3 col = 0.5 + 0.5 * cos(id * 0.7 + iTime * 1.5 + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = abs(uv.x) + abs(uv.y);\n    float wave = sin(d * 15.0 - iTime * 3.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), wave);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float breath = 0.7 + 0.3 * sin(iTime * 1.5);\n    float core = 0.05 / (d + 0.05) * breath;\n    vec3 col = core * vec3(1.0, 0.3, 0.1);\n    float rays = sin(atan(uv.y, uv.x) * 8.0 + iTime * 2.0) * 0.5 + 0.5;\n    col += rays * 0.02 / (d + 0.1) * vec3(1.0, 0.8, 0.3);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    uv += 0.1 * vec2(sin(uv.y * 10.0 + iTime), cos(uv.x * 10.0 + iTime * 0.7));\n    float stripe = sin(uv.y * 40.0 + iTime * 2.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.0, 0.1, 0.3), vec3(0.0, 0.9, 0.7), stripe);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    vec3 col = vec3(0.0);\n    for (int i = 0; i < 6; i++) {\n        float fi = float(i);\n        vec2 p = vec2(sin(iTime * 0.7 + fi * 1.3), cos(iTime * 0.5 + fi * 1.7)) * 0.4;\n        col += 0.02 / length(uv - p) * (0.5 + 0.5 * cos(fi * 0.8 + iTime + vec3(0.0, 2.0, 4.0)));\n    }\n    fragColor = vec4(col, 1.0);\n}',
  // Buffer shader: smooth trails
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec3 prev = texture2D(iBackBuffer, uv).rgb * 0.97;\n    float t = iTime * 0.8;\n    vec2 center = 0.5 + 0.3 * vec2(cos(t), sin(t * 1.3));\n    float d = length(uv - center);\n    float spot = smoothstep(0.04, 0.0, d);\n    vec3 spotCol = 0.5 + 0.5 * cos(iTime + vec3(0.0, 2.0, 4.0));\n    vec3 col = max(prev, spot * spotCol);\n    fragColor = vec4(col, 1.0);\n}',
  // Buffer shader: Game of Life with trail
  'float hash(vec2 p) {\n    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);\n}\n\nvoid initImage(out vec4 fragColor, in vec2 fragCoord) {\n    float r = hash(fragCoord + vec2(42.0, 17.0));\n    float alive = step(0.62, r);\n    fragColor = vec4(alive, alive, alive, 1.0);\n}\n\nvoid mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 px = 1.0 / iResolution.xy;\n    vec2 uv = fragCoord / iResolution.xy;\n    float sum = 0.0;\n    for (int x = -1; x <= 1; x++) {\n        for (int y = -1; y <= 1; y++) {\n            if (x == 0 && y == 0) continue;\n            sum += texture2D(iBackBuffer, uv + vec2(float(x), float(y)) * px).r;\n        }\n    }\n    vec2 prev = texture2D(iBackBuffer, uv).rg;\n    float self = prev.r;\n    float trail = prev.g;\n    float alive = 0.0;\n    if (self > 0.5) {\n        alive = (sum > 1.5 && sum < 3.5) ? 1.0 : 0.0;\n    } else {\n        alive = (sum > 2.5 && sum < 3.5) ? 1.0 : 0.0;\n    }\n    trail = max(trail * 0.95, alive);\n    vec3 col = mix(vec3(0.0, 0.02, 0.1) * trail, vec3(0.1, 0.8, 0.4), alive);\n    fragColor = vec4(alive, trail, 0.0, 1.0);\n}',
];

const MOCK_SEEDS: Record<string, string[]> = {
  strudel: MOCK_STRUDEL_SEEDS,
  shader: MOCK_SHADER_SEEDS,
};

const MOCK_POOLS: Record<string, string[]> = {
  strudel: MOCK_STRUDEL_POOL,
  shader: MOCK_SHADER_POOL,
};

// ── Helpers ──

function makeProgram(
  code: string,
  modality: string,
  generation: number,
  sessionId: string,
  parentIds: string[] = [],
): Program {
  return {
    id: crypto.randomUUID(),
    code,
    modality,
    generation,
    parentIds,
    sessionId,
    createdAt: new Date().toISOString(),
  };
}

function mockEvolve(
  modality: string,
  parents: Program[],
  count: number,
): string[] {
  const pool = MOCK_POOLS[modality] ?? MOCK_POOLS.strudel;
  const parentCodes = new Set(parents.map((p) => p.code));
  const available = pool.filter((p) => !parentCodes.has(p));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// ── Hook ──

export function useEvolution() {
  const startNewSession = useCallback(
    async (modality: string, initialPrompt?: string) => {
      // Capture config before reset so it is never lost
      const llmConfig = useSessionStore.getState().llmConfig;
      setApiLLMConfig(llmConfig);

      const store = useSessionStore.getState();
      store.reset();
      store.setModality(modality);
      store.setIsLoading(true);

      try {
        const { provider, model, baseUrl } = llmConfig;
        const res = await api.post<{
          id: string;
          name: string;
          modality: string;
          created_at: string;
          programs: Array<{
            id: string;
            code: string;
            modality: string;
            generation: number;
            parent_ids: string[];
            session_id: string;
            created_at: string;
          }>;
        }>('/api/sessions', {
          modality,
          prompt: initialPrompt || undefined,
          provider,
          model,
          ...(baseUrl ? { base_url: baseUrl } : {}),
        });

        store.setSession({
          id: res.id,
          name: res.name,
          modality: res.modality,
          createdAt: res.created_at,
        });
        store.addGeneration(
          res.programs.map((p) => ({
            id: p.id,
            code: p.code,
            modality: p.modality,
            generation: p.generation,
            parentIds: p.parent_ids,
            sessionId: p.session_id,
            createdAt: p.created_at,
          })),
        );
      } catch {
        // Mock mode — no backend available
        const sessionId = crypto.randomUUID();
        store.setSession({
          id: sessionId,
          name: 'Untitled Session',
          modality,
          createdAt: new Date().toISOString(),
        });
        const seeds = MOCK_SEEDS[modality] ?? MOCK_SEEDS.strudel;
        store.addGeneration(
          seeds.map((code) => makeProgram(code, modality, 0, sessionId)),
        );
      } finally {
        store.setIsLoading(false);
      }
    },
    [],
  );

  const evolve = useCallback(
    async (parents: Program[], guidance?: string) => {
      const store = useSessionStore.getState();
      const modality = store.modality ?? 'strudel';
      const customized = store.customizedPrograms;
      store.setIsEvolving(true);

      // Sync LLM config to API client for header injection
      setApiLLMConfig(store.llmConfig);

      // Use customized code when available
      const parentPayload = parents.map((p) => ({
        id: p.id,
        code: customized[p.id] ?? p.code,
      }));

      try {
        const { provider, model, baseUrl } = store.llmConfig;
        const res = await api.post<{
          programs: Array<{
            id: string;
            code: string;
            modality: string;
            generation: number;
            parent_ids: string[];
            session_id: string;
            created_at: string;
          }>;
          generation: number;
        }>('/api/evolve', {
          modality,
          parents: parentPayload,
          guidance,
          population_size: 6,
          session_id: store.session?.id,
          provider,
          model,
          ...(baseUrl ? { base_url: baseUrl } : {}),
        });

        store.addGeneration(
          res.programs.map((p) => ({
            id: p.id,
            code: p.code,
            modality: p.modality,
            generation: p.generation,
            parentIds: p.parent_ids ?? [],
            sessionId: p.session_id ?? store.session?.id ?? '',
            createdAt: p.created_at ?? new Date().toISOString(),
          })),
        );
      } catch {
        // Mock evolution
        const gen = store.generations.length;
        const sessionId = store.session?.id ?? '';
        const codes = mockEvolve(modality, parents, 6);
        store.addGeneration(
          codes.map((code) =>
            makeProgram(
              code,
              modality,
              gen,
              sessionId,
              parents.map((p) => p.id),
            ),
          ),
        );
      } finally {
        store.setIsEvolving(false);
      }
    },
    [],
  );

  return { startNewSession, evolve };
}
