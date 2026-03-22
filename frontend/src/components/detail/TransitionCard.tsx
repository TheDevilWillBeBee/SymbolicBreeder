import { TransitionNode } from '../../utils/buildLayeredDAG';

/** Shows evolution metadata (model, guidance, context profile) between two generations. */
export function TransitionCard({ transition }: { transition: TransitionNode }) {
  const guidance = transition.guidance || '';
  const truncated = guidance.length > 120 ? guidance.slice(0, 120) + '...' : guidance;

  return (
    <div className="transition-card">
      <div className="transition-card-row">
        {transition.llmModel && (
          <span className="transition-model">{transition.llmModel}</span>
        )}
        {transition.contextProfile && (
          <span className="transition-profile">{transition.contextProfile}</span>
        )}
      </div>
      <div className="transition-guidance" title={guidance || undefined}>
        {truncated || 'No guidance'}
      </div>
    </div>
  );
}
