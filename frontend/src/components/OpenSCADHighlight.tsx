import { useMemo } from 'react';

/**
 * Lightweight syntax highlighter for OpenSCAD code previews.
 * Similar to StrudelHighlight but tuned for C-like OpenSCAD syntax.
 */

interface Token {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'builtin' | 'operator' | 'punctuation' | 'text';
  value: string;
}

const KEYWORDS = new Set([
  'module', 'function', 'if', 'else', 'for', 'let', 'each',
  'true', 'false', 'undef',
]);

const BUILTINS = new Set([
  'cube', 'sphere', 'cylinder', 'polyhedron',
  'circle', 'square', 'polygon', 'text',
  'union', 'difference', 'intersection',
  'translate', 'rotate', 'scale', 'mirror', 'resize', 'multmatrix',
  'color', 'hull', 'minkowski',
  'linear_extrude', 'rotate_extrude',
  'children', 'echo', 'assert',
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'abs', 'ceil', 'floor', 'round', 'sqrt', 'pow', 'exp', 'log', 'ln',
  'min', 'max', 'norm', 'cross', 'len', 'concat', 'lookup', 'str',
]);

const TOKEN_RULES: [Token['type'], RegExp][] = [
  ['comment', /\/\/[^\n]*/],
  ['comment', /\/\*[\s\S]*?\*\//],
  ['string', /"(?:[^"\\]|\\.)*"/],
  ['number', /\b\d+\.?\d*\b/],
  ['operator', /[+\-*/%=<>!&|^~?:]+/],
  ['punctuation', /[{}()\[\];,.]/],
  ['text', /\$[a-zA-Z_]\w*/],
  ['text', /[a-zA-Z_]\w*/],
  ['text', /\s+/],
  ['text', /./],
];

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < code.length) {
    let matched = false;
    for (const [type, regex] of TOKEN_RULES) {
      const re = new RegExp(regex.source, 'y');
      re.lastIndex = pos;
      const m = re.exec(code);
      if (m) {
        let tokenType: Token['type'] = type;
        const value = m[0];

        if (type === 'text') {
          if (KEYWORDS.has(value)) tokenType = 'keyword';
          else if (BUILTINS.has(value)) tokenType = 'builtin';
          else if (value.startsWith('$')) tokenType = 'builtin';
        }

        tokens.push({ type: tokenType, value });
        pos += value.length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.push({ type: 'text', value: code[pos] });
      pos++;
    }
  }

  return tokens;
}

const CLASS_MAP: Record<Token['type'], string> = {
  keyword: 'sh-kw',
  string: 'sh-str',
  number: 'sh-num',
  comment: 'sh-cmt',
  function: 'sh-fn',
  builtin: 'sh-fn',
  operator: 'sh-op',
  punctuation: 'sh-punc',
  text: '',
};

interface Props {
  code: string;
}

export function OpenSCADHighlight({ code }: Props) {
  const elements = useMemo(() => {
    const tokens = tokenize(code);
    return tokens.map((t, i) => {
      const cls = CLASS_MAP[t.type];
      return cls ? (
        <span key={i} className={cls}>
          {t.value}
        </span>
      ) : (
        t.value
      );
    });
  }, [code]);

  return <pre className="openscad-code-preview">{elements}</pre>;
}
