import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authApi, userApi, type User } from "./api";

interface AuthCtx {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateUser: (userData: Partial<User>) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("admin_user");
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* noop */ }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    window.localStorage.setItem("admin_token", session.access_token);
    window.localStorage.setItem("admin_user", JSON.stringify(session.user));
    setUser(session.user);
  };

  const logout = () => {
    authApi.logout();
    window.localStorage.removeItem("admin_token");
    window.localStorage.removeItem("admin_user");
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = await userApi.update(user.id, userData);
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    window.localStorage.setItem("admin_user", JSON.stringify(newUser));
  };

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user, login, logout, loading, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
