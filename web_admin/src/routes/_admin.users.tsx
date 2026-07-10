import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  Search,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  HeartHandshake,
  UserCheck,
  Baby,
  ChevronDown,
} from "lucide-react";
import { Card, Button, Badge, Input } from "@/components/admin/ui";
import { userApi, type User as UserType, type Role } from "@/lib/api";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_admin/users")({
  component: UsersPage,
});

const ROLE_CONFIG: Record<
  Role,
  { label: string; tone: "primary" | "success" | "warning" | "neutral"; icon: React.ElementType }
> = {
  ADMIN: { label: "Admin", tone: "warning", icon: User },
  NURSE: { label: "Nurse", tone: "primary", icon: UserCheck },
  CHW: { label: "CHW", tone: "success", icon: HeartHandshake },
  PARENT: { label: "Parent", tone: "neutral", icon: Baby },
};

type FilterRole = "ALL" | Role;

function UsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<FilterRole>("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await userApi.listAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: UserType) {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    setDeletingId(user.id);
    try {
      await userApi.remove(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      alert("Failed to delete user");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  }

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q);
    return matchesRole && matchesSearch;
  });

  // Role counts for tab badges
  const counts: Record<FilterRole, number> = {
    ALL: users.length,
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    NURSE: users.filter((u) => u.role === "NURSE").length,
    CHW: users.filter((u) => u.role === "CHW").length,
    PARENT: users.filter((u) => u.role === "PARENT").length,
  };

  const tabs: { key: FilterRole; label: string }[] = [
    { key: "ALL", label: "All Users" },
    { key: "PARENT", label: "Parents" },
    { key: "CHW", label: "CHWs" },
    { key: "NURSE", label: "Nurses" },
    { key: "ADMIN", label: "Admins" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground mt-1">System-wide user directory — {users.length} total</p>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["PARENT", "CHW", "NURSE", "ADMIN"] as Role[]).map((role) => {
          const cfg = ROLE_CONFIG[role];
          const Icon = cfg.icon;
          return (
            <Card
              key={role}
              className="p-4 cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all"
              onClick={() => setRoleFilter(role)}
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-primary/10 grid place-items-center">
                  <Icon className="size-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold font-display">{counts[role]}</div>
                  <div className="text-xs text-muted-foreground">{cfg.label}s</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setRoleFilter(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                roleFilter === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({counts[tab.key]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="font-medium">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery || roleFilter !== "ALL"
                ? "Try adjusting your filters"
                : "No users registered yet"}
            </p>
            {(searchQuery || roleFilter !== "ALL") && (
              <Button
                variant="ghost"
                className="mt-3"
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("ALL");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden lg:table-cell">Location</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Joined</th>
                  <th className="px-4 py-3 w-12" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => {
                  const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.PARENT;
                  const Icon = cfg.icon;
                  return (
                    <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 grid place-items-center shrink-0">
                            <Icon className="size-4 text-primary" />
                          </div>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3.5 shrink-0" />
                            {user.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {user.district ? (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="size-3.5 shrink-0" />
                            <span className="truncate max-w-[160px]">
                              {[user.sector, user.district, user.province]
                                .filter(Boolean)
                                .join(", ")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={cfg.tone}>{cfg.label}</Badge>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {user.role !== "ADMIN" && (
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.id}
                            className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
