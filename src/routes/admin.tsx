import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Header } from "@/components/Header";
import { StatusBadge } from "@/components/StatusBadge";
import { MarkersMap } from "@/components/MapView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES, DEPARTMENTS, STATUSES, categoryIcon, categoryLabel, type StatusValue,
} from "@/lib/civic";
import { Pencil, Trash2, Search } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — CivicConnect" }] }),
  component: AdminPage,
});

const COLORS = ["#2C7A88","#E8853A","#5B8DEF","#62B98C","#D86F6F","#9B6FD8","#888"];

function AdminPage() {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<any | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate({ to: "/auth", replace: true });
      else if (role !== "admin") navigate({ to: "/dashboard", replace: true });
    }
  }, [loading, user, role, navigate]);

  const { data: complaints = [], refetch } = useQuery({
    queryKey: ["all-complaints"],
    enabled: role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (role !== "admin") return;
    const ch = supabase.channel("admin-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [role, refetch]);

  const filtered = useMemo(() => complaints.filter((c) => {
    if (cat !== "all" && c.category !== cat) return false;
    if (status !== "all" && c.status !== status) return false;
    if (q && !`${c.title} ${c.description} ${c.address ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [complaints, q, cat, status]);

  const counts = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    progress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  }), [complaints]);

  const byCategory = useMemo(() => CATEGORIES.map((c) => ({
    name: c.label,
    value: complaints.filter((x) => x.category === c.value).length,
  })).filter((x) => x.value > 0), [complaints]);

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of complaints) {
      const d = new Date(c.created_at);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return Array.from(m.entries()).sort().slice(-6).map(([k, v]) => ({ month: k, count: v }));
  }, [complaints]);

  const markers = useMemo(() =>
    complaints
      .filter((c) => c.latitude && c.longitude)
      .map((c) => ({ id: c.id, lat: c.latitude!, lng: c.longitude!, title: c.title })),
  [complaints]);

  async function updateComplaint(id: string, patch: any) {
    const { error } = await supabase.from("complaints").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Updated");
    setEditing(null);
    refetch();
  }
  async function deleteComplaint(id: string) {
    if (!confirm("Delete this complaint?")) return;
    const { error } = await supabase.from("complaints").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    refetch();
  }

  if (role !== "admin") return null;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">Monitor, triage, and resolve civic complaints.</p>

        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total" value={counts.total} tone="primary" />
          <Stat label="Pending" value={counts.pending} tone="warning" />
          <Stat label="In Progress" value={counts.progress} tone="info" />
          <Stat label="Resolved" value={counts.resolved} tone="success" />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <Panel title="Monthly trend">
            {byMonth.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={byMonth}>
                  <XAxis dataKey="month" stroke="currentColor" fontSize={12} />
                  <YAxis stroke="currentColor" fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="var(--primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Panel>
          <Panel title="By category">
            {byCategory.length === 0 ? <Empty /> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Panel>
        </section>

        {markers.length > 0 && (
          <section className="mt-6">
            <Panel title="Complaint map">
              <MarkersMap markers={markers} height={360} />
            </Panel>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold">All complaints</h2>
          <div className="mt-3 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, description, address…" className="pl-9" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="md:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="md:w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Issue</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Department</th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium line-clamp-1">{c.title}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{c.address ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {categoryIcon(c.category)} {categoryLabel(c.category)}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={c.status as StatusValue} /></td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{c.assigned_department ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setEditing(c)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteComplaint(c.id)} aria-label="Delete">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No complaints found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Update complaint</DialogTitle></DialogHeader>
          {editing && <EditForm c={editing} onSave={updateComplaint} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditForm({ c, onSave }: { c: any; onSave: (id: string, patch: any) => void }) {
  const [status, setStatus] = useState(c.status);
  const [dept, setDept] = useState(c.assigned_department ?? "");
  const [title, setTitle] = useState(c.title);
  const [description, setDescription] = useState(c.description);
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => { e.preventDefault(); onSave(c.id, { status, assigned_department: dept || null, title, description }); }}
    >
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select value={dept || "unassigned"} onValueChange={(v) => setDept(v === "unassigned" ? "" : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button type="submit" className="w-full">Save changes</Button>
    </form>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  const tones: Record<string, string> = {
    primary: "border-primary/30 bg-primary/5",
    warning: "border-warning/30 bg-warning/5",
    info: "border-info/30 bg-info/5",
    success: "border-success/30 bg-success/5",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
function Empty() { return <div className="py-12 text-center text-sm text-muted-foreground">No data yet.</div>; }
