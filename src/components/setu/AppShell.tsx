import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export function SetuMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <span className="font-display text-xl leading-none tracking-tight text-foreground">setu</span>
      <span className="h-px w-6 translate-y-[-0.35rem] bg-fact/60" aria-hidden />
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const router = useRouter();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-paper-edge bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <Link to="/patients" className="flex items-center">
            <SetuMark />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/patients"
              className="rule-label transition-colors hover:text-foreground"
              activeProps={{ className: "rule-label text-foreground" }}
            >
              Patients
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10">{children}</main>
      <footer className="mx-auto max-w-6xl px-5 pb-10">
        <p className="border-t border-paper-edge pt-4 text-xs text-muted-foreground">
          Setu reconciles what documents say. It does not diagnose, prescribe, or advise on
          treatment. Demo data is synthetic.
        </p>
      </footer>
    </div>
  );
}
