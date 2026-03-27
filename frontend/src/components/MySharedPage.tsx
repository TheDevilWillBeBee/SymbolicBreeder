import { useEffect, useCallback, useState } from 'react';
import { useGalleryStore, GallerySortBy } from '../store/galleryStore';
import { useAuthStore } from '../store/authStore';
import { useNavStore } from '../store/navStore';
import { useSessionStore } from '../store/sessionStore';
import { useStrudelPlayer } from '../hooks/useStrudelPlayer';
import { GalleryCard } from './GalleryCard';
import { SharedProgram } from '../types';

interface Props {
  onOpenAuth?: () => void;
}

export function MySharedPage({ onOpenAuth }: Props) {
  const user = useAuthStore((s) => s.user);
  const programs = useGalleryStore((s) => s.programs);
  const total = useGalleryStore((s) => s.total);
  const page = useGalleryStore((s) => s.page);
  const modality = useGalleryStore((s) => s.modality);
  const sortBy = useGalleryStore((s) => s.sortBy);
  const isLoading = useGalleryStore((s) => s.isLoading);
  const setModality = useGalleryStore((s) => s.setModality);
  const setSortBy = useGalleryStore((s) => s.setSortBy);
  const setPage = useGalleryStore((s) => s.setPage);
  const setOwnerUserId = useGalleryStore((s) => s.setOwnerUserId);
  const fetchPrograms = useGalleryStore((s) => s.fetchPrograms);

  const goToBreeding = useNavStore((s) => s.goToBreeding);

  const [playingCode, setPlayingCode] = useState<string | null>(null);
  const { play, stop } = useStrudelPlayer(modality === 'strudel');

  useEffect(() => {
    if (!user) return;
    setOwnerUserId(user.id);
    fetchPrograms(user.id);
  }, [user?.id, setOwnerUserId, fetchPrograms]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const handlePlay = useCallback((code: string) => {
    play(code);
    setPlayingCode(code);
  }, [play]);

  const handleStop = useCallback(() => {
    stop();
    setPlayingCode(null);
  }, [stop]);

  const handleBreed = useCallback((program: SharedProgram) => {
    handleStop();
    const store = useSessionStore.getState();
    store.reset();
    store.setModality(program.modality);
    store.setGalleryOrigin(program.id, program.sharerName);
    store.addGenerationMeta({ guidance: '', llmModel: '', contextProfile: '' });
    store.addGeneration([{
      id: crypto.randomUUID(),
      code: program.code,
      modality: program.modality,
      generation: 0,
      parentIds: [],
      sessionId: store.session?.id ?? '',
      createdAt: new Date().toISOString(),
    }]);
    goToBreeding();
  }, [handleStop, goToBreeding]);

  if (!user) {
    return (
      <div className="gallery-page">
        <div className="gallery-header">
          <h2>My Shared Items</h2>
          <p className="gallery-subtitle">Log in to see your shared programs.</p>
        </div>
        <div className="gallery-empty">
          <button className="auth-submit-btn" onClick={onOpenAuth}>
            Log In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h2>My Shared Items</h2>
        <p className="gallery-subtitle">
          Programs you have shared to the gallery
        </p>
      </div>

      <div className="gallery-tabs">
        {(['shader', 'strudel', 'openscad', 'svg'] as const).map((mod) => (
          <button
            key={mod}
            className={'gallery-tab' + (modality === mod ? ' active' : '')}
            onClick={() => { handleStop(); setModality(mod); }}
          >
            {mod.charAt(0).toUpperCase() + mod.slice(1)}
          </button>
        ))}
      </div>

      <div className="gallery-sort">
        <label htmlFor="my-shared-sort-select">Sort by:</label>
        <select
          id="my-shared-sort-select"
          value={sortBy}
          onChange={(e) => { handleStop(); setSortBy(e.target.value as GallerySortBy); }}
        >
          <option value="newest">Newest</option>
          <option value="most_liked">Most Liked</option>
        </select>
      </div>

      {isLoading ? (
        <div className="gallery-loading">Loading...</div>
      ) : programs.length === 0 ? (
        <div className="gallery-empty">You haven't shared any programs in this modality yet.</div>
      ) : (
        <div className="gallery-grid">
          {programs.map((p) => (
            <GalleryCard
              key={p.id}
              program={p}
              onPlay={handlePlay}
              onStop={handleStop}
              isPlaying={playingCode === p.code}
              onBreed={handleBreed}
              onOpenAuth={onOpenAuth}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
          <span className="gallery-page-indicator">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
