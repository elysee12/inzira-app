import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Sparkles, ArrowLeft, Loader2, AlertCircle, ShieldCheck, RotateCw } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export const Route = createFileRoute("/verify-otp")({
  component: VerifyOtpPage,
  validateSearch: (search: Record<string, unknown>): { email?: string } => {
    return {
      email: typeof search.email === "string" ? search.email : undefined,
    };
  },
});

const API_URL = "http://localhost:3000/api";

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { email } = useSearch({ from: "/verify-otp" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      navigate({ to: "/forgot-password" });
    }
  }, [email, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, { email, otp: otpCode });
      toast.success("OTP verified successfully!");
      navigate({ to: "/reset-password", search: { email, otp: otpCode } });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Invalid or expired OTP code.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setResending(true);
    setError(null);
    try {
      await axios.post(`${API_URL}/auth/send-otp`, { email });
      toast.success("New OTP code sent to your email!");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? "Failed to resend OTP.";
      setError(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

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
            Verify Your Identity
          </h2>
          <p className="text-white/75 leading-relaxed text-sm">
            We've sent a 6-digit verification code to <strong>{email}</strong>. Please check your
            inbox and enter the code below.
          </p>
          <div className="space-y-3">
            {[
              "Code expires in 10 minutes",
              "Check spam folder if not received",
              "Request new code if expired",
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
            to="/forgot-password"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="size-4" />
            Back to forgot password
          </Link>

          <div className="mb-8 text-center">
            <div className="size-16 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-4">
              <ShieldCheck className="size-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Verify OTP Code</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Enter the 6-digit code sent to{" "}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-6">
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="size-12 sm:size-14 text-center text-2xl font-bold rounded-xl border-2 bg-card focus:border-primary focus:ring-2 focus:ring-ring outline-none transition-all"
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join("").length !== 6}
              className="w-full h-11 rounded-xl text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-opacity hover:opacity-95 disabled:opacity-60"
              style={{
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-elevated)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" />
                  Verify code
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Didn't receive the code?</p>
            <button
              onClick={resendOtp}
              disabled={resending}
              className="text-sm font-medium text-primary hover:underline disabled:opacity-60 inline-flex items-center gap-2"
            >
              {resending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RotateCw className="size-3.5" />
                  Resend OTP code
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
