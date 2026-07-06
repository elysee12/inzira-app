import { useRouterState } from "@tanstack/react-router";
import { Bell, Search, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../lib/auth-context";
import { ProfileModal } from "./ProfileModal";

const titles: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":  { title: "Dashboard",               subtitle: "Platform overview and quick stats"         },
  "/lessons":    { title: "Lessons",                  subtitle: "Manage nutrition content for parents"      },
  "/categories": { title: "Age Categories",           subtitle: "Organise lessons by child age group"       },
  "/chws":       { title: "Community Health Workers", subtitle: "Manage CHW accounts and locations"         },
  "/parents":    { title: "Parents",                  subtitle: "Registered parents and caregivers"         },
  "/messages":   { title: "Messages",                 subtitle: "Monitor CHW–Parent conversations"          },
};

export function AdminTopbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const meta =
    titles[pathname] ??
    Object.entries(titles).find(([p]) => pathname.startsWith(p))?.[1] ??
    { title: "Admin", subtitle: "" };
  const { user, logout } = useAuth();

  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
  }, []);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="h-16 border-b bg-card/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-tight">{meta.title}</h1>
          {meta.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5">{meta.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-xl bg-muted/60 border w-64 focus-within:ring-2 focus-within:ring-ring transition-shadow">
            <Search className="size-3.5 text-muted-foreground shrink-0" />
            <input
              placeholder="Quick search…"
              className="bg-transparent text-sm flex-1 outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              ⌘K
            </kbd>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </button>

          {/* Notifications */}
          <button
            className="relative p-2 rounded-xl hover:bg-muted transition-colors"
            title="Notifications"
          >
            <Bell className="size-4.5 text-muted-foreground" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
          </button>

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted transition-colors"
            >
              <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                {user?.name?.charAt(0).toUpperCase() || "A"}
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-xl border shadow-xl z-50 animate-in fade-in zoom-in-95">
                <div className="p-4 border-b">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Opening profile modal");
                      setProfileOpen(true);
                      setDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <Settings className="size-4" />
                    Edit Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-lg hover:bg-muted transition-colors"
                  >
                    <LogOut className="size-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
