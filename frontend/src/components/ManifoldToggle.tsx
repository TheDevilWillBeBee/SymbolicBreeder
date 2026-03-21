interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ManifoldToggle({ checked, onChange }: Props) {
  return (
    <label
      className="manifold-toggle"
      title="Use Manifold backend for faster geometry compilation"
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>Manifold</span>
    </label>
  );
}
