import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/civic";
import { ArrowRight, MapPin, Activity, Users, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CivicConnect — Report civic issues to your city" },
      { name: "description", content: "Report road damage, water leaks, power failures and more — and track municipal response in real time." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section className="civic-hero-gradient">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Built for citizens & municipalities
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold leading-tight md:text-6xl">
                Your city, <span className="text-primary">heard.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
                Report potholes, water leaks, power failures and other civic issues in seconds.
                Track every step from <strong>reported</strong> to <strong>resolved</strong>.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ mode: "signup" }}>
                    Report an issue <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/auth">I'm a municipal officer</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <h2 className="font-display text-2xl font-semibold md:text-3xl">What you can report</h2>
          <p className="mt-2 text-muted-foreground">Seven categories covering the most common civic problems.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {CATEGORIES.map((c) => (
              <div key={c.value} className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-center transition hover:border-primary/40">
                <span className="text-3xl">{c.icon}</span>
                <span className="text-sm font-medium">{c.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30">
          <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-3">
            {[
              { icon: MapPin, t: "Pin it on the map", d: "Auto-detect or drop a pin to locate the issue precisely." },
              { icon: Activity, t: "Track live progress", d: "Pending → In Progress → Resolved with a real-time status feed." },
              { icon: ShieldCheck, t: "Admin oversight", d: "Municipal officers triage, assign departments, and update status." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-border bg-card p-6">
                <f.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 font-display text-lg font-semibold">{f.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 py-16 text-center">
          <Users className="mx-auto h-8 w-8 text-accent" />
          <h2 className="mt-3 font-display text-3xl font-bold">Make your neighborhood better.</h2>
          <p className="mt-2 text-muted-foreground">Free for citizens. Join in under a minute.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/auth" search={{ mode: "signup" }}>Create your account</Link>
          </Button>
        </section>
      </main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} CivicConnect
      </footer>
    </div>
  );
}
