import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import sideLayout from '../../../sidelayout.png';
import { routePaths } from '../../constants/app-constants';
import styles from './Login.module.css';
import { Logo } from '../../components/common/Logo/Logo';
import { useAuth } from '../../auth/AuthProvider';
import { dashboardPathForRole } from '../../auth/role-routes';

function Icon({
  name,
}: {
  name: 'mail' | 'lock' | 'eye' | 'eyeOff' | 'help' | 'arrow';
}) {
  const shared = {
    'aria-hidden': true as const,
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'mail':
      return (
        <svg {...shared}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m4 7 8 6 8-6" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...shared}>
          <rect x="4" y="10" width="16" height="11" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...shared}>
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'eyeOff':
      return (
        <svg {...shared}>
          <path d="m3 3 18 18M10.6 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-3.1 3.6M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.3 3.7-.8" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
        </svg>
      );
    case 'help':
      return (
        <svg {...shared}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.6 9a2.5 2.5 0 1 1 4.4 1.6c-1 1.1-2 1.2-2 3m0 3h.01" />
        </svg>
      );
    default:
      return (
        <svg {...shared}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </svg>
      );
  }
}

function postLoginPath(
  role: string,
  intendedPath?: { pathname?: string; search?: string; hash?: string },
) {
  const canReturnToIntendedPath =
    typeof intendedPath?.pathname === 'string' &&
    ((role === 'admin' && intendedPath.pathname.startsWith('/admin/')) ||
      (role === 'teacher' && intendedPath.pathname.startsWith('/teacher/')) ||
      (role === 'parent' && intendedPath.pathname.startsWith('/parent/')));

  if (canReturnToIntendedPath && intendedPath.pathname) {
    return `${intendedPath.pathname}${intendedPath.search ?? ''}${intendedPath.hash ?? ''}`;
  }
  return dashboardPathForRole(role);
}

export function Login() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectState = location.state as {
    from?: { pathname?: string; search?: string; hash?: string };
    message?: string;
  } | null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState(redirectState?.message ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [googleStarting, setGoogleStarting] = useState(false);
  const loginInProgress = useRef(false);

  useEffect(() => {
    const result = new URLSearchParams(location.search).get('google_result');
    if (!result) return;
    const resultMessages: Record<string, string> = {
      google_cancelled: 'Google sign-in was cancelled.',
      google_unregistered:
        'This Google email is not registered. Please register first or use an authorized KalingaLink account.',
      google_inactive:
        'This KalingaLink account is inactive or awaiting approval. Please contact an administrator.',
      google_not_configured:
        'Google sign-in is not configured. Please use email and password or contact support.',
      google_failed:
        'Google sign-in could not be completed. Please try again or use email and password.',
    };
    if (result === 'google_success') {
      setMessage('Google sign-in complete. Loading your account…');
    } else {
      setMessage(resultMessages[result] ?? resultMessages.google_failed);
    }
    const search = new URLSearchParams(location.search);
    search.delete('google_result');
    navigate(
      { pathname: location.pathname, search: search.toString() ? `?${search}` : '' },
      { replace: true, state: location.state },
    );
  }, [location, navigate]);

  useEffect(() => {
    const navigationState = location.state as { welcomeMessage?: unknown } | null;
    if (
      loading ||
      !user ||
      submitting ||
      loginInProgress.current ||
      typeof navigationState?.welcomeMessage === 'string'
    ) return;
    const destination = user.role === 'teacher' && user.is_active === false
      ? routePaths.teacherVerification
      : postLoginPath(user.role, redirectState?.from);
    if (location.pathname !== destination) {
      navigate(destination, { replace: true });
    }
  }, [loading, location, navigate, redirectState, submitting, user]);

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    loginInProgress.current = true;
    setSubmitting(true);
    try {
      const user = await login(email, password, rememberMe);
      const destination = user.role === 'teacher' && user.is_active === false
        ? routePaths.teacherVerification
        : postLoginPath(user.role, redirectState?.from);
      navigate(destination, {
        replace: true,
        state: user.welcome_message
          ? { welcomeMessage: user.welcome_message }
          : null,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed.');
    } finally {
      loginInProgress.current = false;
      setSubmitting(false);
    }
  }

  function startGoogleSignIn() {
    if (googleStarting || submitting) return;
    setMessage('Connecting to Google…');
    setGoogleStarting(true);
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    try {
      window.location.assign(`${apiBaseUrl}/api/auth/google`);
    } catch {
      setGoogleStarting(false);
      setMessage('Google sign-in could not be started. Please try again.');
    }
  }

  return (
    <main className={styles.page}>
      <section
        aria-label="KalingaLink"
        className={styles.brandPanel}
        style={{ backgroundImage: `url("${sideLayout}")` }}
      >
        <div className={styles.brandContent}>
          <Logo
            alt="KalingaLink — Learn, Grow, Build a Brighter Future"
            className={styles.brandLogo}
            variant="login"
          />
        </div>
      </section>

      <section aria-labelledby="login-title" className={styles.loginPanel}>
        <Link
          aria-label="Back to Get Started"
          className={styles.backButton}
          to={routePaths.accountChoice}
        >
          <svg
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <a className={styles.supportLink} href="mailto:support@kalingalink.ph">
          Need help? Contact Support <Icon name="help" />
        </a>

        <div className={styles.loginContent}>
          <header className={styles.loginHeader}>
            <h2 id="login-title">Welcome Back!</h2>
            <p>
              Log in to your MSWDO account to continue managing child
              development services.
            </p>
          </header>

          <form className={styles.form} onSubmit={submitLogin}>
            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <Icon name="mail" />
              </span>
              <span className={styles.inputContent}>
                <label htmlFor="login-email">Email Address or Username</label>
                <input
                  autoComplete="username"
                  id="login-email"
                  onChange={(event) => setEmail(event.target.value)}
                  maxLength={255}
                  placeholder="you@example.com or username"
                  required
                  type="text"
                  value={email}
                />
              </span>
            </div>

            <div className={styles.inputGroup}>
              <span className={styles.inputIcon}>
                <Icon name="lock" />
              </span>
              <span className={styles.inputContent}>
                <label htmlFor="login-password">Password</label>
                <input
                  autoComplete="current-password"
                  id="login-password"
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                />
              </span>
              <button
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className={styles.passwordToggle}
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} />
              </button>
            </div>

            <div className={styles.formOptions}>
              <label className={styles.rememberOption}>
                <input
                  aria-label="Remember me"
                  checked={rememberMe}
                  id="remember-me"
                  onChange={(event) => setRememberMe(event.target.checked)}
                  type="checkbox"
                />
                <span>Remember me</span>
              </label>
              <button
                className={styles.forgotButton}
                onClick={() =>
                  setMessage(
                    'Password recovery is not available yet. Please contact support@kalingalink.ph for assistance.',
                  )
                }
                type="button"
              >
                Forgot password?
              </button>
            </div>

            <button className={styles.loginButton} disabled={submitting} type="submit">
              <Icon name="arrow" />
              {submitting ? 'Signing in…' : 'Log In'}
            </button>

            {message && (
              <p
                aria-live="polite"
                className={styles.statusMessage}
                role="status"
              >
                {message}
              </p>
            )}

            <div aria-hidden="true" className={styles.divider}>
              <span />
              <span>or</span>
              <span />
            </div>

            <button
              aria-busy={googleStarting}
              className={styles.googleButton}
              disabled={googleStarting || submitting}
              onClick={startGoogleSignIn}
              type="button"
            >
              <span aria-hidden="true" className={styles.googleMark}>
                G
              </span>
              Continue with Google
            </button>

            <p className={styles.createAccount}>
              New to KalingaLink?{' '}
              <Link to={routePaths.accountChoice}>Create an account</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
