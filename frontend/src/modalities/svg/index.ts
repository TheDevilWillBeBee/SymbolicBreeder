import type { ModalityPlugin, RenderHandle } from '../../types';

/**
 * SVG modality plugin.
 *
 * Renders inline SVG markup via innerHTML. Supports static SVG and
 * declarative animations (SMIL <animate> and CSS @keyframes).
 * Scripts and event handlers are stripped for security.
 */

/** Strip <script> tags and event handler attributes from SVG markup. */
function sanitizeSVG(raw: string): string {
  // Remove <script> blocks
  let clean = raw.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
  // Remove event handler attributes (on*)
  clean = clean.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  return clean;
}

function renderSVG(code: string, container: HTMLElement): RenderHandle {
  container.innerHTML = '';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:hidden;';
  wrapper.innerHTML = sanitizeSVG(code);

  // Scale SVG to fit container
  const svg = wrapper.querySelector('svg');
  if (svg) {
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.maxWidth = '100%';
    svg.style.maxHeight = '100%';
  }

  container.appendChild(wrapper);

  return {
    cleanup() {
      container.innerHTML = '';
    },
  };
}

function renderSnapshotCanvas(
  code: string,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  // Render SVG to canvas via Image + blob URL
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fill with a dark background so the snapshot isn't transparent
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, width, height);

  const sanitized = sanitizeSVG(code);
  const blob = new Blob([sanitized], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;

  // Try synchronous draw (works if image is cached or very fast)
  try {
    ctx.drawImage(img, 0, 0, width, height);
  } catch {
    // Image not loaded yet — snapshot will be blank background
  }
  URL.revokeObjectURL(url);

  return canvas;
}

export const svgPlugin: ModalityPlugin = {
  key: 'svg',
  label: 'SVG',
  language: 'xml',
  description: 'Vector graphics & logos — evolve SVG designs and symbols',

  render(code: string, container: HTMLElement): RenderHandle {
    return renderSVG(code, container);
  },

  previewInModal(code: string, container: HTMLElement): RenderHandle {
    return renderSVG(code, container);
  },

  renderSnapshot(code: string, width: number, height: number): HTMLCanvasElement | null {
    return renderSnapshotCanvas(code, width, height);
  },

  validate(code: string): string | null {
    if (!code.includes('<svg')) {
      return 'Must contain an <svg> element';
    }
    if (!code.includes('</svg>')) {
      return 'SVG tag must be properly closed';
    }
    return null;
  },
};
