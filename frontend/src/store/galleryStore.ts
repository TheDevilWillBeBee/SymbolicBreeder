import { create } from 'zustand';
import { SharedProgram } from '../types';
import { api } from '../api/client';
import { MOCK_SHARED_PROGRAMS } from '../mocks/galleryData';

const PER_PAGE = 20;

interface GalleryState {
  programs: SharedProgram[];
  total: number;
  page: number;
  modality: 'shader' | 'strudel';
  isLoading: boolean;
  selectedProgram: SharedProgram | null;

  setModality: (mod: 'shader' | 'strudel') => void;
  setPage: (page: number) => void;
  fetchPrograms: () => Promise<void>;
  fetchProgramDetail: (id: string) => Promise<void>;
  addSharedProgram: (program: SharedProgram) => void;
}

function getMockPrograms(modality: string, page: number) {
  // Include any locally shared programs from sessionStorage
  const localRaw = sessionStorage.getItem('symbolicBreeder_localShared');
  const localPrograms: SharedProgram[] = localRaw ? JSON.parse(localRaw) : [];
  const all = [...localPrograms, ...MOCK_SHARED_PROGRAMS].filter(
    (p) => p.modality === modality,
  );
  const start = (page - 1) * PER_PAGE;
  return { items: all.slice(start, start + PER_PAGE), total: all.length };
}

export const useGalleryStore = create<GalleryState>((set, get) => ({
  programs: [],
  total: 0,
  page: 1,
  modality: 'shader',
  isLoading: false,
  selectedProgram: null,

  setModality: (mod) => {
    set({ modality: mod, page: 1 });
    get().fetchPrograms();
  },

  setPage: (page) => {
    set({ page });
    get().fetchPrograms();
  },

  fetchPrograms: async () => {
    const { modality, page } = get();
    set({ isLoading: true });
    try {
      const res = await api.get<{ items: SharedProgram[]; total: number }>(
        `/api/gallery/programs?modality=${modality}&page=${page}&per_page=${PER_PAGE}`,
      );
      set({ programs: res.items, total: res.total, isLoading: false });
    } catch {
      // Fall back to mock data
      const { items, total } = getMockPrograms(modality, page);
      set({ programs: items, total, isLoading: false });
    }
  },

  fetchProgramDetail: async (id: string) => {
    set({ isLoading: true });
    try {
      const res = await api.get<SharedProgram>(`/api/gallery/programs/${id}`);
      set({ selectedProgram: res, isLoading: false });
    } catch {
      // Fall back to mock
      const localRaw = sessionStorage.getItem('symbolicBreeder_localShared');
      const localPrograms: SharedProgram[] = localRaw ? JSON.parse(localRaw) : [];
      const all = [...localPrograms, ...MOCK_SHARED_PROGRAMS];
      const found = all.find((p) => p.id === id) ?? null;
      set({ selectedProgram: found, isLoading: false });
    }
  },

  addSharedProgram: (program: SharedProgram) => {
    // Store locally for mock mode
    const localRaw = sessionStorage.getItem('symbolicBreeder_localShared');
    const localPrograms: SharedProgram[] = localRaw ? JSON.parse(localRaw) : [];
    localPrograms.unshift(program);
    sessionStorage.setItem('symbolicBreeder_localShared', JSON.stringify(localPrograms));
  },
}));
