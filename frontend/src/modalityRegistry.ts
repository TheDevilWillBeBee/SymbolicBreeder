import { strudelPlugin } from './modalities/strudel';
import { shaderPlugin } from './modalities/shader';
import { svgPlugin } from './modalities/svg';
import type { ModalityPlugin } from './types';

export const modalityRegistry: Record<string, ModalityPlugin> = {
  strudel: strudelPlugin,
  shader: shaderPlugin,
  svg: svgPlugin,
};

export const modalityKeys = Object.keys(modalityRegistry);

export function getPlugin(key: string): ModalityPlugin {
  const plugin = modalityRegistry[key];
  if (!plugin) throw new Error(`Unknown modality: ${key}`);
  return plugin;
}
