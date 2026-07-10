import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Mail, ArrowLeft, Loader2, AlertCircle, Send } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

const API_URL = "http://localhost:3000/api";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email: email.trim() });
      toast.success("OTP code sent to your email!");
      navigate({ to: "/verify-otp", search: { email: email.trim() } });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to send OTP. Please try again.";
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
            Password Recovery
          </h2>
          <p className="text-white/75 leading-relaxed text-sm">
            Enter your registered email address and we'll send you a verification code to reset
            your password securely.
          </p>
          <div className="space-y-3">
            {[
              "Secure OTP verification via email",
              "10-minute code expiry for security",
              "Quick and easy password reset",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 text-sm text-white/80">
                <div className="size-5 rounded-full bg-white/20 grid place-items-center shrink-0">
                  <svg viewBox="0 0 10 10" className="size-2.5 fill-white">
                    <path
                      d="M8.5 2.5 4 7.5 1.5 5"
                      stroke="white"
                      strokeWidth="1.5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
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

      {/* ── Right: form ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <span className="font-display font-bold text-xl">Imirire Web</span>
          </div>

          {/* Back button */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
              <Mail className="size-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Forgot Password</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter your email address and we'll send you a verification code.
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

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending OTP code...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send verification code
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs text-muted-foreground text-center">
            Remember your password?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
