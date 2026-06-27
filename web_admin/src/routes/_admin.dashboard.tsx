import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, Music, Video, Layers, Plus, ArrowRight,
  Users, HeartHandshake, MessageSquare, TrendingUp,
  BookOpen, AlertCircle,
} from "lucide-react";
import { statsApi, contentApi, categoryApi, fileUrl } from "@/lib/api";
import { Card, CardHeader, StatCard, Button, Badge } from "@/components/admin/ui";

export const Route = createFileRoute("/_admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const stats = useQuery({ queryKey: ["stats"], queryFn: statsApi.overview });
  const contents = useQuery({ queryKey: ["contents"], queryFn: contentApi.list });
  const categories = useQuery({ queryKey: ["categories"], queryFn: categoryApi.list });

  const recentContent = (contents.data ?? []).slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-white/75 text-sm font-medium tracking-wide uppercase">
              Platform Overview
            </p>
            <h2 className="font-display text-2xl lg:text-3xl font-bold mt-1">
              Imirire Nutrition Platform
            </h2>
            <p className="text-white/80 mt-2 max-w-xl text-sm leading-relaxed">
              Manage nutrition lessons, age categories, community health workers and
              registered parents — all from one console.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/lessons">
              <Button
                className="h-10 px-5 font-semibold shadow-lg"
                style={{ background: "white", color: "var(--primary)" }}
              >
                <Plus className="size-4" /> New Lesson
              </Button>
            </Link>
            <Link to="/chws">
              <Button
                className="h-10 px-5 font-semibold border border-white/30 text-white"
                variant="ghost"
                style={{ background: "rgba(255,255,255,0.15)" }}
              >
                <HeartHandshake className="size-4" /> Add CHW
              </Button>
            </Link>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-12 size-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-20 -left-8 size-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </div>

      {/* Content stats */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Content
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Documents"
            value={stats.isPending ? "…" : (stats.data?.documents ?? 0)}
            icon={<FileText className="size-5" />}
            tone="primary"
          />
          <StatCard
            label="Audio"
            value={stats.isPending ? "…" : (stats.data?.audio ?? 0)}
            icon={<Music className="size-5" />}
            tone="success"
          />
          <StatCard
            label="Video"
            value={stats.isPending ? "…" : (stats.data?.video ?? 0)}
            icon={<Video className="size-5" />}
            tone="warning"
          />
          <StatCard
            label="Total Lessons"
            value={stats.isPending ? "…" : (stats.data?.total ?? 0)}
            icon={<BookOpen className="size-5" />}
            tone="violet"
          />
        </div>
      </div>

      {/* User stats */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Users
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Parents"
            value={stats.isPending ? "…" : (stats.data?.parents ?? 0)}
            icon={<Users className="size-5" />}
            tone="primary"
          />
          <StatCard
            label="Health Workers"
            value={stats.isPending ? "…" : (stats.data?.chws ?? 0)}
            icon={<HeartHandshake className="size-5" />}
            tone="success"
          />
          <StatCard
            label="Age Categories"
            value={stats.isPending ? "…" : (stats.data?.categories ?? 0)}
            icon={<Layers className="size-5" />}
            tone="violet"
          />
        </div>
      </div>

      {/* Error states */}
      {(stats.isError || contents.isError || categories.isError) && (
        <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>
            Could not reach the backend. Make sure the server is running on{" "}
            <code className="font-mono text-xs">localhost:3000</code>.
          </span>
        </div>
      )}

      {/* Two-column lower section */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Age Categories */}
        <Card className="lg:col-span-1">
          <CardHeader
            title="Age Categories"
            subtitle="Lesson counts per age group"
            action={
              <Link
                to="/categories"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                Manage <ArrowRight className="size-3" />
              </Link>
            }
          />
          <div className="p-3 space-y-1">
            {categories.isPending &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />
              ))}
            {categories.data?.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="size-11 rounded-xl grid place-items-center font-display font-bold text-sm shrink-0"
                    style={{ background: c.bgColor, color: c.color }}
                  >
                    {c.label.split(" ")[0]}
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-tight">
                      {c.label} {c.sublabel}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {c.contentCount ?? 0} lessons
                    </div>
                  </div>
                </div>
                <div
                  className="size-2.5 rounded-full"
                  style={{ background: c.color }}
                />
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Lessons */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Lessons"
            subtitle="Latest content added to the platform"
            action={
              <Link
                to="/lessons"
                className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            }
          />
          <div className="divide-y">
            {contents.isPending &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="size-10 rounded-lg bg-muted animate-pulse shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 bg-muted animate-pulse rounded w-2/3" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
                  </div>
                </div>
              ))}
            {recentContent.map((item) => {
              const Icon =
                item.type === "text" ? FileText : item.type === "audio" ? Music : Video;
              const tone =
                item.type === "text" ? "primary" : item.type === "audio" ? "success" : "warning";
              const toneBg: Record<string, string> = {
                primary: "bg-primary/10 text-primary",
                success: "bg-success/15 text-success",
                warning: "bg-warning/20 text-warning-foreground",
              };
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors"
                >
                  <div
                    className={`size-10 rounded-xl grid place-items-center shrink-0 ${toneBg[tone]}`}
                  >
                    <Icon className="size-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.ageGroup} months
                      {item.postedBy && ` · ${item.postedBy.name}`}
                      {item.postedByName && !item.postedBy && ` · ${item.postedByName}`}
                    </div>
                  </div>
                  {item.isNew && <Badge tone="success">New</Badge>}
                </div>
              );
            })}
            {!contents.isPending && recentContent.length === 0 && (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No lessons yet. <Link to="/lessons" className="text-primary hover:underline">Add one →</Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Quick action cards */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          Quick Actions
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              to: "/lessons",
              icon: <BookOpen className="size-6" />,
              title: "Manage Lessons",
              desc: "Add, edit or remove nutrition content",
              tone: "bg-primary/10 text-primary",
            },
            {
              to: "/categories",
              icon: <Layers className="size-6" />,
              title: "Age Categories",
              desc: "Customize age group labels and colors",
              tone: "bg-[oklch(0.94_0.05_300)] text-[oklch(0.45_0.18_300)]",
            },
            {
              to: "/chws",
              icon: <HeartHandshake className="size-6" />,
              title: "Health Workers",
              desc: "Create and manage CHW accounts",
              tone: "bg-success/15 text-success",
            },
            {
              to: "/parents",
              icon: <Users className="size-6" />,
              title: "Parents",
              desc: "View and manage parent accounts",
              tone: "bg-warning/20 text-warning-foreground",
            },
          ].map((item) => (
            <Link key={item.to} to={item.to as any}>
              <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer group">
                <div
                  className={`size-12 rounded-xl grid place-items-center mb-3 ${item.tone}`}
                >
                  {item.icon}
                </div>
                <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                  {item.title}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
