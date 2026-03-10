import { create } from 'zustand';
import { Program, Session } from '../types';

interface SessionState {
  // Core state
  session: Session | null;
  modality: string | null;
  generations: Program[][];
  currentGeneration: number;
  selectedProgramIds: Set<string>;
  playingProgramId: string | null;
  guidance: string;
  isEvolving: boolean;
  isLoading: boolean;
  customizedPrograms: Record<string, string>;

  // Actions
  setSession: (session: Session) => void;
  setModality: (modality: string) => void;
  addGeneration: (programs: Program[]) => void;
  setCurrentGeneration: (gen: number) => void;
  toggleProgramSelection: (programId: string) => void;
  clearSelection: () => void;
  setPlayingProgramId: (programId: string | null) => void;
  setGuidance: (text: string) => void;
  setIsEvolving: (v: boolean) => void;
  setIsLoading: (v: boolean) => void;
  setCustomizedCode: (programId: string, code: string) => void;
  reset: () => void;
}

const initialState = {
  session: null,
  modality: null,
  generations: [] as Program[][],
  currentGeneration: 0,
  selectedProgramIds: new Set<string>(),
  playingProgramId: null,
  guidance: '',
  isEvolving: false,
  isLoading: false,
  customizedPrograms: {} as Record<string, string>,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  setSession: (session) => set({ session }),

  setModality: (modality) => set({ modality }),

  addGeneration: (programs) =>
    set((state) => {
      const newGens = [...state.generations, programs];
      return {
        generations: newGens,
        currentGeneration: newGens.length - 1,
        selectedProgramIds: new Set<string>(),
      };
    }),

  setCurrentGeneration: (gen) =>
    set({ currentGeneration: gen, selectedProgramIds: new Set<string>() }),

  toggleProgramSelection: (programId) =>
    set((state) => {
      const next = new Set(state.selectedProgramIds);
      if (next.has(programId)) next.delete(programId);
      else next.add(programId);
      return { selectedProgramIds: next };
    }),

  clearSelection: () => set({ selectedProgramIds: new Set<string>() }),
  setPlayingProgramId: (programId) => set({ playingProgramId: programId }),
  setGuidance: (text) => set({ guidance: text }),
  setIsEvolving: (v) => set({ isEvolving: v }),
  setIsLoading: (v) => set({ isLoading: v }),

  setCustomizedCode: (programId, code) =>
    set((state) => ({
      customizedPrograms: { ...state.customizedPrograms, [programId]: code },
    })),

  reset: () => set({ ...initialState, selectedProgramIds: new Set<string>() }),
}));
