import { useSessionStore } from '../store/sessionStore';

export function GenerationInfo() {
  const currentGeneration = useSessionStore((s) => s.currentGeneration);
  const generationMeta = useSessionStore((s) => s.generationMeta);

  const meta = generationMeta[currentGeneration];
  if (!meta || (!meta.llmModel && !meta.guidance)) return null;

  return (
    <div className="generation-info">
      {meta.llmModel && (
        <>
          <span className="generation-info-label">Model:</span>
          <span className="generation-info-model">{meta.llmModel}</span>
        </>
      )}
      {meta.guidance && (
        <>
          <span className="generation-info-label">Guidance:</span>
          <span className="generation-info-guidance">
            &ldquo;{meta.guidance}&rdquo;
          </span>
        </>
      )}
    </div>
  );
}
