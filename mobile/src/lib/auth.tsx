import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as api from './api';

interface AuthState {
  user: { id: string; email: string; first_name?: string } | null;
  loading: boolean;
  signInEmail: (email: string, password: string) => Promise<void>;
  signInApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await api.getMe());
    } catch {
      setUser(null);
    }
  }, []);

  // Restore session from the keychain on launch (tokens persisted by the BFF client).
  useEffect(() => {
    (async () => {
      if (await api.getTokens()) await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const signInEmail = useCallback(
    async (email: string, password: string) => {
      await api.login(email, password);
      await refreshUser();
    },
    [refreshUser],
  );

  // Sign in with Apple: obtain the Apple credential, hand the identity token to
  // the BFF's /auth/apple. That endpoint returns 501 until an Apple provider is
  // provisioned in Directus (see backend README) - the button and this flow are
  // already wired end-to-end for that moment.
  const signInApple = useCallback(async () => {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    const fullName = credential.fullName?.givenName ?? null;
    await api.loginApple(credential.identityToken, fullName);
    await refreshUser();
  }, [refreshUser]);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, signInEmail, signInApple, signOut }),
    [user, loading, signInEmail, signInApple, signOut],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
