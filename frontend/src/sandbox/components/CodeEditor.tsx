import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

import './codeEditor.css';

interface Props {
  value: string;
  onChange: (next: string) => void;
  language?: 'yaml' | 'markdown' | 'plain';
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CodeEditor({
  value,
  onChange,
  language = 'plain',
  placeholder,
  className,
  style,
}: Props) {
  return (
    <div className={'sbx-yaml-editor-wrap' + (className ? ' ' + className : '')}>
      <Editor
        value={value}
        onValueChange={onChange}
        highlight={(code) => {
          if (language === 'yaml' && Prism.languages.yaml) {
            return Prism.highlight(code, Prism.languages.yaml, 'yaml');
          }
          if (language === 'markdown' && Prism.languages.markdown) {
            return Prism.highlight(code, Prism.languages.markdown, 'markdown');
          }
          return escapeHtml(code);
        }}
        padding={10}
        textareaId="sbx-code-editor"
        placeholder={placeholder}
        className="sbx-yaml-editor"
        style={{
          fontFamily:
            "ui-monospace, 'JetBrains Mono', 'Fira Code', Menlo, monospace",
          fontSize: '0.8rem',
          lineHeight: 1.55,
          background: 'transparent',
          color: 'inherit',
          ...style,
        }}
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
