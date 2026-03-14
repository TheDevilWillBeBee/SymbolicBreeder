import { create } from 'zustand';

export type LogLevel = 'info' | 'success' | 'warning' | 'error';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: number;
}

interface LogState {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string) => void;
  dismissLog: (id: string) => void;
}

const AUTO_DISMISS_MS: Record<LogLevel, number> = {
  info: 5000,
  success: 5000,
  warning: 6000,
  error: 8000,
};

export const useLogStore = create<LogState>((set) => ({
  logs: [],

  addLog: (level, message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      logs: [...state.logs, { id, level, message, timestamp: Date.now() }],
    }));
    setTimeout(() => {
      set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
    }, AUTO_DISMISS_MS[level]);
  },

  dismissLog: (id) =>
    set((state) => ({ logs: state.logs.filter((l) => l.id !== id) })),
}));
