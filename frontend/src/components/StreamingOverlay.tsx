import { useEffect, useRef, useMemo, useState, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { highlightCode } from '../utils/syntaxHighlight';

/**
 * Parse streaming LLM text into separate code blocks.
 * Returns completed blocks and an optional in-progress block.
 */
function parseCodeBlocks(text: string, fence: string) {
  const blocks: { code: string; complete: boolean }[] = [];
  const fencePattern = new RegExp(`\`\`\`(?:${fence})?\\s*\\n`, 'g');
  const closePattern = /```/g;

  let searchFrom = 0;

  while (searchFrom < text.length) {
    fencePattern.lastIndex = searchFrom;
    const openMatch = fencePattern.exec(text);
    if (!openMatch) break;

    const codeStart = openMatch.index + openMatch[0].length;
    closePattern.lastIndex = codeStart;
    const closeMatch = closePattern.exec(text);

    if (closeMatch) {
      blocks.push({
        code: text.slice(codeStart, closeMatch.index).trim(),
        complete: true,
      });
      searchFrom = closeMatch.index + closeMatch[0].length;
    } else {
      blocks.push({
        code: text.slice(codeStart).trim(),
        complete: false,
      });
      break;
    }
  }

  return blocks;
}

const FENCE_MAP: Record<string, string> = {
  strudel: 'strudel',
  shader: 'glsl',
  openscad: 'openscad',
  svg: 'svg',
};

const STATUS_LABELS: Record<string, string> = {
  connecting: 'Connecting to LLM API...',
  sending: 'Sending prompt to model...',
  generating: 'Model is generating code...',
};

const MODALITY_LABELS: Record<string, string> = {
  strudel: 'music patterns',
  shader: 'shaders',
  openscad: '3D models',
  svg: 'vector graphics',
};

interface Props {
  populationSize: number;
}

export function StreamingOverlay({ populationSize }: Props) {
  const streamingText = useSessionStore((s) => s.streamingText);
  const streamingPhase = useSessionStore((s) => s.streamingPhase);
  const modality = useSessionStore((s) => s.modality) ?? 'strudel';
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track which blocks are manually expanded by user
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());

  const fence = FENCE_MAP[modality] ?? '';
  const blocks = useMemo(
    () => parseCodeBlocks(streamingText, fence),
    [streamingText, fence],
  );

  const completedCount = blocks.filter((b) => b.complete).length;

  const toggleBlock = useCallback((index: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  // Determine the current status message
  const statusMessage = useMemo(() => {
    if (streamingPhase && STATUS_LABELS[streamingPhase]) {
      return STATUS_LABELS[streamingPhase];
    }
    if (blocks.length === 0 && streamingText.length === 0) {
      return `Connecting to LLM API...`;
    }
    if (blocks.length === 0 && streamingText.length > 0) {
      return `Reading context, preparing ${MODALITY_LABELS[modality] ?? 'programs'}...`;
    }
    return `Generating ${MODALITY_LABELS[modality] ?? 'programs'}... (${completedCount} of ${populationSize} received)`;
  }, [streamingPhase, blocks.length, streamingText.length, modality, completedCount, populationSize]);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [streamingText]);

  return (
    <div className="streaming-overlay">
      <div className="streaming-panel" ref={scrollRef}>
        <div className="streaming-header">
          <div className="streaming-spinner" />
          <span>{statusMessage}</span>
        </div>

        {blocks.length === 0 && streamingText.length > 0 && (
          <div className="streaming-raw">
            <pre>{streamingText.slice(-500)}</pre>
          </div>
        )}

        {blocks.map((block, i) => {
          const isLast = i === blocks.length - 1;
          // Completed blocks auto-collapse unless user toggled them open.
          // The active (in-progress or last) block stays open.
          const isCollapsed =
            block.complete && !isLast && !expandedBlocks.has(i);
          const showCode = !block.complete || isLast || expandedBlocks.has(i);

          return (
            <div
              key={i}
              className={`streaming-block ${block.complete ? 'complete' : 'in-progress'} ${isCollapsed ? 'collapsed' : ''}`}
            >
              <div
                className="streaming-block-header"
                onClick={() => block.complete && toggleBlock(i)}
                style={{ cursor: block.complete ? 'pointer' : 'default' }}
              >
                {block.complete && !isLast && (
                  <span className="streaming-collapse-icon">
                    {showCode ? '\u25BE' : '\u25B8'}
                  </span>
                )}
                <span>Program {i + 1}</span>
                {!block.complete && (
                  <span className="streaming-cursor" />
                )}
                {block.complete && (
                  <span className="streaming-check">{'\u2713'}</span>
                )}
              </div>
              {showCode && (
                <pre
                  className="streaming-code"
                  dangerouslySetInnerHTML={{
                    __html: highlightCode(block.code, modality),
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
