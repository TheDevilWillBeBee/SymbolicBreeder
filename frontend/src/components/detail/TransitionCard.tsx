import { TransitionNode } from '../../utils/buildLayeredDAG';
import { useNavStore } from '../../store/navStore';

/** Shows evolution metadata (model, guidance, context profile) between two generations. */
export function TransitionCard({ transition }: { transition: TransitionNode }) {
  const guidance = transition.guidance || '';
  const truncated = guidance.length > 120 ? guidance.slice(0, 120) + '...' : guidance;

  if (transition.galleryOriginId) {
    const label = transition.galleryOriginName
      ? `${transition.galleryOriginName}'s program`
      : 'a gallery program';
    return (
      <div className="transition-card">
        <div className="transition-card-row">
          <span className="transition-gallery-origin">
            Bred from{' '}
            <a
              href={`/gallery/${transition.galleryOriginId}`}
              className="transition-gallery-link"
              onClick={(e) => {
                e.preventDefault();
                useNavStore.getState().goToDetail(transition.galleryOriginId!);
              }}
            >
              {label}
            </a>
          </span>
        </div>
        {guidance && (
          <div className="transition-guidance" title={guidance}>
            {truncated}
          </div>
        )}
      </div>
    );
  }

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
