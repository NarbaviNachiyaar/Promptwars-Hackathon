import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { reconstructHistory } from "@/lib/setu.functions";
import { AppShell } from "@/components/setu/AppShell";
import {
  DoctorView,
  PatientView,
  TimelineView,
  type DocMeta,
} from "@/components/setu/AnalysisViews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { AnalysisResult } from "@/lib/analysis-types";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  component: PatientDetail,
});

type DocumentRow = DocMeta & {
  source: string;
  raw_text: string;
  uploaded_at: string;
};

function PatientDetail() {
  const { patientId } = Route.useParams();
  const queryClient = useQueryClient();
  const reconstruct = useServerFn(reconstructHistory);

  const [hospital, setHospital] = useState("");
  const [docDate, setDocDate] = useState("");
  const [docType, setDocType] = useState("Discharge Summary");
  const [source, setSource] = useState<"hospital" | "patient_provided">("hospital");
  const [rawText, setRawText] = useState("");
  const [saving, setSaving] = useState(false);

  const patientQuery = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, dob, is_demo")
        .eq("id", patientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const docsQuery = useQuery({
    queryKey: ["documents", patientId],
    queryFn: async (): Promise<DocumentRow[]> => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, hospital_name, doc_date, doc_type, source, raw_text, uploaded_at")
        .eq("patient_id", patientId)
        .order("doc_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const analysisQuery = useQuery({
    queryKey: ["analysis", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analyses")
        .select(
          "id, created_at, timeline_json, contradictions_json, missing_context_json, trends_json, doctor_summary, patient_summary",
        )
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        createdAt: data.created_at,
        analysis: {
          timeline: (data.timeline_json ?? []) as AnalysisResult["timeline"],
          contradictions: (data.contradictions_json ?? []) as AnalysisResult["contradictions"],
          missingContext: (data.missing_context_json ?? []) as AnalysisResult["missingContext"],
          trends: (data.trends_json ?? []) as AnalysisResult["trends"],
          doctorSummary: data.doctor_summary,
          patientSummary: data.patient_summary,
        } satisfies AnalysisResult,
      };
    },
  });

  const reconstructMutation = useMutation({
    mutationFn: () => reconstruct({ data: { patientId } }),
    onSuccess: () => {
      toast.success("History reconstructed");
      queryClient.invalidateQueries({ queryKey: ["analysis", patientId] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Reconstruction failed"),
  });

  async function addDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!hospital.trim() || !rawText.trim()) {
      toast.error("Hospital and document text are required");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from("documents").insert({
        patient_id: patientId,
        hospital_name: hospital.trim(),
        doc_date: docDate || null,
        doc_type: docType,
        source,
        raw_text: rawText,
      });
      if (error) throw error;
      setHospital("");
      setDocDate("");
      setRawText("");
      toast.success("Document added");
      queryClient.invalidateQueries({ queryKey: ["documents", patientId] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add document");
    } finally {
      setSaving(false);
    }
  }

  const docs = docsQuery.data ?? [];
  const result = analysisQuery.data?.analysis;

  return (
    <AppShell>
      <Link to="/patients" className="rule-label hover:text-foreground">
        ← All patients
      </Link>

      <div className="mt-5 flex flex-wrap items-end justify-between gap-6 border-b border-paper-edge pb-8">
        <div>
          <h1 className="text-4xl">{patientQuery.data?.name ?? "Patient"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {patientQuery.data?.dob ? `DOB ${patientQuery.data.dob} · ` : ""}
            {docs.length} document{docs.length === 1 ? "" : "s"} across{" "}
            {new Set(docs.map((d) => d.hospital_name)).size} sources
          </p>
        </div>
        <div className="text-right">
          <Button
            size="lg"
            onClick={() => reconstructMutation.mutate()}
            disabled={reconstructMutation.isPending || docs.length === 0}
          >
            {reconstructMutation.isPending ? "Reconciling…" : "Reconstruct patient history"}
          </Button>
          {analysisQuery.data && (
            <p className="mt-2 text-xs text-muted-foreground">
              Last run {new Date(analysisQuery.data.createdAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="timeline" className="mt-10">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="doctor">Doctor view</TabsTrigger>
          <TabsTrigger value="patient">Patient view</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="pt-10">
          {result ? (
            <TimelineView events={result.timeline} docs={docs} />
          ) : (
            <EmptyState pending={reconstructMutation.isPending} />
          )}
        </TabsContent>

        <TabsContent value="doctor" className="pt-10">
          {result ? (
            <DoctorView analysis={result} docs={docs} />
          ) : (
            <EmptyState pending={reconstructMutation.isPending} />
          )}
        </TabsContent>

        <TabsContent value="patient" className="pt-10">
          {result ? (
            <PatientView analysis={result} docs={docs} />
          ) : (
            <EmptyState pending={reconstructMutation.isPending} />
          )}
        </TabsContent>

        <TabsContent value="documents" className="pt-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
            <div className="space-y-4">
              {docs.map((d) => (
                <article key={d.id} className="paper-card p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg">{d.doc_type}</h3>
                    <span className="rule-label">
                      {d.source === "hospital" ? "Hospital record" : "Patient provided"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {d.hospital_name} · {d.doc_date ?? "undated"}
                  </p>
                  <pre className="mt-4 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-soft">
                    {d.raw_text}
                  </pre>
                </article>
              ))}
              {docs.length === 0 && (
                <p className="text-sm text-muted-foreground">No documents yet.</p>
              )}
            </div>

            <form onSubmit={addDocument} className="paper-card h-fit space-y-4 p-6">
              <h2 className="text-lg">Add a document</h2>
              <div className="space-y-2">
                <Label htmlFor="hospital">Hospital / source</Label>
                <Input
                  id="hospital"
                  value={hospital}
                  onChange={(e) => setHospital(e.target.value)}
                  placeholder="Apollo Hospitals, Chennai"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={docDate}
                    onChange={(e) => setDocDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Input id="type" value={docType} onChange={(e) => setDocType(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Origin</Label>
                <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
                  <SelectTrigger id="source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hospital">Hospital record</SelectItem>
                    <SelectItem value="patient_provided">Patient provided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="text">Document text</Label>
                <Textarea
                  id="text"
                  rows={8}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste the discharge summary, lab report or consultation note…"
                />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                Add document
              </Button>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function EmptyState({ pending }: { pending: boolean }) {
  return (
    <div className="paper-card p-10 text-center">
      <p className="text-base text-ink-soft">
        {pending
          ? "Reading every document and reconciling them…"
          : "No reconstruction yet. Run “Reconstruct patient history” to build the cited timeline."}
      </p>
    </div>
  );
}
