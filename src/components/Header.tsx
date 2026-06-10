import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthProvider";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { LogOut, ShieldCheck, LayoutDashboard, Plus } from "lucide-react";

export function Header() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            CC
          </span>
          <span>CivicConnect</span>
        </Link>
        <nav className="flex items-center gap-1">
          {user ? (
            <>
              {role === "admin" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin"><ShieldCheck className="h-4 w-4 mr-1.5" />Admin</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/dashboard"><LayoutDashboard className="h-4 w-4 mr-1.5" />Dashboard</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/new"><Plus className="h-4 w-4 mr-1.5" />Report</Link>
                  </Button>
                </>
              )}
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Button asChild variant="ghost" size="sm">
                <Link to="/auth">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
