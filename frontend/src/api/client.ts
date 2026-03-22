import type { LLMConfig } from '../store/sessionStore';

const API_BASE = import.meta.env.VITE_API_URL || '';

let _llmConfig: LLMConfig | undefined;

export function setApiLLMConfig(config: LLMConfig) {
  _llmConfig = config;
}

function buildHeaders(body?: unknown): Record<string, string> {
  const h: Record<string, string> = {};
  if (body) h['Content-Type'] = 'application/json';
  if (_llmConfig?.apiKey) h['X-Api-Key'] = _llmConfig.apiKey;
  return h;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: buildHeaders(body),
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
  return response.json();
}

export interface SSECallbacks<T> {
  onToken?: (text: string) => void;
  onDone: (data: T) => void;
  onError?: (message: string) => void;
  onSession?: (data: { id: string; name: string; modality: string; created_at: string }) => void;
  onStatus?: (phase: string) => void;
}

/**
 * POST with SSE streaming. Parses `event: token`, `event: done`,
 * `event: error`, `event: mock`, and `event: result` events.
 */
export async function streamPost<T>(
  path: string,
  body: unknown,
  callbacks: SSECallbacks<T>,
): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: buildHeaders(body),
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

    // Process complete SSE events (double newline delimited)
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

      if (event === 'token' && data) {
        try {
          const parsed = JSON.parse(data);
          callbacks.onToken?.(parsed.text);
        } catch { /* ignore malformed token */ }
      } else if (event === 'result' && data) {
        try {
          callbacks.onDone(JSON.parse(data) as T);
        } catch { /* ignore */ }
      } else if (event === 'mock' && data) {
        try {
          callbacks.onDone(JSON.parse(data) as T);
        } catch { /* ignore */ }
      } else if (event === 'error' && data) {
        try {
          const parsed = JSON.parse(data);
          callbacks.onError?.(parsed.message ?? 'Unknown error');
          callbacks.onDone(parsed as T);
        } catch { /* ignore */ }
      } else if (event === 'session' && data) {
        try {
          callbacks.onSession?.(JSON.parse(data));
        } catch { /* ignore */ }
      } else if (event === 'status' && data) {
        try {
          const parsed = JSON.parse(data);
          callbacks.onStatus?.(parsed.phase);
        } catch { /* ignore */ }
      }
    }
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
};
