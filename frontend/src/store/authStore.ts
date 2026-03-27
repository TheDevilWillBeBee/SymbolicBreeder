import { create } from 'zustand';
import { AuthUser, AuthResponse, LineageProgram } from '../types';
import { api } from '../api/client';

const TOKEN_KEY = 'symbolicBreeder_authToken';

export interface PendingShare {
  programId: string;
  code: string;
  modality: string;
  lineage: LineageProgram[];
  llmModel: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  pendingShare: PendingShare | null;

  login: (login: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  setPendingShare: (data: PendingShare | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isLoading: false,
  pendingShare: null,

  login: async (login: string, password: string) => {
    const res = await api.post<AuthResponse>('/api/auth/login', { login, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    set({ token: res.access_token, user: res.user });
  },

  register: async (username: string, email: string, password: string) => {
    const res = await api.post<AuthResponse>('/api/auth/register', { username, email, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    set({ token: res.access_token, user: res.user });
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ token: null, user: null, pendingShare: null });
  },

  checkAuth: async () => {
    const token = get().token;
    if (!token) return;
    set({ isLoading: true });
    try {
      const user = await api.get<AuthUser>('/api/auth/me');
      set({ user, isLoading: false });
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      set({ token: null, user: null, isLoading: false });
    }
  },

  setPendingShare: (data) => set({ pendingShare: data }),
}));
