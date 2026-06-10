import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Header } from "@/components/Header";
import { ComplaintCard } from "@/components/ComplaintCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, STATUSES } from "@/lib/civic";
import { Plus, Search, ShieldCheck } from "lucide-react";

function ClaimAdminBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    supabase.from("user_roles").select("role", { count: "exact", head: true }).eq("role", "admin")
      .then(({ count }) => setShow((count ?? 0) === 0));
  }, []);
  async function claim() {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error) return toast.error(error.message);
    if (data) { toast.success("You are now admin — reloading"); setTimeout(() => location.reload(), 600); }
    else toast.info("An admin already exists");
  }
  if (!show) return null;
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 p-4">
      <div className="flex items-center gap-2 text-sm">
        <ShieldCheck className="h-4 w-4 text-accent" />
        No admin set up yet. Claim the admin role to manage all complaints.
      </div>
      <Button size="sm" variant="outline" onClick={claim}>Become admin</Button>
    </div>
  );
}

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CivicConnect" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, loading, role } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
    if (!loading && role === "admin") navigate({ to: "/admin", replace: true });
  }, [loading, user, role, navigate]);

  const { data: complaints = [], refetch } = useQuery({
    queryKey: ["my-complaints", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Realtime
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("my-complaints")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "complaints", filter: `user_id=eq.${user.id}` },
        () => refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refetch]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      if (cat !== "all" && c.category !== cat) return false;
      if (status !== "all" && c.status !== status) return false;
      if (q && !`${c.title} ${c.description}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [complaints, q, cat, status]);

  const counts = useMemo(() => ({
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "PENDING").length,
    progress: complaints.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: complaints.filter((c) => c.status === "RESOLVED").length,
  }), [complaints]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">My complaints</h1>
            <p className="text-sm text-muted-foreground">Track every issue you've reported.</p>
          </div>
          <Button asChild>
            <Link to="/new"><Plus className="mr-1.5 h-4 w-4" />New report</Link>
          </Button>
        </div>
        <ClaimAdminBanner />

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Total" value={counts.total} tone="primary" />
          <Stat label="Pending" value={counts.pending} tone="warning" />
          <Stat label="In Progress" value={counts.progress} tone="info" />
          <Stat label="Resolved" value={counts.resolved} tone="success" />
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="md:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="md:w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              {complaints.length === 0 ? "No complaints yet. Report your first issue!" : "No matches."}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
                <ComplaintCard key={c.id} complaint={c as any} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "primary" | "warning" | "info" | "success" }) {
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
