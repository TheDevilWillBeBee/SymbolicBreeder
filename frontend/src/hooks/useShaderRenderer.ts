import { useRef, useEffect, useCallback } from 'react';
import { getPlugin } from '../modalityRegistry';

/**
 * Hook that manages a shader WebGL renderer lifecycle for a single canvas.
 * Automatically handles mounting/unmounting the renderer.
 */
export function useShaderRenderer(code: string, modality: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !code) return;

    // Clean up previous renderer
    cleanupRef.current?.();

    const plugin = getPlugin(modality);
    cleanupRef.current = plugin.render(code, container);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = null;
    };
  }, [code, modality]);

  const rerender = useCallback(
    (newCode: string) => {
      const container = containerRef.current;
      if (!container) return;

      cleanupRef.current?.();
      const plugin = getPlugin(modality);
      cleanupRef.current = plugin.render(newCode, container);
    },
    [modality],
  );

  return { containerRef, rerender };
}
