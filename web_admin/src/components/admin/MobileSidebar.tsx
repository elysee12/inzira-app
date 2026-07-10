import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, BookOpen, Layers,
  HeartHandshake, Users, MessageSquare,
  Building2, UserCheck, BarChart3,
  LogOut, Sparkles, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const adminNavItems = [
  { to: "/dashboard",  label: "Dashboard",            icon: LayoutDashboard },
  { to: "/facilities", label: "Facilities",           icon: Building2       },
  { to: "/nurses",     label: "Nurses & Nutritionists", icon: UserCheck    },
  { to: "/users",      label: "All Users",            icon: Users           },
  { to: "/reports",    label: "Reports",              icon: BarChart3       },
] as const;

const nurseNavItems = [
  { to: "/dashboard",  label: "Dashboard",            icon: LayoutDashboard },
  { to: "/lessons",    label: "Lessons",              icon: BookOpen        },
  { to: "/categories", label: "Age Categories",       icon: Layers          },
  { to: "/chws",       label: "Community Health Workers", icon: HeartHandshake },
  { to: "/parents",    label: "Parents",              icon: Users           },
  { to: "/messages",   label: "Messages",             icon: MessageSquare   },
] as const;

export function MobileSidebar({ onClose }: { onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  // Select nav items based on role
  const navItems = user?.role === "ADMIN" ? adminNavItems : nurseNavItems;
  const portalTitle = user?.role === "ADMIN" ? "Imirire Admin" : "Imirire Portal";
  const portalSubtitle = user?.role === "ADMIN" ? "System Administrator" : "Nurse & Nutritionist";

  return (
    <aside className="h-full flex flex-col bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="px-5 py-4 border-b border-sidebar-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-white/15 grid place-items-center">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <div className="font-display font-bold text-base leading-none tracking-tight">
              {portalTitle}
            </div>
            <div className="text-[10px] text-sidebar-foreground/60 mt-0.5 tracking-wide">
              {portalSubtitle}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-sidebar-accent">
          <X className="size-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || (item.to !== "/dashboard" && pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white text-sidebar shadow-sm"
                  : "text-sidebar-foreground/75 hover:bg-sidebar-accent"
              }`}
            >
              <Icon className={`size-4 shrink-0 ${active ? "text-primary" : "text-sidebar-foreground/50"}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-full bg-white/20 grid place-items-center text-sm font-bold">
            {user?.name?.charAt(0)?.toUpperCase() ?? "A"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{user?.name ?? "Admin"}</div>
            <div className="text-[11px] text-sidebar-foreground/55 truncate">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent opacity-60 hover:opacity-100 transition"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
