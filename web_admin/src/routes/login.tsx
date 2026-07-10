import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (window.localStorage.getItem("admin_token")) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back!");
      navigate({ to: "/dashboard", search: {} });
    } catch (err: any) {
      const msg = err?.message ?? "Login failed. Check your credentials.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: branding panel ──────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-11 rounded-2xl bg-white/20 backdrop-blur grid place-items-center shadow-lg">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">Imirire Web</div>
            <div className="text-xs text-white/60 mt-0.5">Management Portal</div>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="relative z-10 max-w-sm space-y-6">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Imirire Web Management Portal
          </h2>
          <p className="text-white/75 leading-relaxed text-sm">
            Manage facilities, nurses & nutritionists, CHWs, nutrition lessons, and system oversight
            from one beautifully simple console.
          </p>
          <div className="space-y-3">
            {[
              "Manage hospitals & facilities nationwide",
              "Oversee nurses, nutritionists & CHWs",
              "System-wide reports and user management",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                <div className="size-5 rounded-full bg-white/20 grid place-items-center shrink-0">
                  <svg viewBox="0 0 10 10" className="size-2.5 fill-white">
                    <path d="M8.5 2.5 4 7.5 1.5 5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-white/50">
          © {new Date().getFullYear()} Imirire — Child Nutrition Platform
        </div>

        {/* Decorative blobs */}
        <div className="absolute -top-32 -right-24 size-[500px] rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 size-[450px] rounded-full bg-white/8 blur-3xl pointer-events-none" />
      </div>

      {/* ── Right: login form ─────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <span className="font-display font-bold text-xl">Imirire Web</span>
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold tracking-tight">Sign in</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your credentials to continue.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* Email */}
            <label className="block">
              <span className="text-sm font-medium">Email address</span>
              <div className="mt-1.5 flex items-center gap-2.5 px-3.5 rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring transition-shadow">
                <Mail className="size-4 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@imirire.rw"
                  className="w-full bg-transparent outline-none text-sm py-2.5"
                />
              </div>
            </label>

            {/* Password */}
            <label className="block">
              <span className="text-sm font-medium">Password</span>
              <div className="mt-1.5 flex items-center gap-2.5 px-3.5 rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring transition-shadow">
                <Lock className="size-4 text-muted-foreground shrink-0" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-sm py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-primary hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {loading && <Loader2 className="size-4 animate-spin" />}
              Sign in to dashboard
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center leading-relaxed">
            This portal is for administrators and nurses/nutritionists.
            <br />
            Backend must be running on{" "}
            <code className="font-mono bg-muted px-1 py-0.5 rounded text-foreground">
              localhost:3000
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
