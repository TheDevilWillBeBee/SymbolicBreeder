import { useRef, useEffect, useCallback, useState } from 'react';
import { RenderHandle, RenderOptions } from '../types';
import { getPlugin } from '../modalityRegistry';

/**
 * Manages render lifecycle and play/pause/reset state for a visual modality card.
 *
 * Used by ProgramCard and GalleryCard (and the lineage card in ProgramDetailPage)
 * to avoid duplicating the same effect + callback pattern across all three.
 *
 * @param modality  - Modality key (e.g. "shader", "openscad", "svg")
 * @param code      - Source code to render
 * @param options   - Optional render options (e.g. useManifold for OpenSCAD)
 * @returns containerRef to attach to the preview div, plus pause/reset controls
 */
export function useVisualPlayback(
  modality: string,
  code: string,
  options?: RenderOptions,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    // Clean up any prior render before starting a new one (e.g. code changed)
    handleRef.current?.cleanup();
    const plugin = getPlugin(modality);
    handleRef.current = plugin.render(code, containerRef.current, options);
    setIsPaused(false);
    return () => {
      handleRef.current?.cleanup();
      handleRef.current = null;
    };
  }, [modality, code, options?.useManifold]); // eslint-disable-line react-hooks/exhaustive-deps

  const togglePause = useCallback(() => {
    if (!handleRef.current) return;
    if (isPaused) {
      handleRef.current.resume?.();
      setIsPaused(false);
    } else {
      handleRef.current.pause?.();
      setIsPaused(true);
    }
  }, [isPaused]);

  const reset = useCallback(() => {
    handleRef.current?.reset?.();
    setIsPaused(false);
  }, []);

  return { containerRef, isPaused, togglePause, reset };
}
