import type { ModalityPlugin } from '../../types';

/**
 * Strudel modality plugin.
 *
 * Uses the hidden <strudel-editor> web component for audio playback.
 * Only one program can play at a time (shared singleton element).
 */

interface StrudelMirror {
  setCode: (code: string) => void;
  evaluate: () => Promise<void> | void;
  start: () => Promise<void> | void;
  stop: () => Promise<void> | void;
}

// ── Singleton hidden editor ──
let editorElement: HTMLElement | null = null;
let editorInstance: StrudelMirror | null = null;
let editorReady = false;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function ensureEditor(): void {
  if (editorElement) return;

  const el = document.createElement('strudel-editor');
  el.setAttribute('code', '// ready');
  Object.assign(el.style, {
    position: 'fixed',
    bottom: '0',
    left: '0',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    opacity: '0',
    pointerEvents: 'none',
    zIndex: '-1',
  });
  document.body.appendChild(el);
  editorElement = el;

  pollTimer = setInterval(() => {
    const editor = (el as unknown as { editor?: StrudelMirror }).editor;
    if (editor) {
      editorInstance = editor;
      editorReady = true;
      if (pollTimer) clearInterval(pollTimer);
      pollTimer = null;
    }
  }, 250);
}

async function playCode(code: string): Promise<void> {
  ensureEditor();
  if (!editorInstance) return;
  try {
    await editorInstance.stop();
    editorInstance.setCode(code);
    await editorInstance.evaluate();
    await editorInstance.start();
  } catch (err) {
    console.error('Strudel playback error:', err);
  }
}

async function stopPlayback(): Promise<void> {
  try {
    await editorInstance?.stop();
  } catch (err) {
    console.error('Strudel stop error:', err);
  }
}

// ── Plugin implementation ──

export const strudelPlugin: ModalityPlugin = {
  key: 'strudel',
  label: 'Strudel',
  language: 'javascript',
  description: 'Live-coded music patterns — evolve beats, melodies, and soundscapes',

  render(code: string, container: HTMLElement): () => void {
    // For strudel, the card shows a static music icon.
    // Playback is triggered by ProgramCard's play button, not continuous.
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
      'background:#0f1019;color:#8b5cf6;font-size:2.5rem;user-select:none;';
    wrapper.textContent = '♪';
    container.appendChild(wrapper);
    return () => {
      container.innerHTML = '';
    };
  },

  previewInModal(code: string, container: HTMLElement): () => void {
    // Play audio and show visual indicator
    container.innerHTML = '';
    const indicator = document.createElement('div');
    indicator.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
      'background:#0f1019;flex-direction:column;gap:1rem;';

    const icon = document.createElement('div');
    icon.style.cssText = 'font-size:4rem;animation:pulse 1.6s ease-in-out infinite;color:#22c55e;';
    icon.textContent = '♪';

    const label = document.createElement('div');
    label.style.cssText = 'color:#94a3b8;font-size:0.85rem;';
    label.textContent = 'Playing…';

    indicator.appendChild(icon);
    indicator.appendChild(label);
    container.appendChild(indicator);

    playCode(code);

    return () => {
      stopPlayback();
      container.innerHTML = '';
    };
  },
};

// Export helpers for useStrudelPlayer hook compatibility
export { ensureEditor, editorReady, playCode, stopPlayback };
