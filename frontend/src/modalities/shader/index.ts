import type { ModalityPlugin, RenderHandle } from '../../types';

/**
 * Shader modality plugin.
 *
 * Each card/preview gets its own WebGL context with a fullscreen quad.
 * User code is a mainImage() GLSL function wrapped in a standard shell.
 *
 * Supports two modes:
 * - Memoryless: simple fragment shader with iResolution + iTime
 * - Ping-pong buffer: reads previous frame via iBackBuffer, optional initImage
 *   for custom initialization. Auto-detected by presence of "iBackBuffer" in code.
 */

// ── WebGL boilerplate ──

const VERTEX_SHADER = `
attribute vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_HEADER = `
precision mediump float;

uniform vec2  iResolution;
uniform float iTime;

`;

const FRAGMENT_HEADER_BUFFER = `
precision mediump float;

uniform vec2  iResolution;
uniform float iTime;
uniform int   iFrame;
uniform sampler2D iBackBuffer;

`;

const FRAGMENT_FOOTER = `

void main() {
  vec4 col = vec4(0.0);
  mainImage(col, gl_FragCoord.xy);
  gl_FragColor = col;
}
`;

const FRAGMENT_FOOTER_INIT = `

void main() {
  vec4 col = vec4(0.0);
  initImage(col, gl_FragCoord.xy);
  gl_FragColor = col;
}
`;

function isBufferShader(code: string): boolean {
  return code.includes('iBackBuffer');
}

function hasInitImage(code: string): boolean {
  return code.includes('initImage');
}

function buildFragmentSource(userCode: string): string {
  const header = isBufferShader(userCode) ? FRAGMENT_HEADER_BUFFER : FRAGMENT_HEADER;
  return header + userCode + FRAGMENT_FOOTER;
}

function buildInitSource(userCode: string): string {
  return FRAGMENT_HEADER_BUFFER + userCode + FRAGMENT_FOOTER_INIT;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | string {
  const shader = gl.createShader(type);
  if (!shader) return 'Failed to create shader';
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Unknown compile error';
    gl.deleteShader(shader);
    return log;
  }
  return shader;
}

function linkProgram(
  gl: WebGLRenderingContext,
  vs: WebGLShader,
  fs: WebGLShader,
): WebGLProgram | string {
  const program = gl.createProgram();
  if (!program) return 'Failed to create program';
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Link error';
    gl.deleteProgram(program);
    return log;
  }
  return program;
}

// ── Ping-pong buffer helpers ──

interface PingPongState {
  fbos: [WebGLFramebuffer, WebGLFramebuffer];
  textures: [WebGLTexture, WebGLTexture];
  readIndex: number;
  width: number;
  height: number;
  frame: number;
  initProgram: WebGLProgram | null;
  uInitResolution: WebGLUniformLocation | null;
  uInitTime: WebGLUniformLocation | null;
  initDone: boolean;
}

function createTexture(gl: WebGLRenderingContext, w: number, h: number): WebGLTexture | null {
  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.bindTexture(gl.TEXTURE_2D, null);
  return tex;
}

function createPingPongResources(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
): { fbos: [WebGLFramebuffer, WebGLFramebuffer]; textures: [WebGLTexture, WebGLTexture] } | string {
  const texA = createTexture(gl, w, h);
  const texB = createTexture(gl, w, h);
  if (!texA || !texB) return 'Failed to create ping-pong textures';

  const fboA = gl.createFramebuffer();
  const fboB = gl.createFramebuffer();
  if (!fboA || !fboB) return 'Failed to create ping-pong framebuffers';

  gl.bindFramebuffer(gl.FRAMEBUFFER, fboA);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texA, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    return 'Framebuffer A incomplete';
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, fboB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texB, 0);
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    return 'Framebuffer B incomplete';
  }

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbos: [fboA, fboB], textures: [texA, texB] };
}

function resizePingPongTextures(
  gl: WebGLRenderingContext,
  pp: PingPongState,
  w: number,
  h: number,
): void {
  for (let i = 0; i < 2; i++) {
    gl.bindTexture(gl.TEXTURE_2D, pp.textures[i]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  }
  gl.bindTexture(gl.TEXTURE_2D, null);
  pp.width = w;
  pp.height = h;
  pp.initDone = false;
  pp.frame = 0;
}

function destroyPingPongResources(gl: WebGLRenderingContext, pp: PingPongState): void {
  gl.deleteFramebuffer(pp.fbos[0]);
  gl.deleteFramebuffer(pp.fbos[1]);
  gl.deleteTexture(pp.textures[0]);
  gl.deleteTexture(pp.textures[1]);
  if (pp.initProgram) gl.deleteProgram(pp.initProgram);
}

// ── Shader state ──

interface ShaderState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uResolution: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uFrame: WebGLUniformLocation | null;
  uBackBuffer: WebGLUniformLocation | null;
  raf: number;
  canvas: HTMLCanvasElement;
  pingPong: PingPongState | null;
  // Timing state for pause/resume/reset
  startTime: number;
  pausedElapsed: number;
  paused: boolean;
}

function setupWebGL(
  canvas: HTMLCanvasElement,
  userCode: string,
): ShaderState | string {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: false });
  if (!gl) return 'WebGL not supported';

  // Compile vertex shader (shared across all programs)
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  if (typeof vs === 'string') return vs;

  // Compile main fragment shader
  const fragSource = buildFragmentSource(userCode);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (typeof fs === 'string') return fs;

  // Link main program
  const program = linkProgram(gl, vs, fs);
  if (typeof program === 'string') return program;

  gl.useProgram(program);

  // Fullscreen quad (two triangles)
  const posAttr = gl.getAttribLocation(program, 'position');
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(posAttr);
  gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

  const isBuffer = isBufferShader(userCode);

  // Set up ping-pong resources for buffer shaders
  let pingPong: PingPongState | null = null;
  if (isBuffer) {
    const w = canvas.width || canvas.clientWidth || 256;
    const h = canvas.height || canvas.clientHeight || 256;
    const ppRes = createPingPongResources(gl, w, h);
    if (typeof ppRes === 'string') return ppRes;

    // Optionally compile init program
    let initProgram: WebGLProgram | null = null;
    let uInitResolution: WebGLUniformLocation | null = null;
    let uInitTime: WebGLUniformLocation | null = null;
    if (hasInitImage(userCode)) {
      const initSource = buildInitSource(userCode);
      const initFs = compileShader(gl, gl.FRAGMENT_SHADER, initSource);
      if (typeof initFs === 'string') return `initImage compile error: ${initFs}`;

      // Need a fresh vertex shader for the init program
      const vsInit = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
      if (typeof vsInit === 'string') return vsInit;

      const initProg = linkProgram(gl, vsInit, initFs);
      if (typeof initProg === 'string') return `initImage link error: ${initProg}`;
      initProgram = initProg;
      uInitResolution = gl.getUniformLocation(initProg, 'iResolution');
      uInitTime = gl.getUniformLocation(initProg, 'iTime');
    }

    pingPong = {
      ...ppRes,
      readIndex: 0,
      width: w,
      height: h,
      frame: 0,
      initProgram,
      uInitResolution,
      uInitTime,
      initDone: false,
    };
  }

  return {
    gl,
    program,
    uResolution: gl.getUniformLocation(program, 'iResolution'),
    uTime: gl.getUniformLocation(program, 'iTime'),
    uFrame: isBuffer ? gl.getUniformLocation(program, 'iFrame') : null,
    uBackBuffer: isBuffer ? gl.getUniformLocation(program, 'iBackBuffer') : null,
    raf: 0,
    canvas,
    pingPong,
    startTime: performance.now(),
    pausedElapsed: 0,
    paused: false,
  };
}

function startRenderLoop(state: ShaderState): void {
  const { gl, canvas, pingPong } = state;

  const draw = () => {
    const t = (performance.now() - state.startTime) / 1000.0;

    // Resize canvas to match display size
    const dw = canvas.clientWidth;
    const dh = canvas.clientHeight;
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }

    const w = gl.drawingBufferWidth;
    const h = gl.drawingBufferHeight;

    if (pingPong) {
      // Resize ping-pong textures if canvas size changed
      if (pingPong.width !== w || pingPong.height !== h) {
        resizePingPongTextures(gl, pingPong, w, h);
      }

      // Run init shader on first frame (if initImage exists)
      if (!pingPong.initDone) {
        if (pingPong.initProgram) {
          gl.useProgram(pingPong.initProgram);
          gl.viewport(0, 0, w, h);
          gl.uniform2f(pingPong.uInitResolution, w, h);
          gl.uniform1f(pingPong.uInitTime, t);

          // Init both buffers
          for (let i = 0; i < 2; i++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, pingPong.fbos[i]);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
          }
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        pingPong.initDone = true;
        pingPong.frame = 0;
      }

      const readIdx = pingPong.readIndex;
      const writeIdx = 1 - readIdx;

      gl.useProgram(state.program);
      gl.viewport(0, 0, w, h);
      gl.uniform2f(state.uResolution, w, h);
      gl.uniform1f(state.uTime, t);
      gl.uniform1i(state.uFrame, pingPong.frame);

      // Bind read texture to unit 0
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pingPong.textures[readIdx]);
      gl.uniform1i(state.uBackBuffer, 0);

      // Simulation step: render to write FBO
      gl.bindFramebuffer(gl.FRAMEBUFFER, pingPong.fbos[writeIdx]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Screen pass: render to screen reading from the just-written buffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.bindTexture(gl.TEXTURE_2D, pingPong.textures[writeIdx]);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Swap buffers
      pingPong.readIndex = writeIdx;
      pingPong.frame++;
    } else {
      // Memoryless shader: simple draw
      gl.viewport(0, 0, w, h);
      gl.uniform2f(state.uResolution, w, h);
      gl.uniform1f(state.uTime, t);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    state.raf = requestAnimationFrame(draw);
  };

  state.raf = requestAnimationFrame(draw);
}

function showError(container: HTMLElement, error: string): void {
  container.innerHTML = '';
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText =
    'display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
    'background:#1a0a0a;color:#ef4444;font-size:0.7rem;padding:0.5rem;' +
    'font-family:monospace;word-break:break-all;overflow:auto;border:1px solid #ef4444;' +
    'border-radius:4px;';
  errorDiv.textContent = error;
  container.appendChild(errorDiv);
}

function renderShader(code: string, container: HTMLElement): RenderHandle {
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:4px;';
  container.appendChild(canvas);

  const result = setupWebGL(canvas, code);
  if (typeof result === 'string') {
    showError(container, result);
    return {
      cleanup() {
        container.innerHTML = '';
      },
    };
  }

  startRenderLoop(result);

  // IntersectionObserver for performance: pause offscreen canvases
  let isVisible = true;
  let userPaused = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          if (entry.isIntersecting && !isVisible) {
            isVisible = true;
            if (!userPaused) startRenderLoop(result);
          } else if (!entry.isIntersecting && isVisible) {
            isVisible = false;
            cancelAnimationFrame(result.raf);
          }
        }
      }
    },
    { threshold: 0.01 },
  );
  observer.observe(canvas);

  return {
    cleanup() {
      observer.disconnect();
      cancelAnimationFrame(result.raf);
      if (result.pingPong) {
        destroyPingPongResources(result.gl, result.pingPong);
      }
      const ext = result.gl.getExtension('WEBGL_lose_context');
      ext?.loseContext();
      container.innerHTML = '';
    },
    pause() {
      if (userPaused) return;
      userPaused = true;
      result.pausedElapsed = performance.now() - result.startTime;
      cancelAnimationFrame(result.raf);
    },
    resume() {
      if (!userPaused) return;
      userPaused = false;
      // Adjust startTime so elapsed time continues from where it was
      result.startTime = performance.now() - result.pausedElapsed;
      if (isVisible) startRenderLoop(result);
    },
    reset() {
      cancelAnimationFrame(result.raf);
      result.startTime = performance.now();
      result.pausedElapsed = 0;
      // Re-init ping-pong buffers
      if (result.pingPong) {
        result.pingPong.initDone = false;
        result.pingPong.readIndex = 0;
        result.pingPong.frame = 0;
      }
      userPaused = false;
      if (isVisible) startRenderLoop(result);
    },
  };
}

// ── Plugin implementation ──

export const shaderPlugin: ModalityPlugin = {
  key: 'shader',
  label: 'Shader',
  language: 'glsl',
  description: 'Animated GLSL visuals — evolve mesmerizing fragment shaders',

  render(code: string, container: HTMLElement): RenderHandle {
    return renderShader(code, container);
  },

  previewInModal(code: string, container: HTMLElement): RenderHandle {
    return renderShader(code, container);
  },

  validate(code: string): string | null {
    if (!code.includes('mainImage')) {
      return 'Shader must contain a mainImage function';
    }
    if (!code.includes('fragColor')) {
      return 'Shader must write to fragColor';
    }
    return null;
  },
};
