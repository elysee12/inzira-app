import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users, Building2, HeartHandshake, UserCheck,
  TrendingUp, Activity, BarChart3, ArrowRight,
} from "lucide-react";
import { Card, CardHeader, StatCard, Button } from "@/components/admin/ui";
import { apiFetch } from "@/lib/api";

// Admin-specific API calls — use apiFetch so the auth header is included
const adminStatsApi = {
  users:      () => apiFetch<{ total: number; byRole: Record<string, number>; byDate?: number }>("/users/stats"),
  facilities: () => apiFetch<{ total: number; active: number; inactive: number; byType: Record<string, number> }>("/facilities/stats"),
  nurses:     () => apiFetch<{ total: number; byFacility: any[] }>("/nurses/stats"),
};

export function AdminDashboard() {
  const userStats     = useQuery({ queryKey: ["admin-user-stats"],     queryFn: adminStatsApi.users      });
  const facilityStats = useQuery({ queryKey: ["admin-facility-stats"], queryFn: adminStatsApi.facilities });
  const nurseStats    = useQuery({ queryKey: ["admin-nurse-stats"],    queryFn: adminStatsApi.nurses     });

  return (
    <div className="space-y-8">
      {/* Admin Hero Banner */}
      <div
        className="rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl"
        style={{ 
          background: "linear-gradient(135deg, #2980B9 0%, #3498DB 100%)",
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <Activity className="size-4" />
              <span className="text-xs font-semibold tracking-wide uppercase">System Administrator</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mt-2 tracking-tight">
              System Overview
            </h1>
            <p className="text-white/90 mt-3 max-w-2xl text-base leading-relaxed">
              Manage facilities, nurses, nutritionists, and monitor system-wide platform metrics.
            </p>
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            <Link to="/facilities">
              <Button
                className="w-full lg:w-auto h-12 px-6 font-semibold shadow-xl hover:shadow-2xl transition-all"
                style={{ background: "white", color: "#2980B9" }}
              >
                <Building2 className="size-5" /> Manage Facilities
              </Button>
            </Link>
            <Link to="/nurses">
              <Button
                className="w-full lg:w-auto h-12 px-6 font-semibold border-2 border-white/40 text-white hover:bg-white/20 transition-all"
                variant="ghost"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <UserCheck className="size-5" /> Manage Nurses
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -top-32 -left-20 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* System-Wide User Statistics */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Platform Users</h2>
            <p className="text-sm text-muted-foreground mt-0.5">All registered users across the system</p>
          </div>
          <Link to="/users">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="size-4" />
              View All Users
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Users"
            value={userStats.isPending ? "…" : (userStats.data?.total ?? 0)}
            icon={<Users className="size-6" />}
            tone="primary"
          />
          <StatCard
            label="Parents"
            value={userStats.isPending ? "…" : (userStats.data?.byRole?.PARENT ?? 0)}
            icon={<Users className="size-6" />}
            tone="success"
          />
          <StatCard
            label="CHWs"
            value={userStats.isPending ? "…" : (userStats.data?.byRole?.CHW ?? 0)}
            icon={<HeartHandshake className="size-6" />}
            tone="warning"
          />
          <StatCard
            label="Nurses"
            value={userStats.isPending ? "…" : (userStats.data?.byRole?.NURSE ?? 0)}
            icon={<UserCheck className="size-6" />}
            tone="violet"
          />
        </div>
      </div>

      {/* Facilities & Infrastructure */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Facilities & Infrastructure</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Health facilities and service points</p>
          </div>
          <Link to="/facilities">
            <Button variant="outline" className="gap-2">
              <TrendingUp className="size-4" />
              Manage Facilities
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            label="Total Facilities"
            value={facilityStats.isPending ? "…" : (facilityStats.data?.total ?? 0)}
            icon={<Building2 className="size-6" />}
            tone="primary"
          />
          <StatCard
            label="Active Facilities"
            value={facilityStats.isPending ? "…" : (facilityStats.data?.active ?? 0)}
            icon={<Building2 className="size-6" />}
            tone="success"
          />
          <StatCard
            label="Assigned Nurses"
            value={nurseStats.isPending ? "…" : (nurseStats.data?.total ?? 0)}
            icon={<UserCheck className="size-6" />}
            tone="violet"
          />
        </div>
      </div>

      {/* Admin Quick Actions */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-display font-bold text-foreground">Admin Actions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">System management tools</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              to: "/facilities",
              icon: <Building2 className="size-7" />,
              title: "Facilities",
              desc: "Manage hospitals and health centers",
              tone: "bg-primary/10 text-primary border-primary/20",
            },
            {
              to: "/nurses",
              icon: <UserCheck className="size-7" />,
              title: "Nurses & Nutritionists",
              desc: "Create and manage nurse accounts",
              tone: "bg-[oklch(0.94_0.05_300)] text-[oklch(0.45_0.18_300)] border-[oklch(0.45_0.18_300)]/20",
            },
            {
              to: "/chws",
              icon: <HeartHandshake className="size-7" />,
              title: "CHWs",
              desc: "View all community health workers",
              tone: "bg-success/15 text-success border-success/20",
            },
            {
              to: "/parents",
              icon: <Users className="size-7" />,
              title: "Parents",
              desc: "View all registered parents",
              tone: "bg-warning/20 text-warning-foreground border-warning/20",
            },
          ].map((item) => (
            <Link key={item.to} to={item.to as any}>
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/30">
                <div
                  className={`size-14 rounded-xl grid place-items-center mb-4 border ${item.tone} group-hover:scale-110 transition-transform`}
                >
                  {item.icon}
                </div>
                <div className="font-display font-bold text-base group-hover:text-primary transition-colors">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* System Reports Section */}
      <Card className="shadow-lg">
        <CardHeader
          title="System Reports"
          subtitle="Platform-wide analytics and insights"
          action={
            <Link
              to="/reports"
              className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1.5 transition-colors"
            >
              View Reports <ArrowRight className="size-3.5" />
            </Link>
          }
        />
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border bg-muted/50">
              <div className="text-sm font-semibold text-muted-foreground mb-1">User Growth</div>
              <div className="text-2xl font-bold text-foreground">
                {userStats.data?.byDate ?? 0} <span className="text-sm font-normal text-success">this month</span>
              </div>
            </div>
            <div className="p-4 rounded-xl border bg-muted/50">
              <div className="text-sm font-semibold text-muted-foreground mb-1">Active Facilities</div>
              <div className="text-2xl font-bold text-foreground">
                {facilityStats.data?.active ?? 0} <span className="text-sm font-normal text-muted-foreground">operational</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
