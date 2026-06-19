import { api } from '../../api/client';

const API_BASE = import.meta.env.VITE_API_URL || '';

function buildHeaders(body?: unknown, apiKey?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (body) h['Content-Type'] = 'application/json';
  if (apiKey) h['X-Api-Key'] = apiKey;
  const token = localStorage.getItem('symbolicBreeder_authToken');
  if (token) h['Authorization'] = `Bearer ${token}`;
  return h;
}

// ── Types ──

export type ModalityKey = 'strudel' | 'shader' | 'openscad' | 'svg';

export interface ContextVersionSummary {
  modality: string;
  version: string;
  label?: string | null;
  description?: string | null;
  file_count: number;
  source_count: number;
  last_modified?: string | null;
  is_app_default: boolean;
}

export interface SourceFile {
  id: string;
  path: string;
  text: string;
  inject_into: string[];
  enabled: boolean;
  level?: string | null;
  category?: string | null;
  description?: string | null;
}

export interface PromptBundle {
  role: string;
  seed_prompt: string;
  evolve_prompt: string;
  variety_suffix: string;
  raw_yaml?: string | null;
}

export interface ContextManifest {
  version: number;
  modality: string;
  default_profile: string;
  profiles: Record<string, unknown>;
  sources: Array<Record<string, unknown>>;
  prompt_bundle: Record<string, unknown>;
  extends_manifest?: string | null;
  raw_yaml?: string | null;
}

export interface ContextVersionDetail {
  modality: string;
  version: string;
  is_app_default: boolean;
  manifest: ContextManifest;
  prompt_bundle: PromptBundle;
  sources: SourceFile[];
}

export interface ParentItem {
  id: string;
  modality: string;
  label: string;
  code: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptItem {
  id: string;
  modality: string;
  label?: string | null;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface SampleItem {
  id: string;
  job_id?: string | null;
  quick_test_session_id?: string | null;
  modality: string;
  context_version?: string | null;
  context_profile: string;
  mode: string;
  use_guidance: boolean;
  use_parents: boolean;
  provider: string;
  model: string;
  base_url?: string | null;
  prompt?: string | null;
  prompt_flat?: string | null;
  parents_json: Array<Record<string, unknown>>;
  code: string;
  error?: string | null;
  latency_ms?: number | null;
  source: string;
  created_at: string;
}

export interface SampleListResponse {
  items: SampleItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface JobItem {
  id: string;
  label?: string | null;
  modality: string;
  context_version?: string | null;
  context_profile: string;
  mode: string;
  use_guidance: boolean;
  use_parents: boolean;
  parents_per_sample: number;
  provider: string;
  model: string;
  base_url?: string | null;
  target_count: number;
  completed_count: number;
  failed_count: number;
  status: 'pending' | 'running' | 'done' | 'failed' | 'cancelled' | 'interrupted';
  started_at?: string | null;
  finished_at?: string | null;
  error_message?: string | null;
  created_at: string;
  prompt_pool: string[];
  parent_pool: Array<Record<string, unknown>>;
}

export interface StatsBucket {
  key: string;
  count: number;
}

export interface TimeBucket {
  date: string;
  count: number;
}

export interface SamplesStats {
  total: number;
  total_last_24h: number;
  total_last_7d: number;
  avg_code_length: number;
  avg_latency_ms?: number | null;
  by_modality: StatsBucket[];
  by_context_version: StatsBucket[];
  by_model: StatsBucket[];
  by_mode: StatsBucket[];
  by_day: TimeBucket[];
  by_day_by_version: Array<Record<string, string | number>>;
}

export interface SampleFilters {
  modality?: string;
  context_version?: string[];
  mode?: string[];
  model?: string[];
  provider?: string[];
  use_guidance?: boolean;
  use_parents?: boolean;
  date_from?: string;
  date_to?: string;
  prompt_contains?: string;
  job_id?: string;
  quick_test_session_id?: string;
  search?: string;
  page?: number;
  per_page?: number;
  order_by?: 'created_desc' | 'created_asc';
}

function buildQuery(filters: SampleFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (Array.isArray(v)) {
      v.forEach((item) => params.append(k, String(item)));
    } else {
      params.append(k, String(v));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ── Contexts ──

export const sandboxContextsApi = {
  list: (modality: string) =>
    api.get<ContextVersionSummary[]>(`/api/sandbox/contexts/${encodeURIComponent(modality)}`),
  get: (modality: string, version: string) =>
    api.get<ContextVersionDetail>(
      `/api/sandbox/contexts/${encodeURIComponent(modality)}/${encodeURIComponent(version)}`,
    ),
  duplicate: (modality: string, sourceVersion: string, newLabel?: string) =>
    api.post<ContextVersionDetail>(
      `/api/sandbox/contexts/${encodeURIComponent(modality)}/duplicate`,
      { source_version: sourceVersion, new_label: newLabel ?? null },
    ),
  update: (
    modality: string,
    version: string,
    body: Partial<{
      manifest: ContextManifest;
      prompt_bundle: PromptBundle;
      sources: SourceFile[];
    }>,
  ) =>
    requestRaw<ContextVersionDetail>(
      'PUT',
      `/api/sandbox/contexts/${encodeURIComponent(modality)}/${encodeURIComponent(version)}`,
      body,
    ),
  remove: (modality: string, version: string) =>
    requestRaw<{ status: string; trashed_to: string }>(
      'DELETE',
      `/api/sandbox/contexts/${encodeURIComponent(modality)}/${encodeURIComponent(version)}`,
    ),
};

// ── Parents / Prompts library ──

export const sandboxParentsApi = {
  list: (modality: string) =>
    api.get<ParentItem[]>(`/api/sandbox/parents/${encodeURIComponent(modality)}`),
  create: (modality: string, body: { label: string; code: string; notes?: string }) =>
    api.post<ParentItem>(`/api/sandbox/parents/${encodeURIComponent(modality)}`, body),
  update: (
    modality: string,
    id: string,
    body: Partial<{ label: string; code: string; notes: string }>,
  ) =>
    requestRaw<ParentItem>(
      'PUT',
      `/api/sandbox/parents/${encodeURIComponent(modality)}/${encodeURIComponent(id)}`,
      body,
    ),
  remove: (modality: string, id: string) =>
    requestRaw<{ status: string }>(
      'DELETE',
      `/api/sandbox/parents/${encodeURIComponent(modality)}/${encodeURIComponent(id)}`,
    ),
};

export const sandboxPromptsApi = {
  list: (modality: string) =>
    api.get<PromptItem[]>(`/api/sandbox/prompts/${encodeURIComponent(modality)}`),
  create: (modality: string, body: { label?: string; text: string }) =>
    api.post<PromptItem>(`/api/sandbox/prompts/${encodeURIComponent(modality)}`, body),
  update: (
    modality: string,
    id: string,
    body: Partial<{ label: string; text: string }>,
  ) =>
    requestRaw<PromptItem>(
      'PUT',
      `/api/sandbox/prompts/${encodeURIComponent(modality)}/${encodeURIComponent(id)}`,
      body,
    ),
  remove: (modality: string, id: string) =>
    requestRaw<{ status: string }>(
      'DELETE',
      `/api/sandbox/prompts/${encodeURIComponent(modality)}/${encodeURIComponent(id)}`,
    ),
};

// ── Samples ──

export const sandboxSamplesApi = {
  list: (filters: SampleFilters) =>
    api.get<SampleListResponse>(`/api/sandbox/samples${buildQuery(filters)}`),
  get: (id: string) => api.get<SampleItem>(`/api/sandbox/samples/${encodeURIComponent(id)}`),
  remove: (id: string) =>
    requestRaw<{ status: string }>('DELETE', `/api/sandbox/samples/${encodeURIComponent(id)}`),
  stats: (filters: Omit<SampleFilters, 'page' | 'per_page' | 'order_by' | 'prompt_contains' | 'job_id' | 'quick_test_session_id' | 'search'>) =>
    api.get<SamplesStats>(`/api/sandbox/samples/stats${buildQuery(filters)}`),
  distinct: (field: 'model' | 'provider' | 'context_version' | 'mode', modality?: string) =>
    api.get<{ field: string; values: string[] }>(
      `/api/sandbox/samples/distinct/${field}${modality ? `?modality=${encodeURIComponent(modality)}` : ''}`,
    ),
};

// ── Jobs ──

export interface JobCreateBody {
  label?: string;
  modality: string;
  context_version?: string | null;
  context_profile: string;
  mode: 'seed' | 'evolve';
  use_guidance: boolean;
  use_parents: boolean;
  parents_per_sample: number;
  target_count: number;
  provider: string;
  model: string;
  base_url?: string;
  prompt_pool: string[];
  parent_pool: Array<{ id?: string; code: string; label?: string }>;
}

export const sandboxJobsApi = {
  create: (body: JobCreateBody, apiKey?: string) =>
    requestRaw<JobItem>('POST', '/api/sandbox/jobs', body, apiKey),
  list: (modality?: string, status?: string) =>
    api.get<JobItem[]>(
      `/api/sandbox/jobs${buildQuery({ modality, mode: status ? [status] : undefined } as Record<string, unknown> as SampleFilters)}`,
    ),
  listRaw: () => api.get<JobItem[]>('/api/sandbox/jobs'),
  get: (id: string) => api.get<JobItem>(`/api/sandbox/jobs/${encodeURIComponent(id)}`),
  cancel: (id: string) =>
    api.post<JobItem>(`/api/sandbox/jobs/${encodeURIComponent(id)}/cancel`, {}),
  retry: (id: string, apiKey?: string) =>
    requestRaw<JobItem>('POST', `/api/sandbox/jobs/${encodeURIComponent(id)}/retry`, {}, apiKey),
  remove: (id: string) =>
    requestRaw<{ status: string }>('DELETE', `/api/sandbox/jobs/${encodeURIComponent(id)}`),
  streamUrl: (id: string) => `${API_BASE}/api/sandbox/jobs/${encodeURIComponent(id)}/stream`,
};

// ── Quick test ──

export interface QuickTestBody {
  modality: string;
  context_versions: string[];
  context_profile: string;
  mode: 'seed' | 'evolve';
  use_guidance: boolean;
  use_parents: boolean;
  parents_per_sample: number;
  count: number;
  provider: string;
  model: string;
  base_url?: string;
  prompt_pool: string[];
  parent_pool: Array<{ id?: string; code: string; label?: string }>;
}

export interface QuickTestSampleEvent {
  completed: number;
  total: number;
  context_version: string;
  sample_index: number;
  sample: {
    id: string;
    context_version: string;
    modality: string;
    code: string;
    prompt: string | null;
    prompt_flat: string | null;
    parents: Array<Record<string, unknown>>;
    model: string;
    provider: string;
    source: string;
    error: string | null;
    latency_ms: number | null;
    created_at: string;
  };
}

export interface QuickTestCallbacks {
  onSession?: (id: string) => void;
  onSample?: (ev: QuickTestSampleEvent) => void;
  onDone?: (info: { completed: number; total: number; quick_test_session_id: string }) => void;
  onError?: (message: string) => void;
}

export async function streamQuickTest(
  body: QuickTestBody,
  apiKey: string | undefined,
  callbacks: QuickTestCallbacks,
): Promise<void> {
  await streamSSE('/api/sandbox/quick-test/stream', body, apiKey, async (event, data) => {
    if (event === 'session') {
      try {
        const parsed = JSON.parse(data);
        callbacks.onSession?.(parsed.quick_test_session_id);
      } catch { /* ignore */ }
    } else if (event === 'sample') {
      try {
        callbacks.onSample?.(JSON.parse(data) as QuickTestSampleEvent);
      } catch { /* ignore */ }
    } else if (event === 'done') {
      try {
        callbacks.onDone?.(JSON.parse(data));
      } catch { /* ignore */ }
    } else if (event === 'error') {
      try {
        const parsed = JSON.parse(data);
        callbacks.onError?.(parsed.message ?? 'Unknown error');
      } catch { /* ignore */ }
    }
  });
}

// ── Generic helpers ──

async function requestRaw<T>(
  method: string,
  path: string,
  body?: unknown,
  apiKey?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(body, apiKey),
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    let detail = `API error: ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) detail = err.detail;
    } catch { /* ignore parse errors */ }
    throw new Error(detail);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function streamSSE(
  path: string,
  body: unknown,
  apiKey: string | undefined,
  onEvent: (event: string, data: string) => Promise<void> | void,
): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(body, apiKey),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    let detail = `API error: ${response.status}`;
    try {
      const err = await response.json();
      if (err.detail) detail = err.detail;
    } catch { /* ignore */ }
    throw new Error(detail);
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');
  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';
    for (const part of parts) {
      if (!part.trim()) continue;
      let event = '';
      let data = '';
      for (const line of part.split('\n')) {
        if (line.startsWith('event: ')) event = line.slice(7);
        else if (line.startsWith('data: ')) data = line.slice(6);
      }
      await onEvent(event, data);
    }
  }
}

export function openSSE(
  url: string,
  onEvent: (event: string, data: string) => void,
): { close: () => void } {
  const es = new EventSource(url);
  const handler = (ev: MessageEvent, name: string) => {
    onEvent(name, typeof ev.data === 'string' ? ev.data : '');
  };
  const eventNames = ['snapshot', 'sample', 'status', 'ping', 'error'];
  eventNames.forEach((name) => {
    es.addEventListener(name, (ev) => handler(ev as MessageEvent, name));
  });
  es.onerror = () => {
    /* let consumer decide via close timeout */
  };
  return {
    close: () => es.close(),
  };
}
