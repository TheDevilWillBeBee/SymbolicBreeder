import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavStore } from '../store/navStore';

interface Props {
  onOpenAuth: () => void;
  onMenuAction?: () => void; // close mobile menu if open
}

export function UserMenu({ onOpenAuth, onMenuAction }: Props) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const goToMyShared = useNavStore((s) => s.goToMyShared);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  const handleMyShared = useCallback(() => {
    goToMyShared();
    setDropdownOpen(false);
    onMenuAction?.();
  }, [goToMyShared, onMenuAction]);

  const handleLogout = useCallback(() => {
    logout();
    setDropdownOpen(false);
    onMenuAction?.();
  }, [logout, onMenuAction]);

  if (!user) {
    return (
      <button
        className="header-nav-btn user-login-btn"
        onClick={() => { onOpenAuth(); onMenuAction?.(); }}
        title="Log in or sign up"
      >
        Login
      </button>
    );
  }

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-menu-trigger"
        onClick={() => setDropdownOpen((v) => !v)}
        title="User menu"
      >
        <span className="user-avatar">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <span className="user-menu-name">{user.username}</span>
      </button>
      {dropdownOpen && (
        <div className="user-menu-dropdown">
          <button onClick={handleMyShared}>My Shared Items</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}
