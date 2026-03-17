import { useRef, useEffect, useCallback } from 'react';
import { getPlugin } from '../modalityRegistry';
import { RenderHandle } from '../types';

/**
 * Hook that manages a shader WebGL renderer lifecycle for a single canvas.
 * Automatically handles mounting/unmounting the renderer.
 */
export function useShaderRenderer(code: string, modality: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RenderHandle | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !code) return;

    // Clean up previous renderer
    handleRef.current?.cleanup();

    const plugin = getPlugin(modality);
    handleRef.current = plugin.render(code, container);

    return () => {
      handleRef.current?.cleanup();
      handleRef.current = null;
    };
  }, [code, modality]);

  const rerender = useCallback(
    (newCode: string) => {
      const container = containerRef.current;
      if (!container) return;

      handleRef.current?.cleanup();
      const plugin = getPlugin(modality);
      handleRef.current = plugin.render(newCode, container);
    },
    [modality],
  );

  return { containerRef, rerender };
}
