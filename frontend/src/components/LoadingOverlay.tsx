interface Props {
  message: string;
  hint?: string;
}

export function LoadingOverlay({ message, hint }: Props) {
  return (
    <div className="loading-overlay">
      <div className="loading-card">
        <div className="loading-spinner" />
        <p>{message}</p>
        {hint && <span className="loading-hint">{hint}</span>}
      </div>
    </div>
  );
}
