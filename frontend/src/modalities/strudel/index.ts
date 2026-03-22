import type { ModalityPlugin, RenderHandle } from '../../types';

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

function destroyEditor(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }

  stopPlayback();

  if (editorElement?.parentNode) {
    editorElement.parentNode.removeChild(editorElement);
  }

  editorElement = null;
  editorInstance = null;
  editorReady = false;
}

// ── Plugin implementation ──

export const strudelPlugin: ModalityPlugin = {
  key: 'strudel',
  label: 'Strudel',
  icon: '♪',
  language: 'javascript',
  description: 'Live-coded music patterns — evolve beats, melodies, and soundscapes',

  render(code: string, container: HTMLElement): RenderHandle {
    container.innerHTML = '';
    const pre = document.createElement('pre');
    pre.className = 'strudel-code-preview';
    pre.textContent = code;
    container.appendChild(pre);
    return {
      cleanup() {
        container.innerHTML = '';
      },
    };
  },

  previewInModal(code: string, container: HTMLElement): RenderHandle {
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

    return {
      cleanup() {
        stopPlayback();
        container.innerHTML = '';
      },
      reset() {
        playCode(code);
      },
    };
  },
};

// Export helpers for useStrudelPlayer hook compatibility
export { ensureEditor, destroyEditor, editorReady, playCode, stopPlayback };
