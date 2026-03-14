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

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
};
