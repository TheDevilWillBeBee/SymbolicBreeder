import { useRef, useEffect, useCallback, useState } from 'react';
import { ensureEditor, playCode, stopPlayback } from '../modalities/strudel';

/**
 * Hook that manages the hidden strudel-editor web component for playback.
 * Provides play(code) and stop() controls.
 */
export function useStrudelPlayer(enabled = true) {
  const [isReady, setIsReady] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      stopPlayback();
      setIsReady(false);
      return;
    }

    ensureEditor();

    // Poll until the editor instance is ready
    pollRef.current = setInterval(() => {
      // editorReady is checked internally by playCode
      // We just need to know for UI purposes
      try {
        // Try a quick check
        const el = document.querySelector('strudel-editor');
        if (el && (el as unknown as { editor?: unknown }).editor) {
          setIsReady(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* ignore */
      }
    }, 250);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [enabled]);

  const play = useCallback(async (code: string) => {
    await playCode(code);
  }, []);

  const stop = useCallback(async () => {
    await stopPlayback();
  }, []);

  return { play, stop, isReady };
}
