import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { routePaths } from '../constants/app-constants';

export type UserRole = 'admin' | 'teacher' | 'parent';

export type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  first_name: string;
  middle_name?: string;
  last_name: string;
  phone: string;
  profile_photo?: string | null;
  is_active?: boolean;
  welcome_message?: string;
};

type ApiResult = {
  status?: boolean;
  message?: string;
  error?: string;
  data?: { preferences?: Record<string, unknown> };
  user?: AuthUser;
  tokens?: { access_token?: string };
}

async function requestFile(path: string, token?: string) {
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    let message = `The request could not be completed (status ${response.status}).`;
    try {
      const body = (await response.json()) as ApiResult;
      message = body.message ?? body.error ?? message;
    } catch {
      // Keep the HTTP status message when the server response is not JSON.
    }
    throw new ApiRequestError(message, response.status);
  }
  return response.blob();
}

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  sessionMessage: string;
  login: (
    identifier: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<AuthUser>;
  registerParent: (
    payload: FormData | Record<string, unknown>,
  ) => Promise<AuthUser>;
  registerTeacher: (payload: Record<string, unknown>) => Promise<AuthUser>;
  updateUser: (updates: Partial<AuthUser>) => void;
  logout: () => Promise<void>;
  request: <T = unknown>(path: string, options?: RequestInit) => Promise<T>;
  download: (path: string) => Promise<Blob>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

function requiresSessionRestore(pathname: string) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const publicPaths = [
    routePaths.welcome,
    routePaths.accountChoice,
    routePaths.signup,
    routePaths.login,
  ];

  return !publicPaths.some((publicPath) => {
    const normalizedPath = publicPath.replace(/\/+$/, '') || '/';
    return (
      path === normalizedPath ||
      (normalizedPath !== '/' && path.startsWith(`${normalizedPath}/`))
    );
  });
}

class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

function getSessionMessage(error: unknown) {
  if (error instanceof ApiRequestError && error.status === 401) {
    return /expired|revoked/i.test(error.message)
      ? 'Your session has expired. Please log in again.'
      : '';
  }
  return 'Your session could not be verified. Please check your connection and try again.';
}

async function requestJson(
  path: string,
  options: RequestInit = {},
  token?: string,
) {
  const headers = new Headers(options.headers);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  const responseText = await response.text();
  let body: ApiResult | null = null;

  if (responseText.trim()) {
    try {
      body = JSON.parse(responseText) as ApiResult;
    } catch {
      const details = responseText
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      throw new Error(
        response.ok
          ? `The server returned an invalid response: ${
              details.length > 180 ? `${details.slice(0, 177)}...` : details
            }`
          : `The request failed with status ${response.status}: ${
              details.length > 180 ? `${details.slice(0, 177)}...` : details
            }`,
      );
    }
  }

  if (!response.ok) {
    throw new ApiRequestError(
      body?.message ?? body?.error ?? 'The request could not be completed.',
      response.status,
    );
  }

  if (!body) {
    throw new Error(
      response.ok
        ? 'The server returned an empty response.'
        : `The request failed with status ${response.status} and returned an empty response.`,
    );
  }

  return body;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [checkedPath, setCheckedPath] = useState<string | null>(null);
  const [sessionMessage, setSessionMessage] = useState('');
  const refreshPromise = useRef<Promise<string> | null>(null);
  const checkedPathRef = useRef<string | null>(null);
  const loadingPathRef = useRef<string | null>(null);

  const refreshAccessToken = useCallback(() => {
    if (!refreshPromise.current) {
      const refresh = async () => {
        const result = (await requestJson('/api/refresh', {
          method: 'POST',
        })) as ApiResult;
        const refreshedToken = result.tokens?.access_token;
        if (!result.user || !refreshedToken) {
          throw new Error(
            'The server returned an incomplete session refresh response.',
          );
        }
        setUser(result.user);
        setAccessToken(refreshedToken);
        setSessionMessage('');
        return refreshedToken;
      };
      const pendingRefresh: Promise<string> = (navigator.locks
        ? navigator.locks.request('kalingalink-auth-refresh', refresh)
        : refresh()
      ).catch((error: unknown) => {
        if (error instanceof ApiRequestError && error.status === 401) {
          setUser(null);
          setAccessToken(null);
          setSessionMessage(getSessionMessage(error));
        }
        throw error;
      }).finally(() => {
        refreshPromise.current = null;
      });
      refreshPromise.current = pendingRefresh;
    }
    return refreshPromise.current;
  }, []);

  useEffect(() => {
    let active = true;
    const path = location.pathname;

    if (!requiresSessionRestore(path)) {
      checkedPathRef.current = path;
      loadingPathRef.current = null;
      setCheckedPath(path);
      setSessionLoading(false);
      return () => {
        active = false;
      };
    }

    if (user) {
      checkedPathRef.current = path;
      loadingPathRef.current = null;
      setCheckedPath(path);
      setSessionLoading(false);
      return () => {
        active = false;
      };
    }

    if (checkedPathRef.current === path && loadingPathRef.current !== path) {
      return;
    }

    loadingPathRef.current = path;
    setCheckedPath(path);
    setSessionLoading(true);
    void refreshAccessToken()
      .catch((error: unknown) => {
        if (!active) return;
        setUser(null);
        setAccessToken(null);
        setSessionMessage(getSessionMessage(error));
      })
      .finally(() => {
        if (active && loadingPathRef.current === path) {
          loadingPathRef.current = null;
          checkedPathRef.current = path;
          setCheckedPath(path);
          setSessionLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [
    location.pathname,
    refreshAccessToken,
    user,
  ]);

  useEffect(() => {
    if (!user || !accessToken) return;
    let active = true;
    let media: MediaQueryList | null = null;
    let applyTheme: (() => void) | null = null;
    void requestJson('/api/settings', {}, accessToken)
      .then((result: ApiResult) => {
        if (!active || !result.data?.preferences) return;
        const preferences = result.data.preferences;
        const theme = preferences.theme;
        if (theme === 'light' || theme === 'dark' || theme === 'system') {
          media = window.matchMedia('(prefers-color-scheme: dark)');
          applyTheme = () => {
            document.documentElement.dataset.theme =
              theme === 'system' ? (media?.matches ? 'dark' : 'light') : theme;
          };
          applyTheme();
          if (theme === 'system') {
            media.addEventListener('change', applyTheme);
          }
        }
        if (
          preferences.language === 'en-US' ||
          preferences.language === 'fil'
        ) {
          document.documentElement.lang = preferences.language;
        }
        if (typeof preferences.dateFormat === 'string') {
          document.documentElement.dataset.dateFormat = preferences.dateFormat;
        }
        if (typeof preferences.timeFormat === 'string') {
          document.documentElement.dataset.timeFormat = preferences.timeFormat;
        }
        const timeZones: Record<string, string> = {
          '(UTC+08:00) Manila': 'Asia/Manila',
          '(UTC+00:00) UTC': 'UTC',
          '(UTC-05:00) Eastern Time': 'America/New_York',
        };
        if (
          typeof preferences.timeZone === 'string' &&
          timeZones[preferences.timeZone]
        ) {
          document.documentElement.dataset.timeZone =
            timeZones[preferences.timeZone];
        }
      })
      .catch((error: unknown) => {
        if (active)
          console.error('Account preferences could not be applied.', error);
      });
    return () => {
      active = false;
      if (media && applyTheme) media.removeEventListener('change', applyTheme);
    };
  }, [accessToken, user]);

  async function acceptSession(result: ApiResult) {
    if (!result.user || !result.tokens?.access_token) {
      throw new Error('The server returned an incomplete sign-in response.');
    }
    setUser(result.user);
    setAccessToken(result.tokens.access_token);
    return result.user;
  }

  async function login(
    identifier: string,
    password: string,
    rememberMe = false,
  ) {
    const result = await requestJson('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier,
        password,
        remember_me: rememberMe,
      }),
    });
    const user = await acceptSession(result as ApiResult);
    setSessionMessage('');
    return user;
  }

  async function registerParent(payload: FormData | Record<string, unknown>) {
    const result = await requestJson('/api/register/parent', {
      method: 'POST',
      body: payload instanceof FormData ? payload : JSON.stringify(payload),
    });
    const user = await acceptSession(result as ApiResult);
    setSessionMessage('');
    return user;
  }

  async function registerTeacher(payload: Record<string, unknown>) {
    const result = await requestJson('/api/register/teacher', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const user = await acceptSession(result as ApiResult);
    setSessionMessage('');
    return user;
  }

  async function logout() {
    await requestJson(
      '/api/logout',
      { method: 'POST' },
      accessToken ?? undefined,
    );
    setUser(null);
    setAccessToken(null);
    setSessionMessage('');
  }

  const updateUser = useCallback((updates: Partial<AuthUser>) => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const request = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      try {
        return (await requestJson(
          path,
          options,
          accessToken ?? undefined,
        )) as T;
      } catch (error) {
        if (!(error instanceof ApiRequestError) || error.status !== 401) {
          throw error;
        }
        const refreshedToken = await refreshAccessToken();
        return (await requestJson(path, options, refreshedToken)) as T;
      }
    },
    [accessToken, refreshAccessToken],
  );

  const download = useCallback(
    async (path: string) => {
      try {
        return await requestFile(path, accessToken ?? undefined);
      } catch (error) {
        if (!(error instanceof ApiRequestError) || error.status !== 401) throw error;
        const refreshedToken = await refreshAccessToken();
        return requestFile(path, refreshedToken);
      }
    },
    [accessToken, refreshAccessToken],
  );

  const loading =
    !user &&
    requiresSessionRestore(location.pathname) &&
    (sessionLoading || checkedPath !== location.pathname);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        sessionMessage,
        login,
        registerParent,
        registerTeacher,
        updateUser,
        logout,
        request,
        download,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}
