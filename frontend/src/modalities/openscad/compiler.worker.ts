const ctx: Worker = self as any;

ctx.onmessage = async (e: MessageEvent<{ code: string; useManifold?: boolean }>) => {
  const errors: string[] = [];
  try {
    const { createOpenSCAD } = await import('openscad-wasm');
    const wrapper = await createOpenSCAD({
      print: () => {},
      printErr: (s: string) => { errors.push(s); },
    });
    const instance = wrapper.getInstance();
    instance.FS.writeFile('/input.scad', e.data.code);
    const args = ['/input.scad', '-o', '/output.stl'];
    if (e.data.useManifold !== false) args.splice(1, 0, '--backend=manifold');
    instance.callMain(args);
    const stl = instance.FS.readFile('/output.stl', { encoding: 'utf8' });
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
