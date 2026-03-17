import { useState, useCallback } from 'react';
import { Program, SharedProgram, LineageProgram } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { useGalleryStore } from '../store/galleryStore';
import { useLogStore } from '../store/logStore';
import { api } from '../api/client';

interface Props {
  program: Program;
  onClose: () => void;
}

function buildLineage(program: Program, generations: Program[][]): LineageProgram[] {
  const allPrograms = new Map<string, Program>();
  for (const gen of generations) {
    for (const p of gen) {
      allPrograms.set(p.id, p);
    }
  }

  const visited = new Set<string>();
  const lineage: LineageProgram[] = [];

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const p = allPrograms.get(id);
    if (!p) return;
    lineage.push({
      id: p.id,
      code: p.code,
      modality: p.modality,
      generation: p.generation,
      parentIds: p.parentIds,
    });
    for (const pid of p.parentIds) {
      walk(pid);
    }
  }

  walk(program.id);
  return lineage;
}

export function ShareModal({ program, onClose }: Props) {
  const stored = localStorage.getItem('symbolicBreeder_sharerName') ?? '';
  const [sharerName, setSharerName] = useState(stored);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generations = useSessionStore((s) => s.generations);
  const customizedPrograms = useSessionStore((s) => s.customizedPrograms);
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const lastEvolveSource = useSessionStore((s) => s.lastEvolveSource);
  const addLog = useLogStore((s) => s.addLog);
  const addSharedProgram = useGalleryStore((s) => s.addSharedProgram);

  const displayCode = customizedPrograms[program.id] ?? program.code;

  const handleShare = useCallback(async () => {
    if (!sharerName.trim()) return;

    localStorage.setItem('symbolicBreeder_sharerName', sharerName.trim());
    setIsSharing(true);

    const lineage = buildLineage(program, generations);
    // Update the final program's code with customized version if any
    const finalInLineage = lineage.find((p) => p.id === program.id);
    if (finalInLineage) {
      finalInLineage.code = displayCode;
    }

    const sharedId = crypto.randomUUID();
    const llmLabel = lastEvolveSource === 'mock' ? 'Mock' : `${llmConfig.provider}/${llmConfig.model}`;
    const sharedProgram: SharedProgram = {
      id: sharedId,
      programId: program.id,
      sharerName: sharerName.trim(),
      modality: program.modality,
      code: displayCode,
      lineage,
      llmModel: llmLabel,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<{ id: string }>('/api/gallery/share', {
        program_id: program.id,
        sharer_name: sharerName.trim(),
        code: displayCode,
        modality: program.modality,
        lineage,
        llm_model: llmLabel,
      });
      sharedProgram.id = res.id;
    } catch {
      // Mock mode — store locally
      addSharedProgram(sharedProgram);
    }

    const url = `${window.location.origin}/gallery/${sharedProgram.id}`;
    setShareUrl(url);
    setIsSharing(false);
    addLog('success', 'Program shared to the gallery!');
  }, [sharerName, program, generations, displayCode, llmConfig, addLog, addSharedProgram]);

  const handleCopyUrl = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Share to Gallery</h3>
          <button onClick={onClose} title="Close">&times;</button>
        </div>

        <div className="share-modal-body">
          {!shareUrl ? (
            <>
              <div className="share-field">
                <label htmlFor="sharer-name">Your name / ID</label>
                <input
                  id="sharer-name"
                  type="text"
                  value={sharerName}
                  onChange={(e) => setSharerName(e.target.value)}
                  placeholder="Enter your name or alias"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleShare();
                  }}
                  autoFocus
                />
              </div>
              <div className="share-preview-info">
                <span className="share-modality">{program.modality}</span>
                <span className="share-gen">Generation {program.generation + 1}</span>
                <span className="share-model">{lastEvolveSource === 'mock' ? 'Mock' : `${llmConfig.provider}/${llmConfig.model}`}</span>
              </div>
              <button
                className="share-submit-btn"
                onClick={handleShare}
                disabled={!sharerName.trim() || isSharing}
              >
                {isSharing ? 'Sharing...' : 'Share to Gallery'}
              </button>
            </>
          ) : (
            <div className="share-success">
              <p className="share-success-msg">Shared successfully!</p>
              <div className="share-url-group">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="share-url-input"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button className="share-copy-btn" onClick={handleCopyUrl}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
