import { useState, useCallback } from 'react';
import { Program, SharedProgram, LineageProgram, GenerationMeta } from '../types';
import { useSessionStore } from '../store/sessionStore';
import { useGalleryStore } from '../store/galleryStore';
import { useLogStore } from '../store/logStore';
import { useAuthStore, PendingShare } from '../store/authStore';
import { api } from '../api/client';
import { Modal } from './Modal';
import { formatLLMLabel } from '../utils/llmLabel';

interface Props {
  program: Program;
  onClose: () => void;
  onOpenAuth?: () => void;
}

function buildLineage(
  program: Program,
  generations: Program[][],
  generationMeta: GenerationMeta[],
  customizedPrograms: Record<string, string>,
  galleryOriginId: string | null,
  galleryOriginName: string | null,
): LineageProgram[] {
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
    const meta = generationMeta[p.generation];
    const customizedCode = customizedPrograms[p.id];
    const hasCustomizedCode =
      typeof customizedCode === 'string' && customizedCode !== p.code;
    const effectiveCode = hasCustomizedCode ? customizedCode : p.code;
    lineage.push({
      id: p.id,
      code: effectiveCode,
      ...(hasCustomizedCode ? { originalCode: p.code, customizedCode } : {}),
      modality: p.modality,
      generation: p.generation,
      parentIds: p.parentIds,
      guidance: meta?.guidance ?? '',
      llmModel: meta?.llmModel ?? '',
      contextProfile: meta?.contextProfile ?? '',
      ...(p.generation === 0 && galleryOriginId ? { galleryOriginId, galleryOriginName: galleryOriginName ?? undefined } : {}),
    });
    for (const pid of p.parentIds) {
      walk(pid);
    }
  }

  walk(program.id);
  return lineage;
}

function summarizeLineageField(
  lineage: LineageProgram[],
  field: 'llmModel' | 'contextProfile',
): string {
  const values = new Set(lineage.map((p) => p[field]).filter(Boolean));
  if (values.size === 0) return field === 'llmModel' ? 'Unknown' : '';
  if (values.size === 1) return [...values][0]!;
  return field === 'llmModel' ? 'Several models' : 'Multiple levels';
}

export function ShareModal({ program, onClose, onOpenAuth }: Props) {
  const user = useAuthStore((s) => s.user);
  const setPendingShare = useAuthStore((s) => s.setPendingShare);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generations = useSessionStore((s) => s.generations);
  const customizedPrograms = useSessionStore((s) => s.customizedPrograms);
  const generationMeta = useSessionStore((s) => s.generationMeta);
  const llmConfig = useSessionStore((s) => s.llmConfig);
  const lastEvolveSource = useSessionStore((s) => s.lastEvolveSource);
  const galleryOriginId = useSessionStore((s) => s.galleryOriginId);
  const galleryOriginName = useSessionStore((s) => s.galleryOriginName);
  const addLog = useLogStore((s) => s.addLog);
  const addSharedProgram = useGalleryStore((s) => s.addSharedProgram);

  const displayCode = customizedPrograms[program.id] ?? program.code;
  const currentLLMLabel = formatLLMLabel(
    llmConfig.provider,
    llmConfig.model,
    llmConfig.baseUrl,
  );

  const buildShareData = useCallback(() => {
    const lineage = buildLineage(
      program,
      generations,
      generationMeta,
      customizedPrograms,
      galleryOriginId,
      galleryOriginName,
    );
    const finalInLineage = lineage.find((p) => p.id === program.id);
    if (finalInLineage) {
      finalInLineage.code = displayCode;
    }
    const llmLabel = summarizeLineageField(lineage, 'llmModel') || (lastEvolveSource === 'mock' ? 'Mock' : currentLLMLabel);
    return { lineage, llmLabel };
  }, [program, generations, generationMeta, customizedPrograms, displayCode, lastEvolveSource, currentLLMLabel, galleryOriginId, galleryOriginName]);

  const handleLoginToShare = useCallback(() => {
    const { lineage, llmLabel } = buildShareData();
    const pending: PendingShare = {
      programId: program.id,
      code: displayCode,
      modality: program.modality,
      lineage,
      llmModel: llmLabel,
    };
    setPendingShare(pending);
    onClose();
    onOpenAuth?.();
  }, [buildShareData, program, displayCode, setPendingShare, onClose, onOpenAuth]);

  const handleShare = useCallback(async () => {
    if (!user) return;

    setIsSharing(true);

    const { lineage, llmLabel } = buildShareData();

    const sharedId = crypto.randomUUID();
    const sharedProgram: SharedProgram = {
      id: sharedId,
      programId: program.id,
      sharerName: user.username,
      modality: program.modality,
      code: displayCode,
      lineage,
      llmModel: llmLabel,
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await api.post<{ id: string }>('/api/gallery/share', {
        program_id: program.id,
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
  }, [user, program, displayCode, buildShareData, addLog, addSharedProgram]);

  const handleCopyUrl = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  return (
    <Modal onClose={onClose} contentClassName="share-modal">
      <div className="modal-header">
          <h3>Share to Gallery</h3>
          <button onClick={onClose} title="Close">&times;</button>
        </div>

        <div className="share-modal-body">
          {!shareUrl ? (
            <>
              {!user ? (
                <div className="share-auth-prompt">
                  <p>Sign in to share your creation to the gallery.</p>
                  <button className="auth-submit-btn" onClick={handleLoginToShare}>
                    Log In / Sign Up
                  </button>
                </div>
              ) : (
                <>
                  <div className="share-field">
                    <label>Sharing as</label>
                    <span className="share-username">{user.username}</span>
                  </div>
                  <div className="share-preview-info">
                    <span className="share-modality">{program.modality}</span>
                    <span className="share-gen">Generation {program.generation + 1}</span>
                    <span className="share-model">{lastEvolveSource === 'mock' ? 'Mock' : currentLLMLabel}</span>
                    <span className="share-profile">{llmConfig.contextProfile}</span>
                  </div>
                  <button
                    className="share-submit-btn"
                    onClick={handleShare}
                    disabled={isSharing}
                  >
                    {isSharing ? 'Sharing...' : 'Share to Gallery'}
                  </button>
                </>
              )}
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
    </Modal>
  );
}
