import { create } from 'zustand';
import {
  AuthUser,
  AuthResponse,
  LineageProgram,
  SignupChallengeResponse,
  SignupResendResponse,
} from '../types';
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

  login: (login: string, password: string) => Promise<AuthUser>;
  startSignup: (username: string, email: string, password: string) => Promise<SignupChallengeResponse>;
  verifySignupCode: (challengeId: string, code: string) => Promise<AuthUser>;
  resendSignupCode: (challengeId: string) => Promise<SignupResendResponse>;
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
    return res.user;
  },

  startSignup: async (username: string, email: string, password: string) => {
    const res = await api.post<SignupChallengeResponse>('/api/auth/register', { username, email, password });
    return res;
  },

  verifySignupCode: async (challengeId: string, code: string) => {
    const res = await api.post<AuthResponse>('/api/auth/register/verify', {
      challenge_id: challengeId,
      code,
    });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    set({ token: res.access_token, user: res.user });
    return res.user;
  },

  resendSignupCode: async (challengeId: string) => {
    const res = await api.post<SignupResendResponse>('/api/auth/register/resend', {
      challenge_id: challengeId,
    });
    return res;
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
