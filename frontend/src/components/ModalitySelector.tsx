import { modalityRegistry } from '../modalityRegistry';

interface Props {
  onSelect: (modality: string) => void;
}

export function ModalitySelector({ onSelect }: Props) {
  const plugins = Object.values(modalityRegistry);

  return (
    <div className="modality-selector">
      <div className="modality-tiles">
        {plugins.map((plugin) => (
          <button
            key={plugin.key}
            className="modality-tile"
            onClick={() => onSelect(plugin.key)}
          >
            <div className="modality-tile-icon">
              {plugin.key === 'strudel' ? '♪' : plugin.key === 'shader' ? '◆' : plugin.key === 'openscad' ? '⬡' : '◇'}
            </div>
            <div className="modality-tile-label">{plugin.label}</div>
            <div className="modality-tile-desc">{plugin.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
