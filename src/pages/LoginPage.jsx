import { useState } from 'react';
import KGPTLogo from '../components/KGPTLogo';
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  toAuthErrorMessage,
} from '../services/authService';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignUp(email, password, confirmPassword) {
  if (!EMAIL_RE.test(email)) return 'Please enter a valid email address.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
}

const LoginPage = ({ onBackToGuest }) => {
  // Sign-in state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState('');
  const [signInLoading, setSignInLoading] = useState(false);

  // Sign-up state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirm, setSignUpConfirm] = useState('');
  const [signUpError, setSignUpError] = useState('');
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Mobile: which panel is active ('signin' | 'signup')
  const [mobileTab, setMobileTab] = useState('signin');

  // Inline validation hints (only show after user has typed something)
  const emailValid = signUpEmail === '' || EMAIL_RE.test(signUpEmail);
  const passwordValid = signUpPassword === '' || signUpPassword.length >= 6;
  const confirmValid = signUpConfirm === '' || signUpConfirm === signUpPassword;

  const handleSignIn = async (event) => {
    event.preventDefault();
    setSignInError('');
    setSignInLoading(true);
    try {
      await loginWithEmail(signInEmail, signInPassword);
    } catch (err) {
      setSignInError(toAuthErrorMessage(err));
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (event) => {
    event.preventDefault();
    const validationError = validateSignUp(signUpEmail, signUpPassword, signUpConfirm);
    if (validationError) {
      setSignUpError(validationError);
      return;
    }
    setSignUpError('');
    setSignUpLoading(true);
    try {
      await registerWithEmail(signUpEmail, signUpPassword);
    } catch (err) {
      setSignUpError(toAuthErrorMessage(err));
    } finally {
      setSignUpLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setSignInError('');
    setSignInLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setSignInError(toAuthErrorMessage(err));
    } finally {
      setSignInLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSignUpError('');
    setSignUpLoading(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setSignUpError(toAuthErrorMessage(err));
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-split-card">

        {/* ── Left panel: Sign In ── */}
        <div className={`login-panel login-panel--left${mobileTab !== 'signin' ? ' login-panel--mobile-hidden' : ''}`}>
          <div className="brand-lockup login-brand-lockup">
            <KGPTLogo className="brand-mark brand-mark-login" />
            <h1>KrishnaGPT</h1>
          </div>
          <h2 className="login-panel-title">Welcome back</h2>
          <p className="login-subtitle">Sign in to continue your journey.</p>

          <form onSubmit={handleSignIn} className="login-form">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              value={signInEmail}
              onChange={(e) => setSignInEmail(e.target.value)}
              required
              disabled={signInLoading}
              placeholder="you@example.com"
            />

            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              value={signInPassword}
              onChange={(e) => setSignInPassword(e.target.value)}
              required
              disabled={signInLoading}
              placeholder="Your password"
            />

            <button type="submit" disabled={signInLoading} className="login-primary-btn">
              {signInLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signInLoading}
            className="login-google-btn"
          >
            Continue with Google
          </button>

          {signInError ? <p className="login-error">{signInError}</p> : null}

          {onBackToGuest ? (
            <button
              type="button"
              onClick={onBackToGuest}
              disabled={signInLoading}
              className="login-guest-btn"
            >
              Continue in temporary chat mode
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setMobileTab('signup')}
            className="login-mobile-toggle"
          >
            New here? Create an account
          </button>
        </div>

        {/* ── Vertical divider ── */}
        <div className="login-vertical-divider" />

        {/* ── Right panel: Sign Up ── */}
        <div className={`login-panel login-panel--right${mobileTab !== 'signup' ? ' login-panel--mobile-hidden' : ''}`}>
          <h2 className="login-panel-title login-panel-title--top">Create account</h2>
          <p className="login-subtitle">Start your free journey with Krishna.</p>

          <form onSubmit={handleSignUp} className="login-form">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              value={signUpEmail}
              onChange={(e) => setSignUpEmail(e.target.value)}
              required
              disabled={signUpLoading}
              placeholder="you@example.com"
              className={signUpEmail && !emailValid ? 'input-invalid' : ''}
            />
            {signUpEmail && !emailValid ? (
              <span className="login-field-hint login-field-hint--error">Enter a valid email address.</span>
            ) : null}

            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              type="password"
              value={signUpPassword}
              onChange={(e) => setSignUpPassword(e.target.value)}
              required
              minLength={6}
              disabled={signUpLoading}
              placeholder="Minimum 6 characters"
              className={signUpPassword && !passwordValid ? 'input-invalid' : ''}
            />
            {signUpPassword && !passwordValid ? (
              <span className="login-field-hint login-field-hint--error">Password must be at least 6 characters.</span>
            ) : null}
            {signUpPassword && passwordValid ? (
              <span className="login-field-hint login-field-hint--ok">Looks good!</span>
            ) : null}

            <label htmlFor="signup-confirm">Confirm Password</label>
            <input
              id="signup-confirm"
              type="password"
              value={signUpConfirm}
              onChange={(e) => setSignUpConfirm(e.target.value)}
              required
              disabled={signUpLoading}
              placeholder="Re-enter your password"
              className={signUpConfirm && !confirmValid ? 'input-invalid' : ''}
            />
            {signUpConfirm && !confirmValid ? (
              <span className="login-field-hint login-field-hint--error">Passwords do not match.</span>
            ) : null}
            {signUpConfirm && confirmValid ? (
              <span className="login-field-hint login-field-hint--ok">Passwords match!</span>
            ) : null}

            <button type="submit" disabled={signUpLoading} className="login-primary-btn login-primary-btn--signup">
              {signUpLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <div className="login-divider"><span>or</span></div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={signUpLoading}
            className="login-google-btn"
          >
            Create account with Google
          </button>

          {signUpError ? <p className="login-error">{signUpError}</p> : null}

          <button
            type="button"
            onClick={() => setMobileTab('signin')}
            className="login-mobile-toggle"
          >
            Already have an account? Sign in
          </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
