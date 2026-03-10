import type { ModalityPlugin } from '../../types';

/**
 * Shader modality plugin.
 *
 * Each card/preview gets its own WebGL context with a fullscreen quad.
 * User code is a mainImage() GLSL function wrapped in a standard shell.
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
uniform float uSin;
uniform float uCos;

`;

const FRAGMENT_FOOTER = `

void main() {
  vec4 col = vec4(0.0);
  mainImage(col, gl_FragCoord.xy);
  gl_FragColor = col;
}
`;

function buildFragmentSource(userCode: string): string {
  return FRAGMENT_HEADER + userCode + FRAGMENT_FOOTER;
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

interface ShaderState {
  gl: WebGLRenderingContext;
  program: WebGLProgram;
  uResolution: WebGLUniformLocation | null;
  uSin: WebGLUniformLocation | null;
  uCos: WebGLUniformLocation | null;
  raf: number;
  canvas: HTMLCanvasElement;
}

function setupWebGL(
  canvas: HTMLCanvasElement,
  userCode: string,
): ShaderState | string {
  const gl = canvas.getContext('webgl', { preserveDrawingBuffer: false });
  if (!gl) return 'WebGL not supported';

  // Compile vertex shader
  const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  if (typeof vs === 'string') return vs;

  // Compile fragment shader
  const fragSource = buildFragmentSource(userCode);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSource);
  if (typeof fs === 'string') return fs;

  // Link program
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

  return {
    gl,
    program,
    uResolution: gl.getUniformLocation(program, 'iResolution'),
    uSin: gl.getUniformLocation(program, 'uSin'),
    uCos: gl.getUniformLocation(program, 'uCos'),
    raf: 0,
    canvas,
  };
}

function startRenderLoop(state: ShaderState): void {
  const { gl, canvas } = state;
  const TWO_PI_OVER_5 = (2.0 * Math.PI) / 5.0;

  const draw = () => {
    const t = performance.now() / 1000.0;
    const phase = t * TWO_PI_OVER_5;

    // Resize canvas to match display size
    const dw = canvas.clientWidth;
    const dh = canvas.clientHeight;
    if (canvas.width !== dw || canvas.height !== dh) {
      canvas.width = dw;
      canvas.height = dh;
    }

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform2f(state.uResolution, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(state.uSin, Math.sin(phase));
    gl.uniform1f(state.uCos, Math.cos(phase));
    gl.drawArrays(gl.TRIANGLES, 0, 6);

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

function renderShader(code: string, container: HTMLElement): () => void {
  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:4px;';
  container.appendChild(canvas);

  const result = setupWebGL(canvas, code);
  if (typeof result === 'string') {
    showError(container, result);
    return () => {
      container.innerHTML = '';
    };
  }

  startRenderLoop(result);

  // IntersectionObserver for performance: pause offscreen canvases
  let isVisible = true;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target === canvas) {
          if (entry.isIntersecting && !isVisible) {
            isVisible = true;
            startRenderLoop(result);
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

  return () => {
    observer.disconnect();
    cancelAnimationFrame(result.raf);
    const ext = result.gl.getExtension('WEBGL_lose_context');
    ext?.loseContext();
    container.innerHTML = '';
  };
}

// ── Plugin implementation ──

export const shaderPlugin: ModalityPlugin = {
  key: 'shader',
  label: 'Shader',
  language: 'glsl',
  description: 'Animated GLSL visuals — evolve mesmerizing fragment shaders',

  render(code: string, container: HTMLElement): () => void {
    return renderShader(code, container);
  },

  previewInModal(code: string, container: HTMLElement): () => void {
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
