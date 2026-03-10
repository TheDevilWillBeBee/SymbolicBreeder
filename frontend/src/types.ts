// ── Core domain types ──

export interface Program {
  id: string;
  code: string;
  modality: string;
  generation: number;
  parentIds: string[];
  sessionId: string;
  createdAt: string;
}

export interface Session {
  id: string;
  name: string;
  modality: string;
  createdAt: string;
}

// ── API types ──

export interface EvolveRequest {
  modality: string;
  parents: { id: string; code: string }[];
  guidance?: string;
  population_size?: number;
  session_id?: string;
}

export interface EvolveResponse {
  programs: Program[];
  generation: number;
}

// ── Modality plugin interface ──

export interface ModalityPlugin {
  /** Unique key: "strudel" | "shader" */
  key: string;
  /** Display name */
  label: string;
  /** Syntax highlighting language for Monaco */
  language: string;
  /** Short description for ModalitySelector */
  description: string;

  /**
   * Renders a live preview into the provided container element.
   * Returns a cleanup function.
   */
  render(code: string, container: HTMLElement): () => void;

  /**
   * Called when the user presses Preview in CustomizeModal.
   * Renders/plays the program into the preview container.
   * Returns a cleanup function.
   */
  previewInModal(code: string, container: HTMLElement): () => void;

  /**
   * Validate/lint code before submission (optional).
   * Returns error message or null.
   */
  validate?(code: string): string | null;
}
