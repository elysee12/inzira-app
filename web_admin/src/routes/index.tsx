import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const token = window.localStorage.getItem("admin_token");
    throw redirect({ to: token ? "/dashboard" : "/login" });
  },
  component: () => null,
});
