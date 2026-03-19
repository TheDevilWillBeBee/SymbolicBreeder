import type { ModalityPlugin, RenderHandle } from '../../types';

/**
 * OpenSCAD modality plugin.
 *
 * Compiles OpenSCAD code to STL via the openscad-wasm module,
 * then renders the mesh with Three.js and OrbitControls.
 * Each card gets its own WebGL context and interactive 3D viewport.
 */

// ── Lazy-loaded module references ──

let THREE: typeof import('three') | null = null;
let OrbitControlsCtor: any = null;
let STLLoaderCtor: any = null;

let threeLoadPromise: Promise<void> | null = null;

async function ensureThree(): Promise<void> {
  if (THREE) return;
  if (threeLoadPromise) { await threeLoadPromise; return; }
  threeLoadPromise = (async () => {
    const [core, oc, sl] = await Promise.all([
      import('three'),
      import('three/examples/jsm/controls/OrbitControls.js'),
      import('three/examples/jsm/loaders/STLLoader.js'),
    ]);
    THREE = core;
    OrbitControlsCtor = oc.OrbitControls;
    STLLoaderCtor = sl.STLLoader;
  })();
  await threeLoadPromise;
}

// ── STL compilation via Web Worker ──
// OpenSCAD WASM's Emscripten closure has global state that prevents
// multiple compilations in the same JS context. Each compilation runs
// in a disposable Worker with its own fresh module scope.

const stlCache = new Map<string, string>();

function compileInWorker(code: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('./compiler.worker.ts', import.meta.url),
      { type: 'module' },
    );
    worker.onmessage = (e: MessageEvent<{ ok: boolean; stl?: string; error?: string }>) => {
      worker.terminate();
      if (e.data.ok) resolve(e.data.stl!);
      else reject(new Error(e.data.error || 'Compilation failed'));
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(new Error(e.message || 'Worker error'));
    };
    worker.postMessage({ code });
  });
}

async function compileToSTL(code: string): Promise<string> {
  const cached = stlCache.get(code);
  if (cached) return cached;
  const stl = await compileInWorker(code);
  stlCache.set(code, stl);
  return stl;
}

// ── Three.js scene builder ──

function buildScene(
  container: HTMLElement,
  stlText: string,
): RenderHandle {
  const T = THREE!;

  const loader = new STLLoaderCtor();
  const geometry: import('three').BufferGeometry = loader.parse(stlText);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  const bbox = geometry.boundingBox!;
  const center = new T.Vector3();
  bbox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  const size = new T.Vector3();
  bbox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;

  // Scene
  const scene = new T.Scene();
  scene.background = new T.Color(0x12121e);

  // Mesh
  const material = new T.MeshStandardMaterial({
    color: 0x4d9de0,
    metalness: 0.25,
    roughness: 0.55,
  });
  const mesh = new T.Mesh(geometry, material);
  scene.add(mesh);

  // Grid helper for ground reference
  const gridSize = maxDim * 2;
  const grid = new T.GridHelper(gridSize, 16, 0x303050, 0x202038);
  grid.position.y = -size.y / 2;
  scene.add(grid);

  // Lighting
  scene.add(new T.AmbientLight(0x404060, 2));
  const keyLight = new T.DirectionalLight(0xffffff, 2.5);
  keyLight.position.set(maxDim * 1.5, maxDim * 2, maxDim * 1.5);
  scene.add(keyLight);
  const fillLight = new T.DirectionalLight(0x6688bb, 1);
  fillLight.position.set(-maxDim, -maxDim * 0.5, maxDim);
  scene.add(fillLight);
  const rimLight = new T.DirectionalLight(0x335577, 0.6);
  rimLight.position.set(0, -maxDim, -maxDim);
  scene.add(rimLight);

  // Canvas & renderer
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width:100%;height:100%;display:block;border-radius:4px;';
  container.appendChild(canvas);

  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Camera
  const cam = new T.PerspectiveCamera(40, 1, maxDim * 0.01, maxDim * 50);
  const dist = maxDim * 2.2;
  cam.position.set(dist * 0.8, dist * 0.6, dist * 0.8);
  cam.lookAt(0, 0, 0);

  // Orbit controls
  const controls = new OrbitControlsCtor(cam, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.2;
  controls.minDistance = maxDim * 0.3;
  controls.maxDistance = maxDim * 10;

  // Render loop
  let raf = 0;
  let userPaused = false;
  let isVisible = true;

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      cam.aspect = w / h;
      cam.updateProjectionMatrix();
    }
  };

  const animate = () => {
    raf = requestAnimationFrame(animate);
    resize();
    controls.update();
    renderer.render(scene, cam);
  };

  animate();

  // Pause when off-screen
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.target !== canvas) continue;
        if (entry.isIntersecting && !isVisible) {
          isVisible = true;
          if (!userPaused) animate();
        } else if (!entry.isIntersecting && isVisible) {
          isVisible = false;
          cancelAnimationFrame(raf);
        }
      }
    },
    { threshold: 0.01 },
  );
  observer.observe(canvas);

  return {
    cleanup() {
      observer.disconnect();
      cancelAnimationFrame(raf);
      controls.dispose();
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.innerHTML = '';
    },
    pause() {
      if (userPaused) return;
      userPaused = true;
      controls.autoRotate = false;
      cancelAnimationFrame(raf);
    },
    resume() {
      if (!userPaused) return;
      userPaused = false;
      controls.autoRotate = true;
      if (isVisible) animate();
    },
    reset() {
      cam.position.set(dist * 0.8, dist * 0.6, dist * 0.8);
      cam.lookAt(0, 0, 0);
      controls.reset();
      controls.autoRotate = true;
      userPaused = false;
      cancelAnimationFrame(raf);
      if (isVisible) animate();
    },
  };
}

// ── UI helpers ──

function showLoading(container: HTMLElement): void {
  const el = document.createElement('div');
  el.className = 'openscad-loading';
  el.innerHTML =
    '<div class="openscad-spinner">\u2B21</div>' +
    '<div class="openscad-loading-text">Compiling 3D model\u2026</div>';
  container.appendChild(el);
}

function showError(container: HTMLElement, error: string): void {
  container.innerHTML = '';
  const el = document.createElement('div');
  el.style.cssText =
    'display:flex;align-items:center;justify-content:center;width:100%;height:100%;' +
    'background:#1a0a0a;color:#ef4444;font-size:0.7rem;padding:0.5rem;' +
    'font-family:monospace;word-break:break-all;overflow:auto;border:1px solid #ef4444;' +
    'border-radius:4px;';
  el.textContent = error;
  container.appendChild(el);
}

// ── Render orchestrator ──

function renderOpenSCAD(code: string, container: HTMLElement): RenderHandle {
  container.innerHTML = '';
  showLoading(container);

  let innerHandle: RenderHandle | null = null;
  let cancelled = false;

  (async () => {
    try {
      await ensureThree();
      const stl = await compileToSTL(code);
      if (cancelled) return;
      container.innerHTML = '';
      innerHandle = buildScene(container, stl);
    } catch (err: any) {
      if (cancelled) return;
      showError(container, String(err?.message ?? err));
    }
  })();

  return {
    cleanup() {
      cancelled = true;
      innerHandle?.cleanup();
      container.innerHTML = '';
    },
    pause() { innerHandle?.pause?.(); },
    resume() { innerHandle?.resume?.(); },
    reset() { innerHandle?.reset?.(); },
  };
}

// ── Snapshot renderer (for lineage thumbnails) ──

function renderSnapshotCanvas(
  code: string,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  const cached = stlCache.get(code);
  if (!cached || !THREE) return null;

  const T = THREE;
  const loader = new STLLoaderCtor();
  const geometry: import('three').BufferGeometry = loader.parse(cached);
  geometry.computeBoundingBox();
  geometry.computeVertexNormals();

  const bbox = geometry.boundingBox!;
  const center = new T.Vector3();
  bbox.getCenter(center);
  geometry.translate(-center.x, -center.y, -center.z);

  const sz = new T.Vector3();
  bbox.getSize(sz);
  const maxDim = Math.max(sz.x, sz.y, sz.z) || 1;

  const scene = new T.Scene();
  scene.background = new T.Color(0x12121e);

  const material = new T.MeshStandardMaterial({ color: 0x4d9de0, metalness: 0.25, roughness: 0.55 });
  scene.add(new T.Mesh(geometry, material));

  scene.add(new T.AmbientLight(0x404060, 2));
  const key = new T.DirectionalLight(0xffffff, 2.5);
  key.position.set(maxDim * 1.5, maxDim * 2, maxDim * 1.5);
  scene.add(key);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);

  const cam = new T.PerspectiveCamera(40, width / height, maxDim * 0.01, maxDim * 50);
  const dist = maxDim * 2.2;
  cam.position.set(dist * 0.8, dist * 0.6, dist * 0.8);
  cam.lookAt(0, 0, 0);

  renderer.render(scene, cam);

  const outCanvas = document.createElement('canvas');
  outCanvas.width = width;
  outCanvas.height = height;
  outCanvas.getContext('2d')?.drawImage(canvas, 0, 0);

  renderer.dispose();
  geometry.dispose();
  material.dispose();

  return outCanvas;
}

// ── Plugin export ──

export const openscadPlugin: ModalityPlugin = {
  key: 'openscad',
  label: 'OpenSCAD',
  language: 'c',
  description: 'Parametric 3D models — evolve sculptures, mechanisms, and mathematical forms',

  render(code: string, container: HTMLElement): RenderHandle {
    return renderOpenSCAD(code, container);
  },

  previewInModal(code: string, container: HTMLElement): RenderHandle {
    return renderOpenSCAD(code, container);
  },

  renderSnapshot(code: string, width: number, height: number): HTMLCanvasElement | null {
    return renderSnapshotCanvas(code, width, height);
  },

  validate(code: string): string | null {
    if (!code.trim()) return 'Code cannot be empty';
    const hasShape =
      /\b(cube|sphere|cylinder|polyhedron|linear_extrude|rotate_extrude|polygon|circle|square|text|hull|minkowski|union|difference|intersection)\b/.test(
        code,
      );
    if (!code.includes(';') && !hasShape) {
      return 'Code does not appear to contain valid OpenSCAD geometry';
    }
    return null;
  },
};
