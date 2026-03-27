import { create } from 'zustand';
import { SharedProgram } from '../types';
import { api } from '../api/client';
import { MOCK_SHARED_PROGRAMS } from '../mocks/galleryData';

const PER_PAGE = 9;

/** Map snake_case API response to camelCase SharedProgram */
function mapSharedProgram(raw: Record<string, unknown>): SharedProgram {
  return {
    id: raw.id as string,
    programId: (raw.programId ?? raw.program_id ?? '') as string,
    sharerName: (raw.sharerName ?? raw.sharer_name ?? '') as string,
    sharerUserId: (raw.sharerUserId ?? raw.sharer_user_id ?? undefined) as string | undefined,
    modality: raw.modality as string,
    code: raw.code as string,
    lineage: ((raw.lineage as unknown[]) ?? []).map((item) => { const lp = item as Record<string, unknown>; return ({
      id: lp.id as string,
      code: lp.code as string,
      originalCode: (lp.originalCode ?? lp.original_code ?? undefined) as string | undefined,
      customizedCode: (lp.customizedCode ?? lp.customized_code ?? undefined) as string | undefined,
      modality: lp.modality as string,
      generation: lp.generation as number,
      parentIds: (lp.parentIds ?? lp.parent_ids ?? []) as string[],
      guidance: (lp.guidance ?? '') as string,
      llmModel: (lp.llmModel ?? lp.llm_model ?? '') as string,
      contextProfile: (lp.contextProfile ?? lp.context_profile ?? '') as string,
      galleryOriginId: (lp.galleryOriginId ?? lp.gallery_origin_id ?? undefined) as string | undefined,
      galleryOriginName: (lp.galleryOriginName ?? lp.gallery_origin_name ?? undefined) as string | undefined,
    }); }),
    llmModel: (raw.llmModel ?? raw.llm_model ?? '') as string,
    likeCount: (raw.likeCount ?? raw.like_count ?? 0) as number,
    likedByMe: (raw.likedByMe ?? raw.liked_by_me ?? false) as boolean,
    createdAt: (raw.createdAt ?? raw.created_at ?? '') as string,
  };
}

export type GallerySortBy = 'newest' | 'most_liked';

let fetchRequestCounter = 0;

interface GalleryState {
  programs: SharedProgram[];
  total: number;
  page: number;
  modality: 'shader' | 'strudel' | 'openscad' | 'svg';
  sortBy: GallerySortBy;
  ownerUserId: string | null;
  isLoading: boolean;
  selectedProgram: SharedProgram | null;

  setModality: (mod: 'shader' | 'strudel' | 'openscad' | 'svg') => void;
  setSortBy: (sort: GallerySortBy) => void;
  setPage: (page: number) => void;
  setOwnerUserId: (userId: string | null) => void;
  fetchPrograms: (userId?: string) => Promise<void>;
  fetchProgramDetail: (id: string) => Promise<void>;
  addSharedProgram: (program: SharedProgram) => void;
  updateLike: (programId: string, liked: boolean, likeCount: number) => void;
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
  sortBy: 'newest',
  ownerUserId: null,
  isLoading: false,
  selectedProgram: null,

  setModality: (mod) => {
    set({ modality: mod, page: 1 });
    get().fetchPrograms();
  },

  setSortBy: (sort) => {
    set({ sortBy: sort, page: 1 });
    get().fetchPrograms();
  },

  setPage: (page) => {
    set({ page });
    get().fetchPrograms();
  },

  setOwnerUserId: (userId) => {
    set({ ownerUserId: userId, page: 1 });
  },

  fetchPrograms: async (userId?: string) => {
    const { modality, page, sortBy, ownerUserId } = get();
    const effectiveOwnerUserId = userId === undefined ? ownerUserId : userId;
    const requestId = ++fetchRequestCounter;

    // Keep filter state in sync when caller explicitly passes userId.
    if (userId !== undefined && userId !== ownerUserId) {
      set({ ownerUserId: userId });
    }

    set({ isLoading: true });
    try {
      let url = `/api/gallery/programs?modality=${modality}&page=${page}&per_page=${PER_PAGE}&sort_by=${sortBy}`;
      if (effectiveOwnerUserId) url += `&user_id=${effectiveOwnerUserId}`;
      const res = await api.get<{ items: Record<string, unknown>[]; total: number }>(url);
      if (requestId !== fetchRequestCounter) return;
      set({ programs: res.items.map(mapSharedProgram), total: res.total, isLoading: false });
    } catch {
      if (requestId !== fetchRequestCounter) return;
      // Fall back to mock data
      const { items, total } = getMockPrograms(modality, page);
      const filteredItems = effectiveOwnerUserId
        ? items.filter((p) => p.sharerUserId === effectiveOwnerUserId)
        : items;
      set({ programs: filteredItems, total: filteredItems.length, isLoading: false });
    }
  },

  fetchProgramDetail: async (id: string) => {
    set({ isLoading: true });
    try {
      const res = await api.get<Record<string, unknown>>(`/api/gallery/programs/${id}`);
      set({ selectedProgram: mapSharedProgram(res), isLoading: false });
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

  updateLike: (programId: string, liked: boolean, likeCount: number) => {
    set((state) => ({
      programs: state.programs.map((p) =>
        p.id === programId ? { ...p, likedByMe: liked, likeCount } : p,
      ),
      selectedProgram:
        state.selectedProgram?.id === programId
          ? { ...state.selectedProgram, likedByMe: liked, likeCount }
          : state.selectedProgram,
    }));
  },
}));
