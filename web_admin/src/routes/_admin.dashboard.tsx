import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { NurseDashboard } from "@/components/admin/NurseDashboard";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();

  // Role-based dashboard rendering
  if (user?.role === "ADMIN") {
    return <AdminDashboard />;
  }

  if (user?.role === "NURSE") {
    return <NurseDashboard />;
  }

  // Fallback for other roles (shouldn't happen in admin panel)
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <p className="text-muted-foreground">
          Dashboard not available for role: {user?.role}
        </p>
      </div>
    </div>
  );
}
