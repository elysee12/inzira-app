import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border bg-card ${className}`}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between p-5 border-b">
      <div>
        <h3 className="font-display font-semibold text-base text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  tone?: "primary" | "success" | "warning" | "violet";
}) {
  const toneBg: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    warning: "bg-warning/20 text-warning-foreground",
    violet: "bg-[oklch(0.94_0.05_300)] text-[oklch(0.45_0.18_300)]",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={`size-12 rounded-xl grid place-items-center ${toneBg[tone]}`}>{icon}</div>
        <div>
          <div className="text-2xl font-bold font-display text-foreground">{value}</div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground mt-0.5">{label}</div>
        </div>
      </div>
    </Card>
  );
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
}) {
  const styles: Record<string, string> = {
    primary:
      "text-primary-foreground hover:opacity-95 shadow-sm",
    ghost: "hover:bg-muted text-foreground",
    outline: "border bg-card hover:bg-muted text-foreground",
    danger: "bg-destructive text-destructive-foreground hover:opacity-95",
  };
  const style =
    variant === "primary" ? { background: "var(--gradient-primary)" } : undefined;
  return (
    <button
      {...rest}
      style={style}
      className={`inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "primary" | "warning" | "danger";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success/15 text-success",
    primary: "bg-primary/10 text-primary",
    warning: "bg-warning/20 text-foreground",
    danger: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="p-10 text-center">
      <h4 className="font-display font-semibold text-foreground">{title}</h4>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
