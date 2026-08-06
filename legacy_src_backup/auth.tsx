import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from './types.ts';
import { apiFetch, getAuthToken, setAuthToken } from './api.ts';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { app } from './firebase.ts';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginWithEmail: (email: string, name?: string) => Promise<boolean>;
  triggerGoogleLogin: () => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Global event listener for token refresh failures or session expiries
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setAuthToken(null);
    };
    window.addEventListener('auth_logout', handleLogoutEvent);
    return () => window.removeEventListener('auth_logout', handleLogoutEvent);
  }, []);

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: { credential }
      });
      if (data && data.accessToken) {
        setAuthToken(data.accessToken);
        setUser(data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, name?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const data = await apiFetch('/auth/email-login', {
        method: 'POST',
        body: { email, name }
      });
      if (data && data.accessToken) {
        setAuthToken(data.accessToken);
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login result from popup or redirect
  const handleGoogleResult = async (result: any) => {
    if (!result || !result.user) return;
    try {
      // Get the actual Google OAuth credential (access token / id token)
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        await loginWithGoogle(credential.accessToken);
        return;
      }
      if (credential?.idToken) {
        await loginWithGoogle(credential.idToken);
        return;
      }
      // Last resort: use email login
      const email = result.user.email || '';
      const name = result.user.displayName || email.split('@')[0];
      await loginWithEmail(email, name);
    } catch {
      // Fallback to email login
      const email = result.user.email || '';
      const name = result.user.displayName || email.split('@')[0];
      await loginWithEmail(email, name);
    }
  };

  const refreshSession = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const data = await apiFetch('/auth/session');
      if (data && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect result on page load (for when signInWithRedirect was used)
  useEffect(() => {
    let mounted = true;
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    const init = async () => {
      try {
        const auth = getAuth(app);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await handleGoogleResult(result);
          if (mounted) clearTimeout(timeout);
          return;
        }
      } catch (err) {
        console.warn('getRedirectResult error:', err);
      }
      await refreshSession();
      if (mounted) clearTimeout(timeout);
    };
    init();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  const triggerGoogleLogin = async () => {
    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    try {
      // Stage 1: Try Popup (fastest & best desktop UX)
      const result = await signInWithPopup(auth, provider);
      await handleGoogleResult(result);
    } catch (err: any) {
      console.warn('Popup failed or blocked, attempting redirect:', err?.code || err);
      // Stage 2: Fallback to Redirect (works everywhere)
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectErr) {
        console.error('Redirect also failed:', redirectErr);
        throw err;
      }
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, triggerGoogleLogin, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
