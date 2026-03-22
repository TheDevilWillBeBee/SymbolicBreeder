import { useEffect, useState } from 'react';
import { useSessionStore, ContextProfile } from '../store/sessionStore';
import { api } from '../api/client';

interface ProviderInfo {
  key: string;
  label: string;
  models: string[];
}

interface ProvidersResponse {
  server_key_available: boolean;
  providers: ProviderInfo[];
}

export function ModelSelector() {
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const setLLMConfig = useSessionStore((s) => s.setLLMConfig);

  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [serverKeyAvailable, setServerKeyAvailable] = useState(false);
  const [useCustomEndpoint, setUseCustomEndpoint] = useState(false);

  useEffect(() => {
    api
      .get<ProvidersResponse>('/api/providers')
      .then((res) => {
        setProviders(res.providers);
        setServerKeyAvailable(res.server_key_available);
      })
      .catch(() => {
        setProviders([
          { key: 'anthropic', label: 'Anthropic', models: ['claude-sonnet-4-20250514', 'claude-opus-4-5', 'claude-haiku-4-5-20251001'] },
          { key: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'] },
          { key: 'gemini', label: 'Google Gemini', models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'] },
          { key: 'qwen', label: 'Qwen', models: ['qwen3.5-plus', 'qwen3-max', 'qwen3.5-flash'] },
        ]);
      });
  }, []);

  const selectedProvider = providers.find((p) => p.key === llmConfig.provider);
  const models = selectedProvider?.models ?? [];

  const handleProviderChange = (key: string) => {
    if (key === '__custom__') {
      setUseCustomEndpoint(true);
      setLLMConfig({ provider: 'openai', model: '', baseUrl: '' });
    } else {
      setUseCustomEndpoint(false);
      const prov = providers.find((p) => p.key === key);
      setLLMConfig({
        provider: key,
        model: prov?.models[0] ?? '',
        baseUrl: undefined,
      });
    }
  };

  return (
    <div className="model-selector">
      <div className="model-selector-row">
        <label className="model-selector-label">Provider</label>
        <select
          className="model-selector-select"
          value={useCustomEndpoint ? '__custom__' : llmConfig.provider}
          onChange={(e) => handleProviderChange(e.target.value)}
        >
          {providers.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
          <option value="__custom__">Custom (OpenAI-compatible)</option>
        </select>
      </div>

      {useCustomEndpoint && (
        <div className="model-selector-row">
          <label className="model-selector-label">Base URL</label>
          <input
            type="url"
            className="model-selector-input"
            placeholder="https://api.groq.com/openai/v1"
            value={llmConfig.baseUrl ?? ''}
            onChange={(e) => setLLMConfig({ baseUrl: e.target.value })}
          />
        </div>
      )}

      <div className="model-selector-row">
        <label className="model-selector-label">Model</label>
        {useCustomEndpoint ? (
          <input
            type="text"
            className="model-selector-input"
            placeholder="model-name"
            value={llmConfig.model}
            onChange={(e) => setLLMConfig({ model: e.target.value })}
          />
        ) : (
          <select
            className="model-selector-select"
            value={llmConfig.model}
            onChange={(e) => setLLMConfig({ model: e.target.value })}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
      </div>

      {serverKeyAvailable ? (
        <p className="model-selector-notice">
          ✓ Using server-provided API key
        </p>
      ) : (
        <>
          <div className="model-selector-row">
            <label className="model-selector-label">API Key</label>
            <input
              type="password"
              className="model-selector-input"
              placeholder="sk-..."
              autoComplete="off"
              value={llmConfig.apiKey}
              onChange={(e) => setLLMConfig({ apiKey: e.target.value })}
            />
          </div>
          <p className="model-selector-notice">
            🔒 Your API key is used only for this session and is never stored or sent to our servers.
          </p>
        </>
      )}

      <div className="model-selector-row context-profile-row">
        <label className="model-selector-label">Context Complexity</label>
        <div className="context-profile-selector">
          {(['simple', 'intermediate', 'advanced'] as ContextProfile[]).map((profile) => (
            <label key={profile} className="context-profile-option">
              <input
                type="radio"
                name="contextProfile"
                value={profile}
                checked={llmConfig.contextProfile === profile}
                onChange={() => setLLMConfig({ contextProfile: profile })}
              />
              <span>{profile.charAt(0).toUpperCase() + profile.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      {(llmConfig.apiKey || serverKeyAvailable) && (
        <div className="model-selector-row stream-toggle-row">
          <label className="stream-toggle-label">
            <input
              type="checkbox"
              checked={llmConfig.streamOutput}
              onChange={(e) => setLLMConfig({ streamOutput: e.target.checked })}
            />
            <span>Stream LLM output</span>
          </label>
          <span className="stream-toggle-hint">Watch code being generated in real-time</span>
        </div>
      )}
    </div>
  );
}
