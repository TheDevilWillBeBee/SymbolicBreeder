import { useSessionStore } from '../store/sessionStore';

export function GuidanceInput() {
  const guidance = useSessionStore((s) => s.guidance);
  const setGuidance = useSessionStore((s) => s.setGuidance);
  const modality = useSessionStore((s) => s.modality);

  const placeholder =
    modality === 'shader'
      ? 'Optional guidance: "more geometric", "add color", "make it spiral"…'
      : modality === 'openscad'
        ? 'Optional guidance: "more organic", "add symmetry", "make it taller"…'
        : 'Optional guidance: "make it darker", "add bass", "speed it up"…';

  return (
    <div className="guidance-input">
      <input
        type="text"
        placeholder={placeholder}
        value={guidance}
        onChange={(e) => setGuidance(e.target.value)}
      />
    </div>
  );
}
