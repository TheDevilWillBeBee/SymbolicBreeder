import { useLogStore, LogLevel } from '../store/logStore';

const ICONS: Record<LogLevel, string> = {
  info: 'i',
  success: '\u2713',
  warning: '!',
  error: '\u2717',
};

export function LogToasts() {
  const logs = useLogStore((s) => s.logs);
  const dismissLog = useLogStore((s) => s.dismissLog);

  if (logs.length === 0) return null;

  return (
    <div className="log-toast-container">
      {logs.map((entry) => (
        <div key={entry.id} className={`log-toast log-toast--${entry.level}`}>
          <span className="log-toast-icon">{ICONS[entry.level]}</span>
          <span className="log-toast-message">{entry.message}</span>
          <button
            className="log-toast-dismiss"
            onClick={() => dismissLog(entry.id)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
