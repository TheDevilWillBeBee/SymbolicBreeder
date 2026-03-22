import { useRef, useEffect, useCallback, useState } from 'react';
import { ensureEditor, playCode, stopPlayback, editorReady } from '../modalities/strudel';

/**
 * Hook that manages the hidden strudel-editor web component for playback.
 * Provides play(code) and stop() controls.
 *
 * editorReady is polled from the strudel module (which owns the singleton
 * editor lifecycle), avoiding a second independent DOM poll.
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

    // Poll until the strudel module signals the editor is ready.
    // editorReady is set by the internal poll in strudel/index.ts so we
    // don't duplicate the DOM check here.
    pollRef.current = setInterval(() => {
      if (editorReady) {
        setIsReady(true);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
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
