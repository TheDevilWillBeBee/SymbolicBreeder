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
  context_profile?: string;
}

export interface EvolveResponse {
  programs: Program[];
  generation: number;
}

// ── Render handle returned by plugin render methods ──

export interface RenderHandle {
  /** Tear down the renderer and free resources. */
  cleanup(): void;
  /** Pause animation / playback (optional). */
  pause?(): void;
  /** Resume animation / playback (optional). */
  resume?(): void;
  /** Restart from the beginning (reset time, re-init buffers, etc.). */
  reset?(): void;
}

// ── Gallery types ──

export interface LineageProgram {
  id: string;
  code: string;
  modality: string;
  generation: number;
  parentIds: string[];
}

export interface SharedProgram {
  id: string;
  programId: string;
  sharerName: string;
  modality: string;
  code: string;
  lineage: LineageProgram[];
  llmModel: string;
  createdAt: string;
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
   * Returns a RenderHandle with cleanup and optional pause/resume/reset.
   */
  render(code: string, container: HTMLElement): RenderHandle;

  /**
   * Called when the user presses Preview in CustomizeModal.
   * Renders/plays the program into the preview container.
   * Returns a RenderHandle with cleanup and optional pause/resume/reset.
   */
  previewInModal(code: string, container: HTMLElement): RenderHandle;

  /**
   * Validate/lint code before submission (optional).
   * Returns error message or null.
   */
  validate?(code: string): string | null;
}
