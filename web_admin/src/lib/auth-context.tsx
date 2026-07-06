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

// Generate a unique session ID for this browser tab/window
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Store the current session ID
const SESSION_ID_KEY = "admin_session_id";
const ACTIVE_SESSION_KEY = "admin_active_session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(() => {
    // Check if we have a session ID for this window
    const existingSessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (existingSessionId) {
      return existingSessionId;
    }
    // Generate new session ID and store it
    const newSessionId = generateSessionId();
    sessionStorage.setItem(SESSION_ID_KEY, newSessionId);
    return newSessionId;
  });

  // Check if this session is the active one
  const isActiveSession = () => {
    const activeSession = localStorage.getItem(ACTIVE_SESSION_KEY);
    return activeSession === sessionId;
  };

  // Validate session on mount and when window regains focus
  useEffect(() => {
    const validateSession = () => {
      const token = localStorage.getItem("admin_token");
      const userStr = localStorage.getItem("admin_user");
      const activeSession = localStorage.getItem(ACTIVE_SESSION_KEY);

      // If there's a token but this isn't the active session, clear local state
      if (token && activeSession && activeSession !== sessionId) {
        console.log("[Auth] Session hijack detected - clearing local state");
        setUser(null);
        setLoading(false);
        return;
      }

      // Load user if we have a token and are the active session
      if (token && userStr && (!activeSession || activeSession === sessionId)) {
        try {
          const parsedUser = JSON.parse(userStr);
          setUser(parsedUser);
          // Claim this session as active
          localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
        } catch {
          // Invalid user data
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          localStorage.removeItem(ACTIVE_SESSION_KEY);
        }
      }
      setLoading(false);
    };

    validateSession();

    // Listen for focus events to re-validate session
    const handleFocus = () => {
      validateSession();
    };

    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACTIVE_SESSION_KEY && e.newValue !== sessionId) {
        console.log("[Auth] Another session became active - logging out this session");
        setUser(null);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        // Force redirect by reloading the page
        window.location.href = "/login";
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [sessionId]);

  // Clean up session on unmount (tab/window close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // If this was the active session, clear it
      const activeSession = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeSession === sessionId) {
        localStorage.removeItem(ACTIVE_SESSION_KEY);
      }
      sessionStorage.removeItem(SESSION_ID_KEY);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [sessionId]);

  const login = async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    localStorage.setItem("admin_token", session.access_token);
    localStorage.setItem("admin_user", JSON.stringify(session.user));
    localStorage.setItem(ACTIVE_SESSION_KEY, sessionId);
    setUser(session.user);
  };

  const logout = () => {
    authApi.logout();
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(SESSION_ID_KEY);
    setUser(null);
    // Force redirect by reloading to login page
    window.location.href = "/login";
  };

  const updateUser = async (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = await userApi.update(user.id, userData);
    const newUser = { ...user, ...updatedUser };
    setUser(newUser);
    localStorage.setItem("admin_user", JSON.stringify(newUser));
  };

  return (
    <Ctx.Provider value={{ user, isAuthenticated: !!user && isActiveSession(), login, logout, loading, updateUser }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be used inside <AuthProvider>");
  return v;
}
