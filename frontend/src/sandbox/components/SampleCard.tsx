import { useMemo } from 'react';
import { SandboxStaticThumbnail } from '../SandboxStaticThumbnail';
import type { ModalityKey, SampleItem } from '../api/sandboxClient';

interface Props {
  sample: Pick<
    SampleItem,
    'id' | 'modality' | 'code' | 'context_version' | 'model' | 'source' | 'error'
  > & {
    /** Optional override for the version label shown on the chip (e.g. "v3" or "app"). */
    versionLabel?: string;
  };
  onOpen?: (id: string) => void;
}

export function SampleCard({ sample, onOpen }: Props) {
  const modality = sample.modality as ModalityKey;
  const versionLabel =
    sample.versionLabel ?? (sample.context_version ? sample.context_version : 'app');

  const handleOpen = () => onOpen?.(sample.id);

  const previewBody = useMemo(() => {
    if (sample.error && !sample.code) {
      return (
        <div className="sbx-sample-card-error" title={sample.error}>
          {sample.error.slice(0, 80)}
        </div>
      );
    }
    if (modality === 'strudel') {
      const trimmed = sample.code.slice(0, 280);
      return (
        <div className="sbx-sample-card-preview-strudel">{trimmed}</div>
      );
    }
    return (
      <SandboxStaticThumbnail
        modality={modality as 'shader' | 'openscad' | 'svg'}
        code={sample.code}
        onOpen={handleOpen}
      />
    );
  }, [modality, sample.code, sample.error, handleOpen]);

  return (
    <div
      className="sbx-sample-card"
      onClick={handleOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleOpen();
        }
      }}
      title={sample.model}
    >
      <div className="sbx-sample-card-preview">{previewBody}</div>
      <div className="sbx-sample-card-footer">
        <span className="sbx-sample-card-tag" title="Context version">
          {versionLabel}
        </span>
        <span
          className={
            'sbx-sample-card-tag' +
            (sample.source === 'mock' ? ' sbx-sample-card-source-mock' : '')
          }
          title={sample.source === 'mock' ? 'Mock fallback' : 'LLM output'}
        >
          {sample.source}
        </span>
      </div>
    </div>
  );
}
