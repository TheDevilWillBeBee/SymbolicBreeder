import { useCallback, useState } from 'react';
import { SharedProgram } from '../types';
import { StrudelHighlight } from '../components/StrudelHighlight';
import { useVisualPlayback } from '../hooks/useVisualPlayback';

/**
 * Compact preview for sandbox grids/modal — same rendering as GalleryCard preview surface,
 * without controls, labels, or OpenSCAD manifold toggle (keeps main GalleryCard unchanged).
 */
export function SandboxPreviewCard({
  program,
  onPreviewClick,
}: {
  program: SharedProgram;
  onPreviewClick?: (program: SharedProgram) => void;
}) {
  const isStrudel = program.modality === 'strudel';
  const hasVisualRender = !isStrudel;

  const [useManifold] = useState(true);

  const { containerRef } = useVisualPlayback(program.modality, program.code, { useManifold });

  const handleCardClick = useCallback(() => {
    onPreviewClick?.(program);
  }, [onPreviewClick, program]);

  return (
    <div className="gallery-card gallery-card--preview-only">
      {hasVisualRender ? (
        <div className="gallery-card-preview-wrapper" onClick={handleCardClick}>
          <div className={'gallery-card-preview ' + program.modality + '-preview'} ref={containerRef} />
        </div>
      ) : (
        <div className="gallery-card-preview strudel-preview" onClick={handleCardClick}>
          <StrudelHighlight code={program.code} />
        </div>
      )}
    </div>
  );
}
