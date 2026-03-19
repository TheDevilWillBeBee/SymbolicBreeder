const SHADER_KEYWORDS = new Set([
  'void', 'float', 'int', 'bool', 'vec2', 'vec3', 'vec4', 'mat2', 'mat3', 'mat4',
  'if', 'else', 'for', 'while', 'return', 'break', 'continue', 'const', 'uniform', 'in', 'out',
]);

const SHADER_BUILTINS = new Set([
  'sin', 'cos', 'tan', 'atan', 'pow', 'exp', 'log', 'sqrt', 'abs', 'min', 'max', 'mod', 'fract',
  'mix', 'clamp', 'smoothstep', 'step', 'length', 'distance', 'normalize', 'dot', 'cross',
  'floor', 'ceil', 'round', 'sign', 'iTime', 'iResolution', 'fragCoord', 'fragColor', 'mainImage',
]);

const STRUDEL_KEYWORDS = new Set([
  's', 'note', 'stack', 'cat', 'slow', 'fast', 'gain', 'room', 'delay', 'delaytime',
  'lpf', 'hpf', 'cutoff', 'speed', 'jux', 'every', 'mask', 'sometimesBy',
]);

const STRUDEL_BUILTINS = new Set(['sine', 'cosine', 'rand', 'range']);

const OPENSCAD_KEYWORDS = new Set([
  'module', 'function', 'if', 'else', 'for', 'let', 'each', 'true', 'false', 'undef',
]);

const OPENSCAD_BUILTINS = new Set([
  'cube', 'sphere', 'cylinder', 'polyhedron', 'circle', 'square', 'polygon', 'text',
  'union', 'difference', 'intersection', 'translate', 'rotate', 'scale', 'mirror', 'resize',
  'color', 'hull', 'minkowski', 'linear_extrude', 'rotate_extrude', 'children',
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'abs', 'ceil', 'floor', 'round',
  'sqrt', 'pow', 'exp', 'log', 'ln', 'min', 'max', 'norm', 'cross', 'len', 'concat', 'str',
]);

const TOKEN_REGEX = /\/\/.*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d*\.?\d+\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[()[\]{}.,;:+\-*/%<>=!&|^~?]/g;
const IDENTIFIER_REGEX = /^[A-Za-z_][A-Za-z0-9_]*$/;
const NUMBER_REGEX = /^\d*\.?\d+$/;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function highlightCode(code: string, modality: string): string {
  const keywordSet = modality === 'shader' ? SHADER_KEYWORDS : modality === 'openscad' ? OPENSCAD_KEYWORDS : STRUDEL_KEYWORDS;
  const builtinSet = modality === 'shader' ? SHADER_BUILTINS : modality === 'openscad' ? OPENSCAD_BUILTINS : STRUDEL_BUILTINS;

  let result = '';
  let lastIndex = 0;

  for (const match of code.matchAll(TOKEN_REGEX)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      result += escapeHtml(code.slice(lastIndex, index));
    }

    let className = '';
    if (token.startsWith('//') || token.startsWith('/*')) {
      className = 'tok-comment';
    } else if (token.startsWith('"') || token.startsWith('\'')) {
      className = 'tok-string';
    } else if (NUMBER_REGEX.test(token)) {
      className = 'tok-number';
    } else if (IDENTIFIER_REGEX.test(token)) {
      if (keywordSet.has(token)) {
        className = 'tok-keyword';
      } else if (builtinSet.has(token)) {
        className = 'tok-builtin';
      }
    } else {
      className = 'tok-punctuation';
    }

    const escaped = escapeHtml(token);
    result += className ? `<span class="${className}">${escaped}</span>` : escaped;
    lastIndex = index + token.length;
  }

  if (lastIndex < code.length) {
    result += escapeHtml(code.slice(lastIndex));
  }

  return result;
}