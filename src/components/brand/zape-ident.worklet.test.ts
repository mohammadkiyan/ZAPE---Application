import vm from 'node:vm';
import * as ident from './zape-ident';

interface Worklet {
  (...args: unknown[]): unknown;
  __closure: Record<string, unknown>;
  __initData: { code: string };
}

const isWorklet = (value: unknown): value is Worklet =>
  typeof value === 'function' && '__initData' in value;

/**
 * Rebuilds a value the way the UI runtime does: each worklet from its own code in a fresh
 * context that holds nothing but its captured closure, so a missed capture throws here too.
 */
function onUiRuntime(value: unknown): unknown {
  if (isWorklet(value)) {
    const closure = Object.fromEntries(
      Object.entries(value.__closure).map(([key, captured]) => [key, onUiRuntime(captured)])
    );
    const fn = vm.runInNewContext(`(${value.__initData.code})`) as (...args: unknown[]) => unknown;
    return fn.bind({ __closure: closure });
  }
  if (Array.isArray(value)) return value.map(onUiRuntime);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, onUiRuntime(v)]));
  }
  return value;
}

const ui = <T>(fn: T) => onUiRuntime(fn) as T;

describe('ZAPE ident on the UI runtime', () => {
  it('evaluates every frame of the build and the shimmer loop without throwing', () => {
    const scene = {
      identTime: ui(ident.identTime),
      atmosphereOpacity: ui(ident.atmosphereOpacity),
      barRect: ui(ident.barRect),
      dropProps: ui(ident.dropProps),
      beadProps: ui(ident.beadProps),
      dropletProps: ui(ident.dropletProps),
      ringProps: ui(ident.ringProps),
      flashOpacity: ui(ident.flashOpacity),
      sheenProps: ui(ident.sheenProps),
      tipProps: ui(ident.tipProps),
    };
    for (let elapsed = 0; elapsed < 12; elapsed += 1 / 60) {
      const t = scene.identTime(elapsed);
      scene.atmosphereOpacity(t);
      for (const bar of ident.BARS) expect(scene.barRect(bar, t)).toEqual(ident.barRect(bar, t));
      expect(scene.dropProps(t)).toEqual(ident.dropProps(t));
      expect(scene.beadProps(t)).toEqual(ident.beadProps(t));
      for (const droplet of ident.SPLATTER) scene.dropletProps(droplet, t);
      for (const i of [0, 1, 2] as const) scene.ringProps(i, t);
      scene.flashOpacity(t);
      expect(scene.sheenProps(t)).toEqual(ident.sheenProps(t));
      for (const i of [0, 1, 2, 3] as const) scene.tipProps(i, t);
    }
  });
});
