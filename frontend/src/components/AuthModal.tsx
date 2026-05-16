import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useLogStore } from '../store/logStore';
import { Modal } from './Modal';

interface Props {
  onClose: () => void;
}

async function maybeStoreBrowserCredential(params: {
  id: string;
  password: string;
  name?: string;
}) {
  if (typeof window === 'undefined') return;

  const PasswordCredentialCtor = (window as Window & {
    PasswordCredential?: new (data: {
      id: string;
      password: string;
      name?: string;
    }) => Credential;
  }).PasswordCredential;

  if (!PasswordCredentialCtor || !('credentials' in navigator)) return;

  try {
    const credential = new PasswordCredentialCtor({
      id: params.id,
      password: params.password,
      name: params.name,
    });
    await navigator.credentials.store(credential);
  } catch {
    // Ignore unsupported/blocked credential manager writes.
  }
}

export function AuthModal({ onClose }: Props) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<'form' | 'verify'>('form');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [signupChallengeId, setSignupChallengeId] = useState<string | null>(null);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);
  const [codeExpiresSecondsLeft, setCodeExpiresSecondsLeft] = useState(0);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const delayedClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 600);
  }, [onClose]);

  const authLogin = useAuthStore((s) => s.login);
  const startSignup = useAuthStore((s) => s.startSignup);
  const verifySignupCode = useAuthStore((s) => s.verifySignupCode);
  const resendSignupCode = useAuthStore((s) => s.resendSignupCode);
  const addLog = useLogStore((s) => s.addLog);

  const resetForm = useCallback(() => {
    setSignupStep('form');
    setLogin('');
    setEmail('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setSignupChallengeId(null);
    setResendSecondsLeft(0);
    setCodeExpiresSecondsLeft(0);
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
      const user = await authLogin(login.trim(), password);
      const credentialId = (user.email || user.username || login).trim();
      void maybeStoreBrowserCredential({
        id: credentialId,
        password,
        name: user.username,
      });
      addLog('success', 'Logged in successfully!');
      delayedClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [login, password, authLogin, addLog, delayedClose]);

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
      const res = await startSignup(username.trim(), email.trim(), password);
      setSignupChallengeId(res.challenge_id);
      setResendSecondsLeft(res.resend_after_seconds);
      setCodeExpiresSecondsLeft(res.expires_in_seconds);
      setVerificationCode('');
      setSignupStep('verify');
      addLog('success', 'Verification code sent. Check your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [username, email, password, confirmPassword, startSignup, addLog]);

  const handleVerifyCode = useCallback(async () => {
    if (!signupChallengeId) {
      setError('Verification session expired. Please sign up again.');
      setSignupStep('form');
      return;
    }
    const normalizedCode = verificationCode.trim();
    if (!/^[0-9]{6}$/.test(normalizedCode)) {
      setError('Enter the 6-digit code from your email');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const user = await verifySignupCode(signupChallengeId, normalizedCode);
      const credentialId = (user.email || email || user.username || username).trim();
      void maybeStoreBrowserCredential({
        id: credentialId,
        password,
        name: user.username || username,
      });
      addLog('success', 'Account verified and created successfully!');
      delayedClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  }, [signupChallengeId, verificationCode, verifySignupCode, email, username, password, addLog, delayedClose]);

  const handleResendCode = useCallback(async () => {
    if (!signupChallengeId || resendSecondsLeft > 0) return;

    setIsSubmitting(true);
    setError('');
    try {
      const res = await resendSignupCode(signupChallengeId);
      setResendSecondsLeft(res.resend_after_seconds);
      setCodeExpiresSecondsLeft(res.expires_in_seconds);
      addLog('success', 'A new verification code was sent.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification code');
    } finally {
      setIsSubmitting(false);
    }
  }, [signupChallengeId, resendSecondsLeft, resendSignupCode, addLog]);

  useEffect(() => {
    if (tab !== 'signup' || signupStep !== 'verify') return;
    if (resendSecondsLeft <= 0 && codeExpiresSecondsLeft <= 0) return;

    const timer = window.setTimeout(() => {
      setResendSecondsLeft((prev) => Math.max(prev - 1, 0));
      setCodeExpiresSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [tab, signupStep, resendSecondsLeft, codeExpiresSecondsLeft]);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    // Let login & signup forms submit natively to the hidden iframe so the
    // browser detects a real form submission and offers "Save password?" /
    // "Suggest strong password". Only prevent default for the verification
    // step (no credentials to save there).
    if (tab === 'login') {
      void handleLogin();
    } else if (signupStep === 'verify') {
      e.preventDefault();
      void handleVerifyCode();
    } else {
      void handleRegister();
    }
  }, [tab, signupStep, handleLogin, handleRegister, handleVerifyCode]);

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

      <iframe
        name="auth-hidden-frame"
        style={{ display: 'none' }}
        tabIndex={-1}
        aria-hidden="true"
      />

      <form
        key={tab}
        className="auth-modal-body"
        onSubmit={handleSubmit}
        method="post"
        action="about:blank"
        target="auth-hidden-frame"
        autoComplete="on"
        aria-label={tab === 'login' ? 'Login form' : 'Sign up form'}
      >
        {tab === 'login' ? (
          <>
            <div className="auth-field">
              <label htmlFor="auth-login">Email or Username</label>
              <input
                id="auth-login"
                type="text"
                name="username"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Enter email or username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </div>
          </>
        ) : signupStep === 'form' ? (
          <>
            <div className="auth-field">
              <label htmlFor="auth-username">Username</label>
              <input
                id="auth-username"
                type="text"
                name="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-new-password">Password</label>
              <input
                id="auth-new-password"
                type="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>
            <div className="auth-field">
              <label htmlFor="auth-confirm-password">Confirm Password</label>
              <input
                id="auth-confirm-password"
                type="password"
                name="password-confirmation"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                required
              />
            </div>
          </>
        ) : (
          <>
            <div className="auth-verify-note">
              Enter the 6-digit code sent to <strong>{email}</strong>. If you do not see it,
              check your spam or junk folder.
            </div>
            <div className="auth-field">
              <label htmlFor="auth-verification-code">Verification Code</label>
              <input
                id="auth-verification-code"
                type="text"
                name="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="6-digit code"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                autoFocus
                required
              />
            </div>

            <div className="auth-verify-meta">
              <span>
                {codeExpiresSecondsLeft > 0
                  ? `Code expires in ${codeExpiresSecondsLeft}s`
                  : 'Code expired. Resend to continue.'}
              </span>
              <button
                type="button"
                className="auth-secondary-btn"
                onClick={handleResendCode}
                disabled={isSubmitting || resendSecondsLeft > 0}
              >
                {resendSecondsLeft > 0 ? `Resend in ${resendSecondsLeft}s` : 'Resend code'}
              </button>
            </div>

            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => {
                setSignupStep('form');
                setSignupChallengeId(null);
                setVerificationCode('');
                setResendSecondsLeft(0);
                setCodeExpiresSecondsLeft(0);
                setError('');
              }}
              disabled={isSubmitting}
            >
              Use different signup details
            </button>
          </>
        )}

        {error && <div className="auth-error">{error}</div>}

        <button
          className="auth-submit-btn"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? (tab === 'login'
              ? 'Logging in...'
              : (signupStep === 'verify' ? 'Verifying code...' : 'Sending code...'))
            : (tab === 'login'
              ? 'Log In'
              : (signupStep === 'verify' ? 'Verify & Create Account' : 'Send Verification Code'))
          }
        </button>
      </form>
    </Modal>
  );
}
