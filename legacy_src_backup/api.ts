// API Client Helper with Token Authorization & Automatic Refresh
const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('ta3n_access_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('ta3n_access_token', token);
  } else {
    localStorage.removeItem('ta3n_access_token');
  }
}

export interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
  [key: string]: any;
}

export async function apiFetch(endpoint: string, options: ApiOptions = {}): Promise<any> {

  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is an object and not FormData, stringify it
  if (options.body && !(options.body instanceof FormData) && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  } else if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'omit',
  });

  // If 401 Unauthorized, try to refresh token once
  if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/google') {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.accessToken) {
          setAuthToken(refreshData.accessToken);
          headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
          // Retry original request
          response = await fetch(`${API_BASE}${endpoint}`, {
            ...options,
            headers,
            credentials: 'omit',
          });
        } else {
          setAuthToken(null);
          window.dispatchEvent(new Event('auth_logout'));
        }
      } else {
        // Refresh failed, clear token and logout
        setAuthToken(null);
        window.dispatchEvent(new Event('auth_logout'));
      }
    } catch {
      setAuthToken(null);
      window.dispatchEvent(new Event('auth_logout'));
    }
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      // Direct 401 after failed refresh
      window.dispatchEvent(new Event('auth_logout'));
    }
    throw new Error(data.error || `خطأ في الخادم (${response.status})`);
  }

  return data;
}
