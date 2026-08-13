import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { getCurrentUser, signInWithGoogle, signInWithPassword, TOKEN_STORAGE_KEY } from "../api/client";
import type { User } from "../api/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  loginWithGoogleIdToken: (idToken: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_STORAGE_KEY)) {
      setLoading(false);
      return;
    }
    getCurrentUser()
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  const loginWithGoogleIdToken = useCallback(async (idToken: string) => {
    const { access_token, user } = await signInWithGoogle(idToken);
    localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
    setUser(user);
  }, []);

  const loginWithPassword = useCallback(async (email: string, password: string) => {
    const { access_token, user } = await signInWithPassword(email, password);
    localStorage.setItem(TOKEN_STORAGE_KEY, access_token);
    setUser(user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogleIdToken, loginWithPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
