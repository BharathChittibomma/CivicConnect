import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Header } from "@/components/Header";
import { StatusBadge, StatusProgress } from "@/components/StatusBadge";
import { MarkersMap } from "@/components/MapView";
import { categoryIcon, categoryLabel, type StatusValue } from "@/lib/civic";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/complaint/$id")({
  head: () => ({ meta: [{ title: "Complaint — CivicConnect" }] }),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  const { data, refetch } = useQuery({
    queryKey: ["complaint", id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: c, error: e1 }, { data: hist, error: e2 }] = await Promise.all([
        supabase.from("complaints").select("*").eq("id", id).maybeSingle(),
        supabase.from("status_history").select("*").eq("complaint_id", id).order("changed_at", { ascending: true }),
      ]);
      if (e1) throw e1; if (e2) throw e2;
      return { complaint: c, history: hist ?? [] };
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`complaint-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints", filter: `id=eq.${id}` }, () => refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "status_history", filter: `complaint_id=eq.${id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  const c = data?.complaint;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-4xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/dashboard"><ArrowLeft className="mr-1 h-4 w-4" />Back</Link>
        </Button>
        {!c ? (
          <div className="mt-8 rounded-xl border border-dashed p-12 text-center text-muted-foreground">Loading…</div>
        ) : (
          <article className="mt-4 space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">
                  {categoryIcon(c.category)} {categoryLabel(c.category)}
                </div>
                <h1 className="mt-1 font-display text-3xl font-bold">{c.title}</h1>
              </div>
              <StatusBadge status={c.status as StatusValue} />
            </header>

            <div className="rounded-2xl border border-border bg-card p-6">
              <StatusProgress status={c.status as StatusValue} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                {c.image_url && (
                  <img src={c.image_url} alt={c.title} className="w-full rounded-xl border border-border" />
                )}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-display text-lg font-semibold">Description</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{c.description}</p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <Meta icon={Calendar} label="Reported" value={new Date(c.created_at).toLocaleString()} />
                  <Meta icon={Calendar} label="Updated" value={new Date(c.updated_at).toLocaleString()} />
                  <Meta icon={MapPin} label="Address" value={c.address ?? "—"} />
                  <Meta icon={Building2} label="Department" value={c.assigned_department ?? "Unassigned"} />
                </dl>
              </div>

              <div className="space-y-4">
                {c.latitude && c.longitude ? (
                  <MarkersMap
                    markers={[{ id: c.id, lat: c.latitude, lng: c.longitude, title: c.title }]}
                    height={280}
                  />
                ) : null}
                <div className="rounded-xl border border-border bg-card p-5">
                  <h2 className="font-display text-lg font-semibold">Status history</h2>
                  <ol className="mt-3 space-y-3">
                    {(data?.history ?? []).map((h) => (
                      <li key={h.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <div>
                          <div className="font-medium">
                            {h.old_status ? `${h.old_status} → ` : ""}<span>{h.new_status}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(h.changed_at).toLocaleString()}
                          </div>
                        </div>
                      </li>
                    ))}
                    {(data?.history ?? []).length === 0 && (
                      <li className="text-sm text-muted-foreground">No history yet.</li>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />{label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
