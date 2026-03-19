const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent<{ code: string }>) => {
  const errors: string[] = [];
  try {
    const { createOpenSCAD } = await import('openscad-wasm');
    const instance = await createOpenSCAD({
      print: () => {},
      printErr: (s: string) => { errors.push(s); },
    });
    const stl = await instance.renderToStl(e.data.code);
    if (!stl || !stl.includes('facet')) {
      const msg = errors.filter(l => /error/i.test(l)).join('\n');
      ctx.postMessage({ ok: false, error: msg || 'OpenSCAD produced empty geometry' });
    } else {
      ctx.postMessage({ ok: true, stl });
    }
  } catch (err: any) {
    const msg = errors.filter(l => /error/i.test(l)).join('\n');
    ctx.postMessage({ ok: false, error: msg || String(err?.message ?? err) });
  }
};
