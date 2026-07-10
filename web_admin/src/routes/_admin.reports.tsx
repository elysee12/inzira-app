import { createFileRoute } from "@tanstack/react-router";
import {
  Users, BookOpen, Building2, UserCheck,
  FileText, Headphones, Video,
  Download, Filter, RefreshCw,
} from "lucide-react";
import { Card, StatCard, Button, Input, Label, Badge } from "@/components/admin/ui";
import { userApi, contentApi, categoryApi, facilityApi, nurseApi, type User, type Content, type Facility, type Nurse } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_admin/reports")({
  component: ReportsPage,
});

interface RawData {
  users: User[];
  contents: Content[];
  facilities: Facility[];
  nurses: Nurse[];
  categories: { id: string; label: string; color: string }[];
}

type ReportTab = "users" | "content" | "facilities" | "nurses";

// ── Excel export ───────────────────────────────────────────────────────────────

function exportExcel(rows: Record<string, unknown>[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── PDF export — pure jsPDF, no plugin dependency ─────────────────────────────

function exportPDF(title: string, head: string[], body: string[][], filename: string) {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const mL = 32, mR = 32;
  const usableW = pageW - mL - mR;
  const colW = usableW / head.length;
  const rowH = 18, hdrH = 22;
  let y = 66;
  let pageNum = 1;

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text(title, mL, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(`Imirire Portal  •  ${new Date().toLocaleString()}  •  ${body.length} records`, mL, 52);

  const stampPage = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(160, 160, 160);
    doc.text(`Page ${pageNum}`, pageW / 2, pageH - 12, { align: "center" });
  };

  const drawHeader = () => {
    doc.setFillColor(41, 128, 185);
    doc.rect(mL, y, usableW, hdrH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    head.forEach((h, i) =>
      doc.text(h, mL + i * colW + 5, y + 14, { maxWidth: colW - 8 })
    );
    y += hdrH;
  };

  drawHeader();

  body.forEach((row, idx) => {
    if (y + rowH > pageH - 30) {
      stampPage();
      doc.addPage();
      pageNum++;
      y = 36;
      drawHeader();
    }
    const even = idx % 2 === 0;
    doc.setFillColor(even ? 250 : 244, even ? 250 : 246, even ? 250 : 249);
    doc.rect(mL, y, usableW, rowH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.line(mL, y + rowH, mL + usableW, y + rowH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(40, 40, 40);
    row.forEach((cell, i) =>
      doc.text(String(cell ?? "—"), mL + i * colW + 5, y + 12, { maxWidth: colW - 10 })
    );
    y += rowH;
  });

  stampPage();
  doc.save(`${filename}.pdf`);
}

// ── Main component ─────────────────────────────────────────────────────────────

function ReportsPage() {
  const { user } = useAuth();
  const isNurse = user?.role === "NURSE";
  const facilityId = isNurse ? user?.facilityId : undefined;

  const [raw, setRaw] = useState<RawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ReportTab>("users");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => { loadData(); }, [facilityId]);

  async function loadData() {
    setLoading(true);
    try {
      const [users, contents, categories, facilities, nurses] = await Promise.all([
        facilityId ? userApi.listByRole("ALL", facilityId) : userApi.listAll(),
        contentApi.list(facilityId),
        categoryApi.list(),
        facilityId ? facilityApi.list(true).then(f => f.filter(fac => fac.id === facilityId)) : facilityApi.list(true),
        facilityId ? nurseApi.list().then(n => n.filter(nurse => nurse.facilityId === facilityId)) : nurseApi.list(),
      ]);
      setRaw({ users, contents, facilities, nurses, categories });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  const filteredUsers = useMemo(() => {
    if (!raw) return [];
    return raw.users.filter((u) => {
      const matchRole = roleFilter === "ALL" || u.role === roleFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchFrom = !dateFrom || new Date(u.createdAt) >= new Date(dateFrom);
      const matchTo   = !dateTo   || new Date(u.createdAt) <= new Date(dateTo + "T23:59:59");
      return matchRole && matchSearch && matchFrom && matchTo;
    });
  }, [raw, roleFilter, searchQuery, dateFrom, dateTo]);

  const filteredContent = useMemo(() => {
    if (!raw) return [];
    const q = searchQuery.toLowerCase();
    return raw.contents.filter((c) => {
      const matchSearch = !q || c.title.toLowerCase().includes(q);
      const matchFrom = !dateFrom || new Date(c.postedAt) >= new Date(dateFrom);
      const matchTo   = !dateTo   || new Date(c.postedAt) <= new Date(dateTo + "T23:59:59");
      return matchSearch && matchFrom && matchTo;
    });
  }, [raw, searchQuery, dateFrom, dateTo]);

  const filteredFacilities = useMemo(() => {
    if (!raw) return [];
    const q = searchQuery.toLowerCase();
    return raw.facilities.filter((f) =>
      !q || f.name.toLowerCase().includes(q) || (f.district ?? "").toLowerCase().includes(q)
    );
  }, [raw, searchQuery]);

  const filteredNurses = useMemo(() => {
    if (!raw) return [];
    const q = searchQuery.toLowerCase();
    return raw.nurses.filter((n) =>
      !q || n.name.toLowerCase().includes(q) || n.email.toLowerCase().includes(q)
    );
  }, [raw, searchQuery]);

  const summary = useMemo(() => {
    if (!raw) return null;
    return {
      totalUsers: raw.users.length,
      nurses: raw.nurses.length,
      totalContent: raw.contents.length,
      facilities: raw.facilities.length,
    };
  }, [raw]);

  function handleExcelExport() {
    if (tab === "users") {
      exportExcel(filteredUsers.map((u) => ({
        Name: u.name, Email: u.email, Phone: u.phone, Role: u.role,
        District: u.district ?? "", Sector: u.sector ?? "",
        Joined: new Date(u.createdAt).toLocaleDateString(),
      })), "imirire-users");
    } else if (tab === "content") {
      exportExcel(filteredContent.map((c) => ({
        Title: c.title, Type: c.type, AgeGroup: c.ageGroup,
        PostedBy: c.postedBy?.name ?? "", Date: new Date(c.postedAt).toLocaleDateString(),
      })), "imirire-content");
    } else if (tab === "facilities") {
      exportExcel(filteredFacilities.map((f) => ({
        Name: f.name, Type: f.type, Province: f.province ?? "",
        District: f.district ?? "", Sector: f.sector ?? "",
        Phone: f.phone ?? "", Active: f.isActive ? "Yes" : "No",
      })), "imirire-facilities");
    } else {
      exportExcel(filteredNurses.map((n) => ({
        Name: n.name, Email: n.email, Phone: n.phone,
        Facility: (n as any).facility?.name ?? "",
        District: n.district ?? "",
        Joined: new Date(n.createdAt).toLocaleDateString(),
      })), "imirire-nurses");
    }
  }

  function handlePDFExport() {
    if (tab === "users") {
      exportPDF("Users Report — Imirire",
        ["Name", "Email", "Phone", "Role", "District", "Joined"],
        filteredUsers.map((u) => [u.name, u.email, u.phone, u.role, u.district ?? "—", new Date(u.createdAt).toLocaleDateString()]),
        "imirire-users");
    } else if (tab === "content") {
      exportPDF("Content Report — Imirire",
        ["Title", "Type", "Age Group", "Posted By", "Date"],
        filteredContent.map((c) => [c.title, c.type, c.ageGroup, c.postedBy?.name ?? "—", new Date(c.postedAt).toLocaleDateString()]),
        "imirire-content");
    } else if (tab === "facilities") {
      exportPDF("Facilities Report — Imirire",
        ["Name", "Type", "Province", "District", "Sector", "Active"],
        filteredFacilities.map((f) => [f.name, f.type, f.province ?? "—", f.district ?? "—", f.sector ?? "—", f.isActive ? "Yes" : "No"]),
        "imirire-facilities");
    } else {
      exportPDF("Nurses Report — Imirire",
        ["Name", "Email", "Phone", "Facility", "District", "Joined"],
        filteredNurses.map((n) => [n.name, n.email, n.phone, (n as any).facility?.name ?? "—", n.district ?? "—", new Date(n.createdAt).toLocaleDateString()]),
        "imirire-nurses");
    }
  }

  const TABS = summary ? [
    { key: "users" as const, label: "Users", count: filteredUsers.length },
    { key: "content" as const, label: "Content", count: filteredContent.length },
    { key: "facilities" as const, label: "Facilities", count: filteredFacilities.length },
    { key: "nurses" as const, label: "Nurses", count: filteredNurses.length },
  ] : [];

  if (loading) return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">System Reports</h1>
      <Card className="p-12 text-center"><p className="text-muted-foreground">Loading…</p></Card>
    </div>
  );

  if (!raw || !summary) return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold tracking-tight">System Reports</h1>
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Failed to load. <button className="text-primary underline" onClick={loadData}>Retry</button></p>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">System Reports</h1>
          <p className="text-muted-foreground mt-1">Analytics, filters, and data export</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="size-4" /> Refresh
          </Button>
          <Button variant="outline" onClick={handleExcelExport} className="gap-2">
            <Download className="size-4" /> Excel
          </Button>
          <Button onClick={handlePDFExport} className="gap-2">
            <FileText className="size-4" /> PDF
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"   value={summary.totalUsers}   icon={<Users     className="size-5" />} tone="primary" />
        <StatCard label="Total Content" value={summary.totalContent} icon={<BookOpen  className="size-5" />} tone="success" />
        <StatCard label="Facilities"    value={summary.facilities}   icon={<Building2 className="size-5" />} tone="warning" />
        <StatCard label="Nurses"        value={summary.nurses}       icon={<UserCheck className="size-5" />} tone="violet"  />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="size-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <Label>Search</Label>
            <Input placeholder="Name, email…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          {tab === "users" && (
            <div>
              <Label>Role</Label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                className="mt-1 w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                <option value="ALL">All Roles</option>
                <option value="PARENT">Parent</option>
                <option value="CHW">CHW</option>
                <option value="NURSE">Nurse</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          )}
          <div>
            <Label>From Date</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div>
            <Label>To Date</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        {(searchQuery || roleFilter !== "ALL" || dateFrom || dateTo) && (
          <button onClick={() => { setSearchQuery(""); setRoleFilter("ALL"); setDateFrom(""); setDateTo(""); }}
            className="mt-3 text-xs text-primary hover:underline">Clear all filters</button>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label} <span className="ml-1 text-xs opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Tables */}
      {tab === "users"      && <UsersTable      rows={filteredUsers}      />}
      {tab === "content"    && <ContentTable    rows={filteredContent}    />}
      {tab === "facilities" && <FacilitiesTable rows={filteredFacilities} />}
      {tab === "nurses"     && <NursesTable     rows={filteredNurses}     />}
    </div>
  );
}

// ── Table components ───────────────────────────────────────────────────────────

const ROLE_TONE: Record<string, "primary" | "success" | "warning" | "neutral"> = {
  ADMIN: "warning", NURSE: "primary", CHW: "success", PARENT: "neutral",
};

function TableWrap({ head, children, empty }: { head: string[]; children: React.ReactNode; empty: boolean }) {
  return (
    <Card className="overflow-hidden">
      {empty ? (
        <div className="p-12 text-center text-muted-foreground text-sm">No records match the current filters.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                {head.map((h) => <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y">{children}</tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function UsersTable({ rows }: { rows: User[] }) {
  return (
    <TableWrap head={["Name","Email","Phone","Role","District","Sector","Joined"]} empty={rows.length===0}>
      {rows.map((u) => (
        <tr key={u.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium">{u.name}</td>
          <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
          <td className="px-4 py-3 text-muted-foreground">{u.phone}</td>
          <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role]??"neutral"}>{u.role}</Badge></td>
          <td className="px-4 py-3 text-muted-foreground">{u.district??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{u.sector??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{new Date(u.createdAt).toLocaleDateString()}</td>
        </tr>
      ))}
    </TableWrap>
  );
}

function ContentTable({ rows }: { rows: Content[] }) {
  const ICON: Record<string,React.ElementType> = { text:FileText, audio:Headphones, video:Video };
  const TONE: Record<string,"primary"|"success"|"warning"> = { text:"primary", audio:"success", video:"warning" };
  return (
    <TableWrap head={["Title","Type","Age Group","Posted By","Date"]} empty={rows.length===0}>
      {rows.map((c) => {
        const Icon = ICON[c.type]??FileText;
        return (
          <tr key={c.id} className="hover:bg-muted/30">
            <td className="px-4 py-3 font-medium max-w-xs truncate">{c.title}</td>
            <td className="px-4 py-3"><Badge tone={TONE[c.type]??"neutral"}><Icon className="size-3 mr-1 inline"/>{c.type}</Badge></td>
            <td className="px-4 py-3 text-muted-foreground">{c.ageGroup} months</td>
            <td className="px-4 py-3 text-muted-foreground">{c.postedBy?.name??"—"}</td>
            <td className="px-4 py-3 text-muted-foreground">{new Date(c.postedAt).toLocaleDateString()}</td>
          </tr>
        );
      })}
    </TableWrap>
  );
}

function FacilitiesTable({ rows }: { rows: Facility[] }) {
  return (
    <TableWrap head={["Name","Type","Province","District","Sector","Phone","Status"]} empty={rows.length===0}>
      {rows.map((f) => (
        <tr key={f.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium">{f.name}</td>
          <td className="px-4 py-3 text-muted-foreground">{f.type}</td>
          <td className="px-4 py-3 text-muted-foreground">{f.province??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{f.district??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{f.sector??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{f.phone??"—"}</td>
          <td className="px-4 py-3"><Badge tone={f.isActive?"success":"neutral"}>{f.isActive?"Active":"Inactive"}</Badge></td>
        </tr>
      ))}
    </TableWrap>
  );
}

function NursesTable({ rows }: { rows: Nurse[] }) {
  return (
    <TableWrap head={["Name","Email","Phone","Facility","District","Sector","Joined"]} empty={rows.length===0}>
      {rows.map((n) => (
        <tr key={n.id} className="hover:bg-muted/30">
          <td className="px-4 py-3 font-medium">{n.name}</td>
          <td className="px-4 py-3 text-muted-foreground">{n.email}</td>
          <td className="px-4 py-3 text-muted-foreground">{n.phone}</td>
          <td className="px-4 py-3 text-muted-foreground">{(n as any).facility?.name??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{n.district??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{n.sector??"—"}</td>
          <td className="px-4 py-3 text-muted-foreground">{new Date(n.createdAt).toLocaleDateString()}</td>
        </tr>
      ))}
    </TableWrap>
  );
}
