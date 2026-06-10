import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthProvider";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LocationPicker } from "@/components/MapView";
import { CATEGORIES } from "@/lib/civic";
import { Locate, Upload } from "lucide-react";

export const Route = createFileRoute("/new")({
  head: () => ({ meta: [{ title: "Report an issue — CivicConnect" }] }),
  component: NewComplaint,
});

function NewComplaint() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", replace: true });
  }, [loading, user, navigate]);

  function detectLocation() {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => toast.error("Couldn't detect location"),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!category) return toast.error("Pick a category");
    setBusy(true);
    try {
      let image_url: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
        const up = await supabase.storage.from("complaint-images").upload(path, file);
        if (up.error) throw up.error;
        const signed = await supabase.storage.from("complaint-images").createSignedUrl(path, 60 * 60 * 24 * 365);
        image_url = signed.data?.signedUrl ?? null;
      }
      const { data, error } = await supabase.from("complaints").insert({
        user_id: user.id,
        title, description,
        category: category as any,
        latitude: coords?.lat ?? null,
        longitude: coords?.lng ?? null,
        address: address || null,
        image_url,
      }).select("id").single();
      if (error) throw error;
      // Initial history row
      await supabase.from("status_history").insert({
        complaint_id: data!.id,
        new_status: "PENDING",
        changed_by: user.id,
      });
      toast.success("Complaint submitted");
      navigate({ to: "/complaint/$id", params: { id: data!.id } });
    } catch (err: any) {
      toast.error(err.message ?? "Failed to submit");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-3xl font-bold">Report an issue</h1>
        <p className="text-sm text-muted-foreground">Share details so the right team can help.</p>
        <form onSubmit={submit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Pothole near Main St & 4th Ave" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.icon} {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, city" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" required maxLength={2000} rows={4} value={description}
              onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue, severity, hazards…" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Location</Label>
              <Button type="button" variant="outline" size="sm" onClick={detectLocation}>
                <Locate className="mr-1.5 h-3.5 w-3.5" />Use my location
              </Button>
            </div>
            <LocationPicker value={coords} onChange={setCoords} />
            <p className="text-xs text-muted-foreground">
              {coords ? `Pinned at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Click the map to drop a pin."}
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="image">Photo (optional)</Label>
            <label htmlFor="image" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border p-4 hover:bg-muted/40">
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{file ? file.name : "Upload an image"}</span>
              <input id="image" type="file" accept="image/*" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit complaint"}</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
