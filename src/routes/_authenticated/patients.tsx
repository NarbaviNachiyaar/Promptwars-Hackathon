import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/setu/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/patients")({
  component: PatientsPage,
});

type PatientRow = {
  id: string;
  name: string;
  dob: string | null;
  is_demo: boolean;
  created_at: string;
};

function PatientsPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: patients, isLoading } = useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<PatientRow[]> => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, dob, is_demo, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function createPatient(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("patients")
        .insert({ name: name.trim(), dob: dob || null, is_demo: false })
        .select("id")
        .single();
      if (error) throw error;
      if (userData.user) {
        await supabase
          .from("patient_access")
          .insert({ patient_id: data.id, user_id: userData.user.id });
      }
      setName("");
      setDob("");
      toast.success("Patient record created");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create patient");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <p className="rule-label">Workspace</p>
      <h1 className="mt-3 text-4xl">Patients</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Each record collects documents from every hospital a patient has passed through.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {patients?.length === 0 && (
            <p className="text-sm text-muted-foreground">No patient records yet.</p>
          )}
          {patients?.map((p) => (
            <Link
              key={p.id}
              to="/patients/$patientId"
              params={{ patientId: p.id }}
              className="paper-card block px-6 py-5 transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl">{p.name}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {p.dob ? `DOB ${p.dob}` : "Date of birth not recorded"}
                  </p>
                </div>
                {p.is_demo && <span className="rule-label text-fact">Demo</span>}
              </div>
            </Link>
          ))}
        </div>

        <form onSubmit={createPatient} className="paper-card h-fit space-y-4 p-6">
          <h2 className="text-lg">New patient record</h2>
          <div className="space-y-2">
            <Label htmlFor="pname">Name</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pdob">Date of birth</Label>
            <Input id="pdob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            Create record
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
