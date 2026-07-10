import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Sparkles, Lock, ArrowLeft, Loader2, AlertCircle, Eye, EyeOff, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>): { email?: string; otp?: string } => {
    return {
      email: typeof search.email === "string" ? search.email : undefined,
      otp: typeof search.otp === "string" ? search.otp : undefined,
    };
  },
});

const API_URL = "http://localhost:3000/api";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const { email, otp } = useSearch({ from: "/reset-password" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email || !otp) {
      navigate({ to: "/forgot-password" });
    }
  }, [email, otp, navigate]);

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "Password must be at least 8 characters long.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one uppercase letter.";
    }
    if (!/[a-z]/.test(pwd)) {
      return "Password must contain at least one lowercase letter.";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    if (!/[@$!%*?&#]/.test(pwd)) {
      return "Password must contain at least one special character (@$!%*?&#).";
    }
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validatePassword(password);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/reset-password`, {
        email,
        otp,
        newPassword: password,
      });
      toast.success("Password reset successful! You can now sign in.");
      navigate({ to: "/login" });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to reset password. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 
    ? null 
    : validatePassword(password) === null 
    ? "strong" 
    : password.length >= 8 
    ? "medium" 
    : "weak";

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── Left: branding panel ──────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 text-white relative overflow-hidden"
        style={{ background: "var(--gradient-hero)" }}
      >
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-11 rounded-2xl bg-white/20 backdrop-blur grid place-items-center shadow-lg">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="font-display font-bold text-xl leading-none">Imirire Web</div>
            <div className="text-xs text-white/60 mt-0.5">Management Portal</div>
          </div>
        </div>

        <div className="relative z-10 max-w-sm space-y-6">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            Create New Password
          </h2>
          <p className="text-white/75 leading-relaxed text-sm">
            Choose a strong password to secure your account. Make sure it meets all the security
            requirements.
          </p>
          <div className="space-y-3">
            {[
              "At least 8 characters long",
              "Contains uppercase & lowercase letters",
              "Includes numbers and special characters",
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

        <div className="absolute -top-32 -right-24 size-[500px] rounded-full bg-white/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-20 size-[450px] rounded-full bg-white/8 blur-3xl pointer-events-none" />
      </div>

      {/* ── Right: form ───────────────────────────────────────────── */}
      <div className="flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8 flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary grid place-items-center text-primary-foreground">
              <Sparkles className="size-5" />
            </div>
            <span className="font-display font-bold text-xl">Imirire Web</span>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="size-4" />
            Back to login
          </Link>

          <div className="mb-8 text-center">
            <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
              <Lock className="size-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Create a strong password for your account
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {/* New Password */}
            <label className="block">
              <span className="text-sm font-medium">New Password</span>
              <div className="mt-1.5 flex items-center gap-2.5 px-3.5 rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring transition-shadow">
                <Lock className="size-4 text-muted-foreground shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-sm py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {/* Password strength indicator */}
              {passwordStrength && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        passwordStrength === "weak"
                          ? "w-1/3 bg-destructive"
                          : passwordStrength === "medium"
                          ? "w-2/3 bg-warning"
                          : "w-full bg-success"
                      }`}
                    />
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      passwordStrength === "weak"
                        ? "text-destructive"
                        : passwordStrength === "medium"
                        ? "text-warning"
                        : "text-success"
                    }`}
                  >
                    {passwordStrength === "weak"
                      ? "Weak"
                      : passwordStrength === "medium"
                      ? "Medium"
                      : "Strong"}
                  </span>
                </div>
              )}
            </label>

            {/* Confirm Password */}
            <label className="block">
              <span className="text-sm font-medium">Confirm Password</span>
              <div className="mt-1.5 flex items-center gap-2.5 px-3.5 rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring transition-shadow">
                <Lock className="size-4 text-muted-foreground shrink-0" />
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="flex-1 bg-transparent outline-none text-sm py-2.5"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {confirmPassword && password === confirmPassword && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle className="size-3.5" />
                  Passwords match
                </div>
              )}
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
                  Resetting password...
                </>
              ) : (
                <>
                  <CheckCircle className="size-4" />
                  Reset password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
