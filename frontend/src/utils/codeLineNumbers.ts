export function buildLineNumberText(code: string): string {
  const lineCount = Math.max(1, code.split('\n').length);
  let out = '';
  for (let i = 1; i <= lineCount; i++) {
    out += `${i}\n`;
  }
  return out;
}
