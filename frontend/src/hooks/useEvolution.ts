import { useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { api, setApiLLMConfig } from '../api/client';
import { Program } from '../types';

// ── Mock pools (per modality) ──

const MOCK_STRUDEL_SEEDS = [
  's("bd sd:1 [bd bd] sd:2")',
  'note("c3 eb3 g3 bb3").s("sawtooth").cutoff(800)',
  's("hh*8").gain("[0.8 0.5]*4")',
  'note("<c2 g2 ab2 f2>").s("sawtooth").lpf(600).gain(0.6)',
  's("bd*2, ~ sd, hh*4")',
  'note("c4 e4 g4 c5").s("triangle").delay(0.3).delaytime(0.125)',
];

const MOCK_SHADER_SEEDS = [
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    vec2 center = vec2(0.5);\n    float d = length(uv - center);\n    float r = 0.25 + 0.1 * uSin;\n    float glow = smoothstep(r, r - 0.05, d);\n    vec3 col = glow * vec3(0.2, 0.6, 1.0);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float t = uv.x + uSin * 0.3;\n    vec3 col = 0.5 + 0.5 * cos(6.2831 * (t + vec3(0.0, 0.33, 0.67)));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float wave = sin(d * 30.0 - uSin * 10.0);\n    vec3 col = vec3(wave * 0.5 + 0.5) * vec3(0.9, 0.3, 0.6);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x) + uSin * 0.5;\n    float r = length(uv);\n    float pat = sin(a * 6.0) * cos(r * 20.0 + uCos * 5.0);\n    vec3 col = vec3(pat * 0.5 + 0.5, r, 0.8 - r);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy * 4.0;\n    float v = sin(uv.x * 3.0 + uSin * 5.0);\n    v += sin(uv.y * 3.0 + uCos * 5.0);\n    v += sin((uv.x + uv.y) * 2.0 + uSin * 3.0);\n    v += sin(length(uv) * 3.0);\n    vec3 col = 0.5 + 0.5 * cos(v + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    uv *= 5.0 + uSin * 2.0;\n    float c = mod(floor(uv.x) + floor(uv.y), 2.0);\n    vec3 col = mix(vec3(0.1, 0.1, 0.2), vec3(1.0, 0.8, 0.3), c);\n    fragColor = vec4(col, 1.0);\n}',
];

const MOCK_STRUDEL_POOL = [
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
];

const MOCK_SHADER_POOL = [
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float a = atan(uv.y, uv.x);\n    float r = length(uv);\n    float spiral = sin(a * 3.0 + r * 20.0 - uSin * 8.0);\n    vec3 col = vec3(spiral * 0.5 + 0.5) * vec3(0.3, 0.7, 1.0);\n    col += 0.1 / (r + 0.1);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float bx = floor(uv.x * 4.0);\n    float by = floor(uv.y * 4.0);\n    float id = bx + by * 4.0;\n    vec3 col = 0.5 + 0.5 * cos(id * 0.7 + uSin * 3.0 + vec3(0.0, 2.0, 4.0));\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float n = fract(sin(dot(uv * (10.0 + uSin), vec2(12.9898, 78.233))) * 43758.5453);\n    vec3 col = vec3(n) * vec3(0.6 + 0.4 * uCos, 0.3, 0.8);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = abs(uv.x) + abs(uv.y);\n    float wave = sin(d * 15.0 - uSin * 6.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.1, 0.0, 0.3), vec3(1.0, 0.5, 0.0), wave);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = (fragCoord - 0.5 * iResolution.xy) / iResolution.y;\n    float d = length(uv);\n    float intensity = 0.05 / (d + 0.05) * (0.7 + 0.3 * uSin);\n    vec3 col = intensity * vec3(1.0, 0.4, 0.7);\n    fragColor = vec4(col, 1.0);\n}',
  'void mainImage(out vec4 fragColor, in vec2 fragCoord) {\n    vec2 uv = fragCoord / iResolution.xy;\n    float y = uv.y + sin(uv.x * 10.0 + uSin * 4.0) * 0.1;\n    float stripe = sin(y * 40.0) * 0.5 + 0.5;\n    vec3 col = mix(vec3(0.0, 0.2, 0.4), vec3(0.0, 0.9, 0.7), stripe);\n    fragColor = vec4(col, 1.0);\n}',
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
