import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Music, Video, Layers, Plus, ArrowRight,
  Users, HeartHandshake, BookOpen, AlertCircle, Activity, BarChart3,
  Building2, MapPin,
} from "lucide-react";
import { statsApi, contentApi, categoryApi, facilityApi } from "@/lib/api";
import { Card, CardHeader, StatCard, Button, Badge } from "@/components/admin/ui";
import { useAuth } from "@/lib/auth-context";

export function NurseDashboard() {
  const { user } = useAuth();

  const stats    = useQuery({
    queryKey: ["stats", user?.facilityId],
    queryFn:  () => statsApi.overview(user?.facilityId),
  });
  const contents = useQuery({
    queryKey: ["contents", user?.facilityId],
    queryFn:  () => contentApi.list(user?.facilityId),
  });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryApi.list });

  // Fetch the nurse's assigned facility details when facilityId is present
  const facility = useQuery({
    queryKey: ["facility", user?.facilityId],
    queryFn: () => facilityApi.get(user!.facilityId!),
    enabled: !!user?.facilityId,
  });

  const recentContent = (contents.data ?? []).slice(0, 6);

  // Build a human-readable location string from the facility
  const facilityLocation = facility.data
    ? [facility.data.sector, facility.data.district, facility.data.province]
        .filter(Boolean)
        .join(", ")
    : null;

  const facilityDisplayName =
    user?.facilityName ??
    facility.data?.name ??
    "Your Facility";

  return (
    <div className="space-y-8">

      {/* ── Hero banner ────────────────────────────────────────────────── */}
      <div
        className="rounded-3xl p-8 lg:p-10 text-white relative overflow-hidden shadow-2xl"
        style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
      >
        {/* Facility badge — top-left */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm mb-5 text-xs font-semibold tracking-wide uppercase">
          <Activity className="size-3.5" />
          Nurse Dashboard
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight">
              Content & Operations
            </h1>
            <p className="text-white/85 mt-3 max-w-2xl text-base leading-relaxed">
              Manage nutrition lessons, register CHWs, and oversee parent engagement in your facility.
            </p>

            {/* ── Facility info strip ── */}
            <div className="mt-5 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
                <Building2 className="size-4 shrink-0" />
                <div>
                  <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none mb-0.5">
                    Facility
                  </p>
                  <p className="text-sm font-semibold leading-tight">
                    {facility.isLoading
                      ? "Loading…"
                      : facilityDisplayName}
                  </p>
                </div>
              </div>

              {facilityLocation && (
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
                  <MapPin className="size-4 shrink-0" />
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none mb-0.5">
                      Location
                    </p>
                    <p className="text-sm font-semibold leading-tight">{facilityLocation}</p>
                  </div>
                </div>
              )}

              {facility.data?.type && (
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
                  <div>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest leading-none mb-0.5">
                      Type
                    </p>
                    <p className="text-sm font-semibold leading-tight">{facility.data.type}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col gap-3 shrink-0">
            <Link to="/lessons">
              <Button
                className="w-full lg:w-auto h-12 px-6 font-semibold shadow-xl hover:shadow-2xl transition-all"
                style={{ background: "white", color: "#667eea" }}
              >
                <Plus className="size-5" /> New Lesson
              </Button>
            </Link>
            <Link to="/chws">
              <Button
                className="w-full lg:w-auto h-12 px-6 font-semibold border-2 border-white/40 text-white hover:bg-white/20 transition-all"
                variant="ghost"
                style={{ background: "rgba(255,255,255,0.1)" }}
              >
                <HeartHandshake className="size-5" /> Register CHW
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative blobs */}
        <div className="absolute -bottom-32 -right-20 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -top-32 -left-20 size-96 rounded-full bg-white/10 blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      {/* ── Content stats ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">Content Overview</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Track your educational content across all formats</p>
          </div>
          <Link to="/lessons">
            <Button variant="outline" className="gap-2">
              <BarChart3 className="size-4" />
              View Details
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Documents"    value={stats.isPending ? "…" : (stats.data?.documents ?? 0)} icon={<FileText  className="size-6" />} tone="primary"  />
          <StatCard label="Audio Files"  value={stats.isPending ? "…" : (stats.data?.audio     ?? 0)} icon={<Music     className="size-6" />} tone="success"  />
          <StatCard label="Videos"       value={stats.isPending ? "…" : (stats.data?.video     ?? 0)} icon={<Video     className="size-6" />} tone="warning"  />
          <StatCard label="Total Lessons" value={stats.isPending ? "…" : (stats.data?.total    ?? 0)} icon={<BookOpen  className="size-6" />} tone="violet"   />
        </div>
      </div>

      {/* ── Facility users ─────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-foreground">
              {facilityDisplayName} — Users
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              CHWs and parents registered in your facility
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard label="Registered Parents"       value={stats.isPending ? "…" : (stats.data?.parents    ?? 0)} icon={<Users          className="size-6" />} tone="primary" />
          <StatCard label="Community Health Workers" value={stats.isPending ? "…" : (stats.data?.chws       ?? 0)} icon={<HeartHandshake  className="size-6" />} tone="success" />
          <StatCard label="Age Categories"           value={stats.isPending ? "…" : (stats.data?.categories ?? 0)} icon={<Layers          className="size-6" />} tone="violet"  />
        </div>
      </div>

      {/* ── Error state ────────────────────────────────────────────────── */}
      {(stats.isError || contents.isError || categories.isError) && (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive shadow-lg">
          <AlertCircle className="size-5 shrink-0" />
          <div>
            <p className="font-semibold">Connection Error</p>
            <p className="text-xs mt-1 opacity-90">
              Could not reach the backend server. Ensure it's running on{" "}
              <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-destructive/10">localhost:3000</code>
            </p>
          </div>
        </div>
      )}

      {/* ── Two-column: categories + recent lessons ────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Age Categories */}
        <Card className="lg:col-span-1 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader
            title="Age Categories"
            subtitle="Lesson distribution by age group"
            action={
              <Link to="/categories" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1.5">
                Manage <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="p-4 space-y-2">
            {categories.isPending && Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
            {categories.data?.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 rounded-xl hover:bg-muted/60 transition-all cursor-pointer border border-transparent hover:border-border"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-12 rounded-xl grid place-items-center font-display font-bold text-sm shrink-0 shadow-md"
                    style={{ background: c.bgColor, color: c.color }}
                  >
                    {c.label.split(" ")[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">{c.label} {c.sublabel}</div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <BookOpen className="size-3" />
                      {c.contentCount ?? 0} lessons
                    </div>
                  </div>
                </div>
                <div className="size-3 rounded-full shadow-sm" style={{ background: c.color }} />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Lessons */}
        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader
            title="Recent Lessons"
            subtitle="Latest educational content added"
            action={
              <Link to="/lessons" className="text-xs text-primary font-semibold hover:underline inline-flex items-center gap-1.5">
                View All <ArrowRight className="size-3.5" />
              </Link>
            }
          />
          <div className="divide-y">
            {contents.isPending && Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="size-12 rounded-xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                  <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                </div>
              </div>
            ))}
            {recentContent.map((item) => {
              const Icon = item.type === "text" ? FileText : item.type === "audio" ? Music : Video;
              const tone = item.type === "text" ? "primary" : item.type === "audio" ? "success" : "warning";
              const toneBg: Record<string, string> = {
                primary: "bg-primary/10 text-primary border-primary/20",
                success: "bg-success/15 text-success border-success/20",
                warning: "bg-warning/20 text-warning-foreground border-warning/20",
              };
              return (
                <div key={item.id} className="flex items-center gap-4 p-5 hover:bg-muted/50 transition-all cursor-pointer">
                  <div className={`size-12 rounded-xl grid place-items-center shrink-0 border ${toneBg[tone]}`}>
                    <Icon className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="size-3" />{item.ageGroup} months
                      </span>
                      {item.postedBy && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="size-3" />{item.postedBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.isNew && <Badge tone="success">New</Badge>}
                </div>
              );
            })}
            {!contents.isPending && recentContent.length === 0 && (
              <div className="p-12 text-center">
                <BookOpen className="size-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">No lessons yet</p>
                <Link to="/lessons" className="text-primary hover:underline text-sm font-medium mt-2 inline-block">
                  Create your first lesson →
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Quick actions ──────────────────────────────────────────────── */}
      <div>
        <div className="mb-4">
          <h2 className="text-lg font-display font-bold text-foreground">Quick Actions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Common operational tasks</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { to: "/lessons",    icon: <BookOpen       className="size-7" />, title: "Manage Lessons",    desc: "Add, edit or remove nutrition content",          tone: "bg-primary/10 text-primary border-primary/20" },
            { to: "/categories", icon: <Layers         className="size-7" />, title: "Age Categories",   desc: "Customize age group labels",                     tone: "bg-[oklch(0.94_0.05_300)] text-[oklch(0.45_0.18_300)] border-[oklch(0.45_0.18_300)]/20" },
            { to: "/chws",       icon: <HeartHandshake className="size-7" />, title: "Register CHWs",    desc: "Create CHW accounts for your facility",           tone: "bg-success/15 text-success border-success/20" },
            { to: "/parents",    icon: <Users          className="size-7" />, title: "View Parents",     desc: "Monitor parent registrations",                    tone: "bg-warning/20 text-warning-foreground border-warning/20" },
          ].map((item) => (
            <Link key={item.to} to={item.to as any}>
              <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group border-2 hover:border-primary/30">
                <div className={`size-14 rounded-xl grid place-items-center mb-4 border ${item.tone} group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="font-display font-bold text-base group-hover:text-primary transition-colors">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{item.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
