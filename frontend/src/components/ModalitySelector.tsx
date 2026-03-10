import { modalityRegistry } from '../modalityRegistry';
import { useSessionStore } from '../store/sessionStore';

interface Props {
  onSelect: (modality: string) => void;
}

export function ModalitySelector({ onSelect }: Props) {
  const plugins = Object.values(modalityRegistry);

  return (
    <div className="modality-selector">
      <h2 className="modality-title">Choose Your Medium</h2>
      <p className="modality-subtitle">
        Select a modality to begin evolving programs
      </p>
      <div className="modality-tiles">
        {plugins.map((plugin) => (
          <button
            key={plugin.key}
            className="modality-tile"
            onClick={() => onSelect(plugin.key)}
          >
            <div className="modality-tile-icon">
              {plugin.key === 'strudel' ? '♪' : '◆'}
            </div>
            <div className="modality-tile-label">{plugin.label}</div>
            <div className="modality-tile-desc">{plugin.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
