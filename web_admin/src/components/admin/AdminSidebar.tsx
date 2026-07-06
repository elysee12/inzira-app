import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  BookOpen,
  Layers,
  HeartHandshake,
  Users,
  MessageSquare,
  LogOut,
  Sparkles,
  ChevronRight,
  Settings,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useState } from "react";
import { ProfileModal } from "./ProfileModal";

const nav = [
  {
    section: "Platform",
    items: [
      { to: "/dashboard", label: "Dashboard",         icon: LayoutDashboard },
      { to: "/lessons",   label: "Lessons",            icon: BookOpen        },
      { to: "/categories",label: "Age Categories",     icon: Layers          },
    ],
  },
  {
    section: "People",
    items: [
      { to: "/chws",    label: "Health Workers", icon: HeartHandshake },
      { to: "/parents", label: "Parents",         icon: Users          },
      { to: "/messages",label: "Messages",        icon: MessageSquare  },
    ],
  },
] as const;

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isActive = (to: string) =>
    pathname === to || (to !== "/dashboard" && pathname.startsWith(to));

  return (
    <>
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-white/15 backdrop-blur grid place-items-center shadow-inner">
              <Sparkles className="size-4.5" />
            </div>
            <div>
              <div className="font-display font-bold text-base leading-none tracking-tight">
                Imirire
              </div>
              <div className="text-[11px] text-sidebar-foreground/60 mt-0.5 tracking-wide">
                Admin Console
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {nav.map((group) => (
            <div key={group.section}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                        active
                          ? "bg-white text-sidebar shadow-sm"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      <Icon
                        className={`size-4 shrink-0 transition-colors ${
                          active ? "text-primary" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground"
                        }`}
                      />
                      <span className="flex-1">{item.label}</span>
                      {active && (
                        <ChevronRight className="size-3 text-primary/50" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-sidebar-accent/50 transition-colors group">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 flex-1"
            >
              <div className="size-8 rounded-full bg-white/20 grid place-items-center text-sm font-bold shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold truncate leading-tight">
                  {user?.name ?? "Admin"}
                </div>
                <div className="text-[11px] text-sidebar-foreground/55 truncate mt-0.5">
                  {user?.email ?? "Administrator"}
                </div>
              </div>
            </button>
            <button
              onClick={() => setProfileOpen(true)}
              title="Edit Profile"
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors opacity-60 hover:opacity-100"
            >
              <Settings className="size-3.5" />
            </button>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors opacity-60 hover:opacity-100"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
        </div>
      </aside>
      <ProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  );
}
