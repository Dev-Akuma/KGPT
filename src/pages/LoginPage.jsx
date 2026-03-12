import { useState } from 'react';
import KGPTLogo from '../components/KGPTLogo';
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  toAuthErrorMessage,
} from '../services/authService';

const LoginPage = ({ onBackToGuest }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitWithEmail = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegisterMode) {
        await registerWithEmail(email, password);
      } else {
        await loginWithEmail(email, password);
      }
    } catch (authError) {
      setError(toAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  const submitWithGoogle = async () => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle();
    } catch (authError) {
      setError(toAuthErrorMessage(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-lockup login-brand-lockup">
          <KGPTLogo className="brand-mark brand-mark-login" />
          <h1>KrishnaGPT</h1>
        </div>
        <p className="login-subtitle">Sign in to continue your chat history.</p>

        <form onSubmit={submitWithEmail} className="login-form">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
            placeholder="you@example.com"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            disabled={loading}
            placeholder="Minimum 6 characters"
          />

          <button type="submit" disabled={loading} className="login-primary-btn">
            {loading ? 'Please wait...' : isRegisterMode ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button type="button" onClick={submitWithGoogle} disabled={loading} className="login-google-btn">
          {isRegisterMode ? 'Create account with Google' : 'Continue with Google'}
        </button>

        <button
          type="button"
          onClick={() => setIsRegisterMode((prev) => !prev)}
          disabled={loading}
          className="login-toggle-btn"
        >
          {isRegisterMode
            ? 'Already have an account? Sign in'
            : 'New here? Create an account'}
        </button>

        {onBackToGuest ? (
          <button
            type="button"
            onClick={onBackToGuest}
            disabled={loading}
            className="login-guest-btn"
          >
            Continue in temporary chat mode
          </button>
        ) : null}

        {error ? <p className="login-error">{error}</p> : null}
      </div>
    </div>
  );
};

export default LoginPage;
