import { useEffect } from 'react';
import { setApiLLMConfig } from '../api/client';
import { useSessionStore } from '../store/sessionStore';
import { SandboxHeader } from './components/SandboxHeader';
import { SandboxLanding } from './components/SandboxLanding';
import { ContextsPage } from './pages/ContextsPage';
import { QuickTestPage } from './pages/QuickTestPage';
import { DataCachePage } from './pages/DataCachePage';
import { ComparePage } from './pages/ComparePage';
import { useSandboxNav } from './sandboxStore';

export function SandboxApp() {
  const modality = useSandboxNav((s) => s.modality);
  const tab = useSandboxNav((s) => s.tab);
  const llmConfig = useSessionStore((s) => s.llmConfig);

  // Keep API client in sync with the user's LLM config so X-Api-Key flows on every call.
  useEffect(() => {
    setApiLLMConfig(llmConfig);
  }, [llmConfig]);

  return (
    <div className="sbx-shell">
      <SandboxHeader />
      <main className="sbx-main">
        {!modality ? (
          <SandboxLanding />
        ) : tab === 'contexts' ? (
          <ContextsPage modality={modality} />
        ) : tab === 'quick-test' ? (
          <QuickTestPage modality={modality} />
        ) : tab === 'data-cache' ? (
          <DataCachePage modality={modality} />
        ) : (
          <ComparePage modality={modality} />
        )}
      </main>
    </div>
  );
}
