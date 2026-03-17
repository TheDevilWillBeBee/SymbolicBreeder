import { useMemo } from 'react';

/**
 * Lightweight syntax highlighter for Strudel/JS code previews.
 * No external dependencies — uses simple regex tokenization.
 */

interface Token {
  type: 'keyword' | 'string' | 'number' | 'comment' | 'function' | 'operator' | 'punctuation' | 'text';
  value: string;
}

const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'await', 'async', 'true', 'false', 'null', 'undefined', 'new',
]);

// Order matters — first match wins
const TOKEN_RULES: [Token['type'], RegExp][] = [
  ['comment', /\/\/[^\n]*/],
  ['comment', /\/\*[\s\S]*?\*\//],
  ['string', /"(?:[^"\\]|\\.)*"/],
  ['string', /'(?:[^'\\]|\\.)*'/],
  ['string', /`(?:[^`\\]|\\.)*`/],
  ['number', /\b\d+\.?\d*\b/],
  ['function', /\.([a-zA-Z_]\w*)\s*\(/],
  ['operator', /[+\-*/%=<>!&|^~?:]+/],
  ['punctuation', /[{}()\[\];,.]/],
  ['text', /[a-zA-Z_$]\w*/],
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
        let tokenType = type;
        let value = m[0];

        // For function pattern `.name(`, we want to highlight just the name
        if (type === 'function') {
          // Push the dot as punctuation
          tokens.push({ type: 'punctuation', value: '.' });
          // The function name (capture group 1)
          tokens.push({ type: 'function', value: m[1] });
          // Don't consume the opening paren — let punctuation rule get it
          pos += m[0].length - 1;
          matched = true;
          break;
        }

        // Check if a text token is actually a keyword
        if (type === 'text' && KEYWORDS.has(value)) {
          tokenType = 'keyword';
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
  operator: 'sh-op',
  punctuation: 'sh-punc',
  text: '',
};

interface Props {
  code: string;
}

export function StrudelHighlight({ code }: Props) {
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

  return <pre className="strudel-code-preview">{elements}</pre>;
}
