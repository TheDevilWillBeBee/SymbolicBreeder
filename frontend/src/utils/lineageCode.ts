import type { LineageProgram } from '../types';

export type LineageCodeSource = 'customized' | 'original';

export function hasCustomizedLineageCode(program: LineageProgram): boolean {
  return (
    typeof program.customizedCode === 'string' &&
    typeof program.originalCode === 'string' &&
    program.customizedCode !== program.originalCode
  );
}

export function getLineageCode(
  program: LineageProgram,
  source: LineageCodeSource,
): string {
  const hasCustomized = hasCustomizedLineageCode(program);
  if (!hasCustomized) return program.code;
  return source === 'original'
    ? (program.originalCode as string)
    : (program.customizedCode as string);
}