import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminOnlySidebar } from "@/components/admin/AdminOnlySidebar";
import { NurseSidebar } from "@/components/admin/NurseSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";
import { MobileSidebar } from "@/components/admin/MobileSidebar";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_admin")({
  beforeLoad: () => {
    if (!window.localStorage.getItem("admin_token")) {
      throw redirect({ to: "/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();

  // Select sidebar based on role
  const Sidebar = user?.role === "ADMIN" ? AdminOnlySidebar : NurseSidebar;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - Role-based */}
      <Sidebar />

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 z-50">
            <MobileSidebar onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar row */}
        <div className="md:hidden flex items-center gap-3 h-14 px-4 border-b bg-card">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="size-5" />
          </button>
          <span className="font-display font-semibold text-base">
            {user?.role === "ADMIN" ? "Imirire Admin" : "Imirire Portal"}
          </span>
        </div>

        <AdminTopbar />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
