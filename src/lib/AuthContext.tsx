import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import { apiGet, apiPost } from "@/lib/api";
import { useUserProgress } from "@/lib/userProgressStore";

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (credential: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({
  children
}: {
  children: React.ReactNode;
}): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const u = await apiGet<User>("/api/auth/me");
        setUser(u);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void checkSession();
  }, []);

  const login = useCallback(async (credential: string) => {
    const u = await apiPost<User>("/api/auth/google", { credential });
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await apiPost("/api/auth/logout");
    useUserProgress.getState().reset();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
