import { create } from 'zustand';

export type View = 'landing' | 'breeding' | 'gallery' | 'program-detail' | 'about';

interface NavState {
  view: View;
  detailProgramId: string | null;
  goToLanding: () => void;
  goToBreeding: () => void;
  goToGallery: () => void;
  goToDetail: (id: string) => void;
  goToAbout: () => void;
}

function viewToPath(view: View, detailId?: string | null): string {
  switch (view) {
    case 'landing': return '/';
    case 'breeding': return '/breed';
    case 'gallery': return '/gallery';
    case 'program-detail': return `/gallery/${detailId}`;
    case 'about': return '/about';
  }
}

function parsePathname(): { view: View; detailProgramId: string | null } {
  const path = window.location.pathname;
  if (path.startsWith('/gallery/') && path.length > '/gallery/'.length) {
    return { view: 'program-detail', detailProgramId: path.slice('/gallery/'.length) };
  }
  if (path === '/gallery') return { view: 'gallery', detailProgramId: null };
  if (path === '/breed') return { view: 'breeding', detailProgramId: null };
  if (path === '/about') return { view: 'about', detailProgramId: null };
  // Support old /community URLs
  if (path.startsWith('/community/') && path.length > '/community/'.length) {
    return { view: 'program-detail', detailProgramId: path.slice('/community/'.length) };
  }
  if (path === '/community') return { view: 'gallery', detailProgramId: null };
  return { view: 'landing', detailProgramId: null };
}

const initial = parsePathname();

export const useNavStore = create<NavState>((set) => ({
  view: initial.view,
  detailProgramId: initial.detailProgramId,

  goToLanding: () => {
    history.pushState(null, '', '/');
    set({ view: 'landing', detailProgramId: null });
  },
  goToBreeding: () => {
    history.pushState(null, '', '/breed');
    set({ view: 'breeding', detailProgramId: null });
  },
  goToGallery: () => {
    history.pushState(null, '', '/gallery');
    set({ view: 'gallery', detailProgramId: null });
  },
  goToDetail: (id: string) => {
    history.pushState(null, '', `/gallery/${id}`);
    set({ view: 'program-detail', detailProgramId: id });
  },
  goToAbout: () => {
    history.pushState(null, '', '/about');
    set({ view: 'about', detailProgramId: null });
  },
}));

// Handle browser back/forward
window.addEventListener('popstate', () => {
  const { view, detailProgramId } = parsePathname();
  useNavStore.setState({ view, detailProgramId });
});
