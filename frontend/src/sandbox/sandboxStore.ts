import { create } from 'zustand';
import type { ModalityKey } from './api/sandboxClient';

export type SandboxTab = 'contexts' | 'quick-test' | 'data-cache' | 'compare';

interface SandboxNavState {
  modality: ModalityKey | null;
  tab: SandboxTab;
  setModality: (modality: ModalityKey | null) => void;
  setTab: (tab: SandboxTab) => void;
  goToTab: (modality: ModalityKey, tab: SandboxTab) => void;
}

const VALID_TABS: SandboxTab[] = ['contexts', 'quick-test', 'data-cache', 'compare'];
const VALID_MODALITIES: ModalityKey[] = ['strudel', 'shader', 'openscad', 'svg'];

function parseHash(hash: string): { modality: ModalityKey | null; tab: SandboxTab } {
  const clean = hash.replace(/^#\/?/, '');
  if (!clean) return { modality: null, tab: 'contexts' };
  const [m, t] = clean.split('/');
  const modality = (VALID_MODALITIES as string[]).includes(m) ? (m as ModalityKey) : null;
  const tab = (VALID_TABS as string[]).includes(t) ? (t as SandboxTab) : 'contexts';
  return { modality, tab };
}

function writeHash(modality: ModalityKey | null, tab: SandboxTab) {
  const hash = modality ? `#/${modality}/${tab}` : '#/';
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', hash);
  }
}

const initial = parseHash(typeof window !== 'undefined' ? window.location.hash : '');

export const useSandboxNav = create<SandboxNavState>((set, get) => ({
  modality: initial.modality,
  tab: initial.tab,
  setModality: (modality) => {
    set({ modality });
    writeHash(modality, get().tab);
  },
  setTab: (tab) => {
    set({ tab });
    writeHash(get().modality, tab);
  },
  goToTab: (modality, tab) => {
    set({ modality, tab });
    writeHash(modality, tab);
  },
}));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const { modality, tab } = parseHash(window.location.hash);
    useSandboxNav.setState({ modality, tab });
  });
}
