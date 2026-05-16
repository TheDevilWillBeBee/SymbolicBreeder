import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useGalleryStore } from '../store/galleryStore';
import { useLogStore } from '../store/logStore';
import { api } from '../api/client';

interface Props {
  sharedProgramId: string;
  likeCount?: number;
  likedByMe?: boolean;
  onOpenAuth?: () => void;
}

export function LikeButton({ sharedProgramId, likeCount, likedByMe, onOpenAuth }: Props) {
  const user = useAuthStore((s) => s.user);
  const updateLike = useGalleryStore((s) => s.updateLike);
  const addLog = useLogStore((s) => s.addLog);
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth?.();
      return;
    }
    if (!user.is_verified) {
      addLog('warning', 'Please verify your account to like items');
      return;
    }
    if (pending) return;

    // Optimistic update
    const newLiked = !likedByMe;
    const newCount = newLiked ? (likeCount ?? 0) + 1 : Math.max(0, (likeCount ?? 0) - 1);
    updateLike(sharedProgramId, newLiked, newCount);
    setPending(true);

    try {
      const res = await api.post<{ liked: boolean; like_count: number }>(
        `/api/gallery/programs/${sharedProgramId}/like`,
        {},
      );
      updateLike(sharedProgramId, res.liked, res.like_count);
    } catch {
      // Revert optimistic update
      updateLike(sharedProgramId, likedByMe ?? false, likeCount ?? 0);
      addLog('error', 'Failed to update like');
    } finally {
      setPending(false);
    }
  }, [user, likedByMe, likeCount, sharedProgramId, pending, updateLike, addLog, onOpenAuth]);

  return (
    <button
      className={`like-btn ${likedByMe ? 'liked' : ''}`}
      onClick={handleClick}
      title={likedByMe ? 'Remove like' : 'Like this program'}
    >
      <span className="like-heart">{likedByMe ? '\u2764' : '\u2661'}</span>
      {(likeCount ?? 0) > 0 && <span className="like-count">{likeCount}</span>}
    </button>
  );
}
