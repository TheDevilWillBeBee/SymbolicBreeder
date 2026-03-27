import { useEffect, useCallback, useState } from 'react';
import { useGalleryStore, GallerySortBy } from '../store/galleryStore';
import { useNavStore } from '../store/navStore';
import { useSessionStore } from '../store/sessionStore';
import { useStrudelPlayer } from '../hooks/useStrudelPlayer';
import { GalleryCard } from './GalleryCard';
import { SharedProgram } from '../types';

interface GalleryPageProps {
  onOpenAuth?: () => void;
}

export function GalleryPage({ onOpenAuth }: GalleryPageProps = {}) {
  const programs = useGalleryStore((s) => s.programs);
  const total = useGalleryStore((s) => s.total);
  const page = useGalleryStore((s) => s.page);
  const modality = useGalleryStore((s) => s.modality);
  const isLoading = useGalleryStore((s) => s.isLoading);
  const setModality = useGalleryStore((s) => s.setModality);
  const sortBy = useGalleryStore((s) => s.sortBy);
  const setSortBy = useGalleryStore((s) => s.setSortBy);
  const setPage = useGalleryStore((s) => s.setPage);
  const setOwnerUserId = useGalleryStore((s) => s.setOwnerUserId);
  const fetchPrograms = useGalleryStore((s) => s.fetchPrograms);

  const goToBreeding = useNavStore((s) => s.goToBreeding);

  const [playingCode, setPlayingCode] = useState<string | null>(null);
  const { play, stop } = useStrudelPlayer(modality === 'strudel');

  useEffect(() => {
    setOwnerUserId(null);
    fetchPrograms();
  }, [setOwnerUserId, fetchPrograms]);

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
    store.setSession({
      id: crypto.randomUUID(),
      name: `From ${program.sharerName}'s program`,
      modality: program.modality,
      createdAt: new Date().toISOString(),
    });
    // Add empty meta for gen 0 so subsequent addGenerationMeta calls
    // align with generation indices (gen 1 meta lands at index 1, etc.)
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

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <h2>Gallery</h2>
        <p className="gallery-subtitle">
          Discover and breed from programs shared by others
        </p>
      </div>

      <div className="gallery-tabs">
        <button
          className={'gallery-tab' + (modality === 'shader' ? ' active' : '')}
          onClick={() => { handleStop(); setModality('shader'); }}
          title="Browse shared shader programs"
        >
          Shader
        </button>
        <button
          className={'gallery-tab' + (modality === 'strudel' ? ' active' : '')}
          onClick={() => { handleStop(); setModality('strudel'); }}
          title="Browse shared music programs"
        >
          Strudel
        </button>
        <button
          className={'gallery-tab' + (modality === 'openscad' ? ' active' : '')}
          onClick={() => { handleStop(); setModality('openscad'); }}
          title="Browse shared 3D model programs"
        >
          OpenSCAD
        </button>
        <button
          className={'gallery-tab' + (modality === 'svg' ? ' active' : '')}
          onClick={() => { handleStop(); setModality('svg'); }}
          title="Browse shared SVG designs"
        >
          SVG
        </button>
      </div>

      <div className="gallery-sort">
        <label htmlFor="gallery-sort-select">Sort by:</label>
        <select
          id="gallery-sort-select"
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
        <div className="gallery-empty">No shared programs yet for this modality.</div>
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
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            title="Go to previous page"
          >
            Prev
          </button>
          <span className="gallery-page-indicator">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            title="Go to next page"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
