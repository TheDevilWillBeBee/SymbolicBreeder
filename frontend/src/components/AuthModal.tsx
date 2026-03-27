import { useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLogStore } from '../store/logStore';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
}

export function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authLogin = useAuthStore((s) => s.login);
  const authRegister = useAuthStore((s) => s.register);
  const addLog = useLogStore((s) => s.addLog);

  const resetForm = useCallback(() => {
    setLogin('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  }, []);

  const handleTabSwitch = useCallback((t: 'login' | 'signup') => {
    setTab(t);
    resetForm();
  }, [resetForm]);

  const handleLogin = useCallback(async () => {
    if (!login.trim() || !password) return;
    setIsSubmitting(true);
    setError('');
    try {
      await authLogin(login.trim(), password);
      addLog('success', 'Logged in successfully!');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [login, password, authLogin, addLog, onClose]);

  const handleRegister = useCallback(async () => {
    if (!username.trim() || !email.trim() || !password) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setIsSubmitting(true);
    setError('');
    try {
      await authRegister(username.trim(), email.trim(), password);
      addLog('success', 'Account created successfully!');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [username, email, password, confirmPassword, authRegister, addLog, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tab === 'login') handleLogin();
      else handleRegister();
    }
  }, [tab, handleLogin, handleRegister]);

  return (
    <Modal onClose={onClose} contentClassName="auth-modal">
      <div className="modal-header">
        <h3>{tab === 'login' ? 'Log In' : 'Sign Up'}</h3>
        <button onClick={onClose} title="Close">&times;</button>
      </div>

      <div className="auth-tabs">
        <button
          className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('login')}
        >
          Log In
        </button>
        <button
          className={`auth-tab ${tab === 'signup' ? 'active' : ''}`}
          onClick={() => handleTabSwitch('signup')}
        >
          Sign Up
        </button>
      </div>

      <div className="auth-modal-body" onKeyDown={handleKeyDown}>
        {tab === 'login' ? (
          <>
            <div className="auth-field">
              <label htmlFor="auth-login">Email or Username</label>
              <input
                id="auth-login"
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Enter email or username"
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          </>
        ) : (
          <>
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoFocus
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-new-password">Password</label>
              <input
                id="auth-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
            </div>
          </>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button
          className="auth-submit-btn"
          onClick={tab === 'login' ? handleLogin : handleRegister}
          disabled={isSubmitting}
        >
          {isSubmitting
            ? (tab === 'login' ? 'Logging in...' : 'Creating account...')
            : (tab === 'login' ? 'Log In' : 'Create Account')
          }
        </button>
      </div>
    </Modal>
  );
}
