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

// ── Per-generation evolution metadata ──

export interface GenerationMeta {
  guidance: string;
  llmModel: string;
  contextProfile: string;
}

// ── Gallery types ──

export interface LineageProgram {
  id: string;
  code: string;
  originalCode?: string;
  customizedCode?: string;
  modality: string;
  generation: number;
  parentIds: string[];
  guidance?: string;
  llmModel?: string;
  contextProfile?: string;
  /** If this seed was bred from a gallery item, the SharedProgram id */
  galleryOriginId?: string;
  /** Sharer name of the gallery item this was bred from */
  galleryOriginName?: string;
}

export interface SharedProgram {
  id: string;
  programId: string;
  sharerName: string;
  sharerUserId?: string;
  modality: string;
  code: string;
  lineage: LineageProgram[];
  llmModel: string;
  likeCount?: number;
  likedByMe?: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface SignupChallengeResponse {
  challenge_id: string;
  email: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

export interface SignupResendResponse {
  challenge_id: string;
  expires_in_seconds: number;
  resend_after_seconds: number;
}

// ── Render options passed to plugin render methods ──

export interface RenderOptions {
  /** Use Manifold backend for OpenSCAD compilation (default: true). */
  useManifold?: boolean;
}

// ── Modality plugin interface ──

export interface ModalityPlugin {
  /** Unique key: "strudel" | "shader" | "openscad" | "svg" */
  key: string;
  /** Display name */
  label: string;
  /** Icon shown in the ModalitySelector tile */
  icon: string;
  /** Syntax highlighting language for Monaco */
  language: string;
  /** Short description for ModalitySelector */
  description: string;

  /**
   * Renders a live preview into the provided container element.
   * Returns a RenderHandle with cleanup and optional pause/resume/reset.
   */
  render(code: string, container: HTMLElement, options?: RenderOptions): RenderHandle;

  /**
   * Called when the user presses Preview in CustomizeModal.
   * Renders/plays the program into the preview container.
   * Returns a RenderHandle with cleanup and optional pause/resume/reset.
   */
  previewInModal(code: string, container: HTMLElement, options?: RenderOptions): RenderHandle;

  /**
   * Validate/lint code before submission (optional).
   * Returns error message or null.
   */
  validate?(code: string): string | null;

  /**
   * Render a single-frame snapshot and return the canvas.
   * Uses preserveDrawingBuffer: true so the result is readable.
   */
  renderSnapshot?(code: string, width: number, height: number): HTMLCanvasElement | null;

  /**
   * Async snapshot (SVG decode, or guaranteed post-compile OpenSCAD mesh).
   * Prefer in grids; avoids WebGL/SVG races when many thumbnails mount at once.
   */
  renderSnapshotAsync?(code: string, width: number, height: number): Promise<HTMLCanvasElement | null>;

  /**
   * Pre-compile/prepare the code so that renderSnapshot can produce a result.
   * Returns a promise that resolves when compilation is done.
   */
  ensureCompiled?(code: string): Promise<void>;
}
