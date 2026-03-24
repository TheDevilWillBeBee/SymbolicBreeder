import { useEffect, useRef, useState } from 'react';
import { getPlugin } from '../modalityRegistry';

const THUMB_SIZE = 96;

/** Serialize GPU snapshot work — browsers cap WebGL contexts (~8); parallel thumbs → black frames. */
let snapshotGate = Promise.resolve();

function withSnapshotGate<T>(fn: () => Promise<T>): Promise<T> {
  const next = snapshotGate.then(fn);
  snapshotGate = next.then(() => undefined).catch(() => undefined);
  return next;
}

/** Modalities that use static PNG tiles in the grid; live preview opens in zoom modal. */
type StaticThumbModality = 'shader' | 'openscad' | 'svg';

/**
 * One static PNG thumbnail (shader snapshot or OpenSCAD render-to-image).
 * No persistent WebGL — avoids RAM from many live gallery previews.
 * Click opens the real interactive preview (GalleryCard in modal).
 */
export function SandboxStaticThumbnail({
  modality,
  code,
  onOpen,
}: {
  modality: StaticThumbModality;
  code: string;
  onOpen: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) setInView(true);
      },
      { rootMargin: '200px', threshold: 0.01 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || !code.trim()) return;
    let cancelled = false;
    setStatus('loading');
    setDataUrl(null);

    const run = withSnapshotGate(async () => {
      const plugin = getPlugin(modality);
      let canvas: HTMLCanvasElement | null = null;

      if (plugin.renderSnapshotAsync) {
        canvas = await plugin.renderSnapshotAsync(code, THUMB_SIZE, THUMB_SIZE);
      } else if (modality === 'openscad' && plugin.ensureCompiled && plugin.renderSnapshot) {
        await plugin.ensureCompiled(code);
        if (cancelled) return;
        canvas = plugin.renderSnapshot(code, THUMB_SIZE, THUMB_SIZE);
      } else {
        canvas = plugin.renderSnapshot?.(code, THUMB_SIZE, THUMB_SIZE) ?? null;
      }

      if (cancelled) return;
      if (canvas) {
        setDataUrl(canvas.toDataURL('image/png'));
        setStatus('ok');
      } else {
        setStatus('error');
      }
    });

    run.catch(() => {
      if (!cancelled) setStatus('error');
    });

    return () => {
      cancelled = true;
    };
  }, [inView, modality, code]);

  return (
    <div ref={hostRef} className="sandbox-static-thumb-wrap">
      <button
        type="button"
        className="sandbox-static-thumb"
        onClick={onOpen}
        title="Open live preview"
      >
        {status === 'ok' && dataUrl ? (
          <img src={dataUrl} alt="" width={THUMB_SIZE} height={THUMB_SIZE} draggable={false} />
        ) : status === 'error' ? (
          <span className="sandbox-static-thumb-placeholder">—</span>
        ) : (
          <span className="sandbox-static-thumb-placeholder">
            {inView && status === 'loading' ? '…' : '\u00a0'}
          </span>
        )}
      </button>
    </div>
  );
}
