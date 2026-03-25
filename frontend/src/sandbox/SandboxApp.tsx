import { useEffect, useMemo, useState } from 'react';
import { api, setApiLLMConfig, streamPost } from '../api/client';
import { ContextProfile, type LLMConfig } from '../store/sessionStore';
import { SandboxPreviewCard } from './SandboxPreviewCard';
import { SandboxStaticThumbnail } from './SandboxStaticThumbnail';
import type { SharedProgram } from '../types';
import { useSessionStore } from '../store/sessionStore';

type Modality = 'strudel' | 'shader' | 'openscad' | 'svg';
type SuitePage = 'seed-no-guidance' | 'seed-with-guidance' | 'evolve-one-parent' | 'evolve-two-parents';

interface ProviderInfo {
  key: string;
  label: string;
  models: string[];
}

interface ProgramDTO {
  id: string;
  code: string;
  modality?: string;
}

interface EvolveResult {
  programs: ProgramDTO[];
  source?: 'llm' | 'mock' | string;
  message?: string | null;
  prompt_flat?: string;
}
interface VersionResultGroup {
  id: string;
  title: string;
  parents?: ProgramDTO[];
  children: ProgramDTO[];
  guidance?: string;
  source?: string;
  message?: string | null;
  promptFlat?: string;
}

const PAGE_LABELS: Record<SuitePage, string> = {
  'seed-no-guidance': 'Page 1: Evolution 0 (no guidance)',
  'seed-with-guidance': 'Page 2: Evolution 0 (with guidance)',
  'evolve-one-parent': 'Page 3: Evolve from 1 fixed example',
  'evolve-two-parents': 'Page 4: Evolve from 2 fixed examples',
};

const GUIDANCE_SETS: Record<Modality, [string, string, string]> = {
  strudel: [
    'Make it minimal, rhythmic, and bass-focused.',
    'Make it melodic and warm with evolving motifs.',
    'Make it energetic with syncopation and contrast.',
  ],
  shader: [
    'Use soft gradients with calm motion and smooth edges.',
    'Use high-contrast geometric composition with strong silhouette.',
    'Use dynamic flow-like motion and layered depth cues.',
  ],
  openscad: [
    'Create a symmetric clean object with clear primary form.',
    'Create an architectural form with cutouts and structural balance.',
    'Create an organic sculptural form with negative space.',
  ],
  svg: [
    'Create a minimal icon-like composition with high readability.',
    'Create a bold typographic poster-like composition.',
    'Create a playful abstract composition with layered shapes.',
  ],
};

const FIXED_PARENTS: Record<Modality, [string, string]> = {
  strudel: [
    'setcpm(120/4)\n$: s("bd*4, [~ sd]*2, hh*8")._scope()',
    'setcpm(120/4)\n$: note("<c2 e2 g2 a2>").s("sawtooth")._pianoroll()',
  ],
  shader: [
    'void mainImage(out vec4 fragColor, in vec2 fragCoord){vec2 uv=fragCoord/iResolution.xy;float d=length(uv-0.5);fragColor=vec4(vec3(smoothstep(0.4,0.2,d)),1.0);}',
    'void mainImage(out vec4 fragColor, in vec2 fragCoord){vec2 uv=fragCoord/iResolution.xy;vec3 col=0.5+0.5*cos(iTime+uv.xyx+vec3(0,2,4));fragColor=vec4(col,1.0);}',
  ],
  openscad: [
    '$fn=48; difference(){ sphere(r=14); sphere(r=10); }',
    '$fn=48; for(i=[0:7]) rotate([0,0,i*45]) translate([10,0,0]) cube([8,2,3], center=true);',
  ],
  svg: [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#101820"/><circle cx="100" cy="100" r="60" fill="#f2aa4c"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><path d="M30 100 Q100 20 170 100 Q100 180 30 100Z" fill="#3a86ff"/></svg>',
  ],
};
const FIXED_PARENT_SETS: Record<Modality, [string, string, string]> = {
  strudel: [
    'setcpm(120/4)\n$: s("bd*4, [~ sd]*2, hh*8")._scope()',
    'setcpm(110/4)\n$: note("<a2 c3 e3 g3>").s("triangle")._pianoroll()',
    'setcpm(130/4)\n$: stack(s("bd*4"), s("hh*8").gain(0.4))._scope()',
  ],
  shader: [
    'void mainImage(out vec4 fragColor, in vec2 fragCoord){vec2 uv=fragCoord/iResolution.xy;float d=length(uv-0.5);fragColor=vec4(vec3(smoothstep(0.4,0.2,d)),1.0);}',
    'void mainImage(out vec4 fragColor, in vec2 fragCoord){vec2 uv=fragCoord/iResolution.xy;float v=sin(uv.x*12.+iTime)*sin(uv.y*12.-iTime);fragColor=vec4(vec3(v*0.5+0.5),1.0);}',
    'void mainImage(out vec4 fragColor, in vec2 fragCoord){vec2 uv=(fragCoord-0.5*iResolution.xy)/iResolution.y;float a=atan(uv.y,uv.x);float r=length(uv);fragColor=vec4(vec3(0.5+0.5*cos(a*6.-iTime),r,1.-r),1.0);}',
  ],
  openscad: [
    '$fn=48; difference(){ sphere(r=14); sphere(r=10); }',
    '$fn=48; for(i=[0:7]) rotate([0,0,i*45]) translate([10,0,0]) cube([8,2,3], center=true);',
    '$fn=48; linear_extrude(height=18,twist=45) offset(r=1) circle(r=8);',
  ],
  svg: [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#101820"/><circle cx="100" cy="100" r="60" fill="#f2aa4c"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#fff"/><path d="M30 100 Q100 20 170 100 Q100 180 30 100Z" fill="#3a86ff"/></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#111"/><rect x="40" y="40" width="120" height="120" fill="none" stroke="#0ff" stroke-width="6"/></svg>',
  ],
};
/** Matches breeding: omit `context_version` so the backend uses app defaults from `backend/context/<modality>/`. Version picks (`v1`…) load `backend/context_lib/<modality>/vN/`. */
const SANDBOX_MAIN_APP_CONTEXT_VERSION = 'default' as const;

/** 10 rows × 10 children per stream = 100 samples per context version per suite page (backend caps population at 20). */
const ROWS_PER_PAGE = 10;
const CHILDREN_PER_ROW = 10;
const SAMPLES_PER_PAGE = ROWS_PER_PAGE * CHILDREN_PER_ROW;

function guidanceRowsForModality(modality: Modality): string[] {
  const g = GUIDANCE_SETS[modality];
  return Array.from({ length: ROWS_PER_PAGE }, (_, i) =>
    i < 3 ? g[i] : `${g[i % 3]} (variant ${i + 1})`,
  );
}

function parentPairRowsForModality(modality: Modality): [string, string][] {
  const three = FIXED_PARENT_SETS[modality];
  return Array.from({ length: ROWS_PER_PAGE }, (_, i) => [three[i % 3], three[(i + 1) % 3]]);
}

/** Current write key; older prefixes still read for migration (see getCachedSuiteRaw). */
const SANDBOX_CACHE_PREFIX = 'sandbox-suite-v7';
const SANDBOX_CACHE_PREFIX_LEGACY: readonly string[] = [
  'sandbox-suite-v7',
  'sandbox-suite-v6',
  'sandbox-suite-v5',
  'sandbox-suite-v4',
  'sandbox-suite-v3',
];
const CUSTOM_PROVIDER_KEY = '__custom_openai__';

function suiteCacheSuffix(args: {
  modality: Modality;
  provider: string;
  model: string;
  contextProfile: ContextProfile;
  contextVersion: string;
  page: SuitePage;
}): string {
  return [
    args.modality,
    args.provider,
    args.model,
    args.contextProfile,
    args.contextVersion,
    args.page,
  ].join('|');
}

function cacheKey(args: {
  modality: Modality;
  provider: string;
  model: string;
  contextProfile: ContextProfile;
  contextVersion: string;
  page: SuitePage;
}): string {
  return [SANDBOX_CACHE_PREFIX, suiteCacheSuffix(args)].join('|');
}

/** First matching localStorage entry (newest prefix wins on write; legacy keys still readable). */
function getCachedSuiteRaw(args: {
  modality: Modality;
  provider: string;
  model: string;
  contextProfile: ContextProfile;
  contextVersion: string;
  page: SuitePage;
}): string | null {
  for (const prefix of SANDBOX_CACHE_PREFIX_LEGACY) {
    const k = [prefix, suiteCacheSuffix(args)].join('|');
    const raw = localStorage.getItem(k);
    if (raw) return raw;
  }
  return null;
}

/** Same field set as `useEvolution` for `/api/sessions/stream` and `/api/evolve/stream`. */
function buildStreamBody(
  base: Record<string, unknown>,
  contextVersion: string,
  llm: Pick<LLMConfig, 'baseUrl'>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {
    ...base,
    ...(llm.baseUrl ? { base_url: llm.baseUrl } : {}),
  };
  if (contextVersion !== SANDBOX_MAIN_APP_CONTEXT_VERSION) {
    out.context_version = contextVersion;
  }
  return out;
}

export function SandboxApp() {
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const startsCustomOpenAI = llmConfig.provider === 'openai' && !!llmConfig.baseUrl?.trim();

  const [modality, setModality] = useState<Modality>('shader');
  const [provider, setProvider] = useState(startsCustomOpenAI ? CUSTOM_PROVIDER_KEY : llmConfig.provider || 'anthropic');
  const [model, setModel] = useState(llmConfig.model || 'claude-sonnet-4-20250514');
  const [apiKey, setApiKey] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(llmConfig.baseUrl ?? '');
  const [contextProfile, setContextProfile] = useState<ContextProfile>('intermediate');

  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [versionCatalog, setVersionCatalog] = useState<Record<string, string[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<string[]>([]);
  const [recomputeByVersion, setRecomputeByVersion] = useState<Record<string, boolean>>({});
  const [activePage, setActivePage] = useState<SuitePage>('seed-no-guidance');

  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Record<string, VersionResultGroup[]>>({});
  const [progressDone, setProgressDone] = useState(0);
  const [progressTotal, setProgressTotal] = useState(0);
  const [progressPhase, setProgressPhase] = useState('');
  const [zoomProgram, setZoomProgram] = useState<SharedProgram | null>(null);
  const useCustomEndpoint = provider === CUSTOM_PROVIDER_KEY;
  const providerForRequest = useCustomEndpoint ? 'openai' : provider;
  const normalizedCustomBaseUrl = customBaseUrl.trim();
  const providerForCache = useCustomEndpoint
    ? `openai-compatible:${normalizedCustomBaseUrl.toLowerCase() || '(empty)'}`
    : providerForRequest;

  useEffect(() => {
    api.get<{ providers: ProviderInfo[] }>('/api/providers')
      .then((res) => {
        setProviders(res.providers);
        if (res.providers.length === 0) return;
        setProvider((prev) => {
          if (prev === CUSTOM_PROVIDER_KEY) return prev;
          if (res.providers.some((p) => p.key === prev)) return prev;
          return res.providers[0].key;
        });
      })
      .catch(() => {});

    api.get<{ modalities: Array<{ key: string; versions: string[] }> }>('/api/context/catalog')
      .then((res) => {
        const map: Record<string, string[]> = {};
        for (const m of res.modalities) map[m.key] = m.versions;
        setVersionCatalog(map);
      })
      .catch(() => {});
  }, []);

  const versionedFromCatalog = versionCatalog[modality] ?? [];
  const availableVersions = [SANDBOX_MAIN_APP_CONTEXT_VERSION, ...versionedFromCatalog];
  useEffect(() => {
    if (availableVersions.length === 0) {
      setSelectedVersions([]);
      return;
    }
    setSelectedVersions((prev) => {
      const kept = prev.filter((v) => availableVersions.includes(v));
      return kept.length > 0 ? kept : [SANDBOX_MAIN_APP_CONTEXT_VERSION];
    });
  }, [modality, availableVersions.join('|')]);

  useEffect(() => {
    setRecomputeByVersion((prev) => {
      const next: Record<string, boolean> = {};
      for (const v of availableVersions) next[v] = prev[v] ?? false;
      return next;
    });
  }, [availableVersions.join('|')]);

  const models = useMemo(() => providers.find((p) => p.key === providerForRequest)?.models ?? [], [providers, providerForRequest]);
  useEffect(() => {
    if (useCustomEndpoint) return;
    if (models.length > 0 && !models.includes(model)) {
      setModel(models[0]);
    }
  }, [models, model, useCustomEndpoint]);

  /** Hydrate gallery from localStorage when filters match a prior run (no regenerate). */
  useEffect(() => {
    if (selectedVersions.length === 0) return;
    setResults((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const contextVersion of selectedVersions) {
        const key = cacheKey({ modality, provider: providerForCache, model, contextProfile, contextVersion, page: activePage });
        if (next[key]?.length) continue;
        const raw = getCachedSuiteRaw({ modality, provider: providerForCache, model, contextProfile, contextVersion, page: activePage });
        if (!raw) continue;
        try {
          next[key] = JSON.parse(raw) as VersionResultGroup[];
          changed = true;
        } catch {
          /* ignore corrupt entries */
        }
      }
      return changed ? next : prev;
    });
  }, [modality, providerForCache, model, contextProfile, activePage, selectedVersions.join('|')]);

  const runSuite = async () => {
    if (selectedVersions.length === 0) return;
    if (useCustomEndpoint && !normalizedCustomBaseUrl) {
      setProgressPhase('Enter a Base URL for OpenAI-compatible provider.');
      return;
    }

    const suiteLLMConfig: LLMConfig = {
      ...llmConfig,
      provider: providerForRequest,
      model,
      apiKey: (apiKey || llmConfig.apiKey).trim() || llmConfig.apiKey,
      baseUrl: useCustomEndpoint ? normalizedCustomBaseUrl : undefined,
      contextProfile,
      streamOutput: true,
    };
    setApiLLMConfig(suiteLLMConfig);
    setIsRunning(true);
    setProgressDone(0);
    setProgressTotal(selectedVersions.length * SAMPLES_PER_PAGE);
    setProgressPhase('Preparing...');

    const bumpSamples = (n: number) => {
      setProgressDone((prev) => prev + n);
    };

    try {
      for (const contextVersion of selectedVersions) {
        const key = cacheKey({ modality, provider: providerForCache, model, contextProfile, contextVersion, page: activePage });
        const cached = getCachedSuiteRaw({ modality, provider: providerForCache, model, contextProfile, contextVersion, page: activePage });
        if (cached && !recomputeByVersion[contextVersion]) {
          const parsed = JSON.parse(cached) as VersionResultGroup[];
          setResults((r) => ({ ...r, [key]: parsed }));
          bumpSamples(SAMPLES_PER_PAGE);
          setProgressPhase(`Loaded ${contextVersion} from cache (${SAMPLES_PER_PAGE} samples)`);
          continue;
        }
        setProgressPhase(`Generating ${contextVersion}...`);

        const groups: VersionResultGroup[] = [];
        const runOne = (
          endpoint: '/api/sessions/stream' | '/api/evolve/stream',
          body: Record<string, unknown>,
          label: string,
        ) =>
          new Promise<EvolveResult>((resolve, reject) => {
            streamPost<EvolveResult>(endpoint, body, {
              onStatus: (phase) => {
                setProgressPhase(`[${contextVersion}] ${phase}`);
              },
              onError: (msg) => {
                setProgressPhase(`[${contextVersion}] ${msg}`);
              },
              onDone: (payload) => {
                resolve(payload);
              },
            }).catch(reject);
          });

        const guidanceRows = guidanceRowsForModality(modality);
        const pairRows = parentPairRowsForModality(modality);

        if (activePage === 'seed-no-guidance') {
          for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const payload = await runOne('/api/sessions/stream', buildStreamBody({
              modality,
              provider: providerForRequest,
              model,
              context_profile: contextProfile,
              population_size: CHILDREN_PER_ROW,
            }, contextVersion, suiteLLMConfig), `seed-batch-${i + 1}`);
            const n = payload.programs?.length ?? CHILDREN_PER_ROW;
            bumpSamples(n);
            groups.push({
              id: `seed-${i}`,
              title: `Seed batch ${i + 1}`,
              children: payload.programs ?? [],
              source: payload.source,
              message: payload.message,
              promptFlat: payload.prompt_flat,
            });
          }
        } else if (activePage === 'seed-with-guidance') {
          for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const guidance = guidanceRows[i];
            const payload = await runOne('/api/sessions/stream', buildStreamBody({
              modality,
              prompt: guidance,
              provider: providerForRequest,
              model,
              context_profile: contextProfile,
              population_size: CHILDREN_PER_ROW,
            }, contextVersion, suiteLLMConfig), `guidance-${i + 1}`);
            const n = payload.programs?.length ?? CHILDREN_PER_ROW;
            bumpSamples(n);
            groups.push({
              id: `guidance-${i}`,
              title: `Guidance ${i + 1}`,
              guidance,
              children: payload.programs ?? [],
              source: payload.source,
              message: payload.message,
              promptFlat: payload.prompt_flat,
            });
          }
        } else if (activePage === 'evolve-one-parent') {
          for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const parent = FIXED_PARENT_SETS[modality][i % 3];
            const payload = await runOne('/api/evolve/stream', buildStreamBody({
              modality,
              parents: [{ id: `fixed-${modality}-${i + 1}`, code: parent }],
              guidance: '',
              population_size: CHILDREN_PER_ROW,
              provider: providerForRequest,
              model,
              context_profile: contextProfile,
            }, contextVersion, suiteLLMConfig), `parent-${i + 1}`);
            const n = payload.programs?.length ?? CHILDREN_PER_ROW;
            bumpSamples(n);
            groups.push({
              id: `parent-${i}`,
              title: `Parent ${i + 1}`,
              parents: [{ id: `fixed-${modality}-${i + 1}`, code: parent }],
              children: payload.programs ?? [],
              source: payload.source,
              message: payload.message,
              promptFlat: payload.prompt_flat,
            });
          }
        } else {
          for (let i = 0; i < ROWS_PER_PAGE; i++) {
            const pair = pairRows[i];
            const payload = await runOne('/api/evolve/stream', buildStreamBody({
              modality,
              parents: [
                { id: `fixed-${modality}-${i + 1}-a`, code: pair[0] },
                { id: `fixed-${modality}-${i + 1}-b`, code: pair[1] },
              ],
              guidance: '',
              population_size: CHILDREN_PER_ROW,
              provider: providerForRequest,
              model,
              context_profile: contextProfile,
            }, contextVersion, suiteLLMConfig), `pair-${i + 1}`);
            const n = payload.programs?.length ?? CHILDREN_PER_ROW;
            bumpSamples(n);
            groups.push({
              id: `pair-${i}`,
              title: `Parent pair ${i + 1}`,
              parents: [
                { id: `fixed-${modality}-${i + 1}-a`, code: pair[0] },
                { id: `fixed-${modality}-${i + 1}-b`, code: pair[1] },
              ],
              children: payload.programs ?? [],
              source: payload.source,
              message: payload.message,
              promptFlat: payload.prompt_flat,
            });
          }
        }

        localStorage.setItem(key, JSON.stringify(groups));
        setResults((r) => ({ ...r, [key]: groups }));
        setProgressPhase(`Finished ${contextVersion}`);
      }
    } catch (err) {
      setProgressPhase(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRunning(false);
      setProgressPhase('Completed');
    }
  };

  const mapToSharedProgram = (p: ProgramDTO, version: string, guidanceForLineage?: string): SharedProgram => ({
    id: `sandbox-${version}-${p.id}`,
    programId: p.id,
    sharerName: `Suite ${version}`,
    modality,
    code: p.code,
    lineage: [{
      id: p.id,
      code: p.code,
      modality,
      generation: 0,
      parentIds: [],
      guidance: guidanceForLineage ?? '',
      llmModel: model,
      contextProfile,
    }],
    llmModel: model,
    createdAt: new Date().toISOString(),
  });

  const progressPct = progressTotal > 0 ? Math.round((progressDone / progressTotal) * 100) : 0;

  /** Shader / OpenSCAD: static snapshot images in grid; live WebGL only in zoom modal. */
  const useStaticThumbnails = modality === 'shader' || modality === 'openscad' || modality === 'svg';

  const copyPrompt = async (group: VersionResultGroup) => {
    const text = group.promptFlat?.trim();
    if (!text) {
      window.alert('No prompt text on this result. Re-run generation (disable cache / recompute) to capture the flat prompt.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.alert(text);
    }
  };

  return (
    <div className="app sandbox-app">
      <header className="app-header">
        <div className="header-row-top">
          <h1 className="app-title">✦ Symbolic Breeder Sandbox Test Suites</h1>
        </div>
      </header>

      <main className="sandbox-main">
        <section className="sandbox-card">
          <h2>Suite Filters</h2>
          <div className="sandbox-controls">
            <label className="sandbox-control">
              <span>Modality</span>
              <select value={modality} onChange={(e) => setModality(e.target.value as Modality)}>
                <option value="strudel">strudel</option>
                <option value="shader">shader</option>
                <option value="openscad">openscad</option>
                <option value="svg">svg</option>
              </select>
            </label>

            <label className="sandbox-control">
              <span>Provider</span>
              <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                {providers.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
                <option value={CUSTOM_PROVIDER_KEY}>OpenAI-compatible (custom URL)</option>
              </select>
            </label>

            <label className="sandbox-control">
              <span>Model</span>
              {useCustomEndpoint ? (
                <input
                  type="text"
                  placeholder="model-name"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
              ) : (
                <select value={model} onChange={(e) => setModel(e.target.value)}>
                  {models.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
            </label>

            {useCustomEndpoint && (
              <label className="sandbox-control">
                <span>Base URL</span>
                <input
                  type="url"
                  placeholder="https://api.groq.com/openai/v1"
                  value={customBaseUrl}
                  onChange={(e) => setCustomBaseUrl(e.target.value)}
                />
              </label>
            )}

            <label className="sandbox-control">
              <span>Context Complexity</span>
              <select value={contextProfile} onChange={(e) => setContextProfile(e.target.value as ContextProfile)}>
                <option value="simple">simple</option>
                <option value="intermediate">intermediate</option>
                <option value="advanced">advanced</option>
              </select>
            </label>

            <label className="sandbox-control">
              <span>API Key (optional)</span>
              <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="sandbox-card">
          <h2>Context Versions</h2>
          <p className="gallery-subtitle">Add one or more context versions to compare in the same page.</p>
          <div className="gallery-tabs sandbox-version-tabs">
            {availableVersions.map((v) => {
              const selected = selectedVersions.includes(v);
              return (
                <div key={v} className="sandbox-version-item">
                  <button
                    className={`gallery-tab ${selected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedVersions((prev) => selected ? prev.filter((x) => x !== v) : [...prev, v]);
                    }}
                  >
                    {selected ? '✓ ' : ''}{v === SANDBOX_MAIN_APP_CONTEXT_VERSION ? 'app' : v}
                  </button>
                  <label className="sandbox-recompute-label">
                    <input
                      type="checkbox"
                      checked={!!recomputeByVersion[v]}
                      onChange={(e) => setRecomputeByVersion((prev) => ({ ...prev, [v]: e.target.checked }))}
                    />
                    recompute
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <section className="sandbox-card">
          <h2>Test Suite Pages</h2>
          <div className="gallery-tabs">
            {(Object.keys(PAGE_LABELS) as SuitePage[]).map((p) => (
              <button key={p} className={`gallery-tab ${activePage === p ? 'active' : ''}`} onClick={() => setActivePage(p)}>
                {PAGE_LABELS[p]}
              </button>
            ))}
          </div>
          <button onClick={runSuite} disabled={isRunning || selectedVersions.length === 0}>
            {isRunning ? 'Generating...' : 'Generate / Load Cached Gallery'}
          </button>
        </section>

        <section className="sandbox-card">
          <h2>Progress</h2>
          <div className="sandbox-progress-wrap">
            <div className="sandbox-progress-bar">
              <div className="sandbox-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="sandbox-progress-label">
              {progressDone}/{Math.max(progressTotal, 1)} samples ({progressPct}%)
              {progressPhase ? ` — ${progressPhase}` : ''}
            </div>
          </div>
        </section>
        <section className="sandbox-card">
          <h2>Generated Suites</h2>
          <div className="sandbox-compare-columns">
            {selectedVersions.map((version) => {
              const key = cacheKey({ modality, provider: providerForCache, model, contextProfile, contextVersion: version, page: activePage });
              const groups = results[key] ?? [];
              return (
                <div key={key} className="sandbox-compare-column">
                  <h3>{version === SANDBOX_MAIN_APP_CONTEXT_VERSION ? 'app' : version}</h3>
                  {groups.length === 0 ? (
                    <p className="gallery-subtitle">No results yet for this version.</p>
                  ) : (
                    <div className="sandbox-group-stack">
                      {groups.map((group) => (
                        <div key={`${version}-${group.id}`} className="sandbox-group-card">
                          <div className="sandbox-group-toolbar">
                            <span className="sandbox-group-title">{group.title}</span>
                            <button
                              type="button"
                              className="sandbox-copy-prompt-btn sandbox-copy-prompt-btn--inline"
                              onClick={() => copyPrompt(group)}
                              title="Copy full flat prompt (system + user)"
                            >
                              Copy prompt
                            </button>
                          </div>
                          {activePage !== 'seed-no-guidance' && group.guidance && (
                            <div className="sandbox-guidance-text">{group.guidance}</div>
                          )}
                          {group.parents && group.parents.length > 0 && (
                            <div
                              className={
                                'gallery-grid sandbox-compact-grid sandbox-preview-grid' +
                                (useStaticThumbnails ? ' sandbox-preview-grid--static-thumbs' : '')
                              }
                            >
                              {group.parents.map((parent) => {
                                const mappedParent = mapToSharedProgram(parent, `${version}-parent`, group.guidance);
                                if (useStaticThumbnails) {
                                  return (
                                    <SandboxStaticThumbnail
                                      key={`${version}-${group.id}-${parent.id}`}
                                      modality={modality as 'shader' | 'openscad' | 'svg'}
                                      code={parent.code}
                                      onOpen={() => setZoomProgram(mappedParent)}
                                    />
                                  );
                                }
                                return (
                                  <SandboxPreviewCard
                                    key={`${version}-${group.id}-${parent.id}`}
                                    program={mappedParent}
                                    onPreviewClick={(prog) => setZoomProgram(prog)}
                                  />
                                );
                              })}
                            </div>
                          )}
                          <div
                            className={
                              'gallery-grid sandbox-compact-grid sandbox-preview-grid' +
                              (useStaticThumbnails ? ' sandbox-preview-grid--static-thumbs' : '')
                            }
                          >
                            {group.children.map((p) => {
                              const mapped = mapToSharedProgram(p, version, group.guidance);
                              if (useStaticThumbnails) {
                                return (
                                  <SandboxStaticThumbnail
                                    key={`${version}-${group.id}-${p.id}`}
                                    modality={modality as 'shader' | 'openscad' | 'svg'}
                                    code={p.code}
                                    onOpen={() => setZoomProgram(mapped)}
                                  />
                                );
                              }
                              return (
                                <SandboxPreviewCard
                                  key={`${version}-${group.id}-${p.id}`}
                                  program={mapped}
                                  onPreviewClick={(prog) => setZoomProgram(prog)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {zoomProgram && (
        <div className="modal-overlay" onClick={() => setZoomProgram(null)}>
          <div className="modal-content sandbox-zoom-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header sandbox-zoom-modal-header">
              <button type="button" onClick={() => setZoomProgram(null)} aria-label="Close">×</button>
            </div>
            <div className="sandbox-zoom-modal-body">
              <SandboxPreviewCard program={zoomProgram} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
