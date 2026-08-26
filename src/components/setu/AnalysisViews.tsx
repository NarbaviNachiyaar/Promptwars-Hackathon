import type {
  AnalysisResult,
  Contradiction,
  MissingContextItem,
  TimelineEvent,
  Trend,
} from "@/lib/analysis-types";

export type DocMeta = { id: string; hospital_name: string; doc_date: string | null; doc_type: string };

function Sources({ ids, docs }: { ids: string[]; docs: DocMeta[] }) {
  if (!ids.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {ids.map((id) => {
        const doc = docs.find((d) => d.id === id);
        return (
          <span
            key={id}
            className="rounded-sm border border-border bg-muted px-2 py-1 font-mono text-[0.6875rem] text-muted-foreground"
          >
            {doc ? `${doc.doc_type} · ${doc.hospital_name.split(",")[0]} · ${doc.doc_date ?? "—"}` : id.slice(0, 8)}
          </span>
        );
      })}
    </div>
  );
}

export function FactBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-fact-surface px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-fact-foreground">
      <span className="h-1.5 w-1.5 rounded-full bg-fact" />
      Extracted fact
    </span>
  );
}

export function FlagBadge({ label = "AI-flagged pattern" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm bg-flag-surface px-2 py-0.5 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-flag-foreground">
      <span className="h-1.5 w-1.5 rotate-45 bg-flag" />
      {label}
    </span>
  );
}

export function TimelineView({ events, docs }: { events: TimelineEvent[]; docs: DocMeta[] }) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No timeline events reconstructed yet.</p>;
  }

  return (
    <ol className="relative ml-3 border-l border-paper-edge pl-8">
      {events.map((e, index) => (
        <li key={`${e.date}-${index}`} className="relative pb-10 last:pb-0">
          <span className="absolute -left-[2.28rem] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-fact" />
          <p className="font-mono text-xs tracking-wide text-fact-foreground">{e.date}</p>
          <h3 className="mt-1.5 text-xl leading-snug">{e.title}</h3>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {e.hospital}
            {e.category ? ` · ${e.category.replace("_", " ")}` : ""}
          </p>
          <div className="paper-card mt-3 p-5">
            <FactBadge />
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{e.detail}</p>
            <Sources ids={e.sourceDocIds} docs={docs} />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ContradictionCard({ item, docs }: { item: Contradiction; docs: DocMeta[] }) {
  return (
    <div className="rounded-lg border border-flag/40 bg-flag-surface/60 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <FlagBadge label="Contradiction" />
        <span className="rule-label text-flag-foreground">{item.severity} severity</span>
      </div>
      <h3 className="mt-3 text-lg leading-snug">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.detail}</p>
      <Sources ids={item.sourceDocIds} docs={docs} />
    </div>
  );
}

export function GapCard({ item, docs }: { item: MissingContextItem; docs: DocMeta[] }) {
  return (
    <div className="rounded-lg border border-flag/30 border-dashed bg-flag-surface/35 p-5">
      <FlagBadge label="Missing follow-up" />
      <h3 className="mt-3 text-lg leading-snug">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{item.detail}</p>
      <Sources ids={item.sourceDocIds} docs={docs} />
    </div>
  );
}

export function TrendCard({ trend, docs }: { trend: Trend; docs: DocMeta[] }) {
  const values = trend.points.map((p) => p.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;

  return (
    <div className="paper-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg">
            {trend.label}{" "}
            <span className="text-sm text-muted-foreground">{trend.unit}</span>
          </h3>
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {trend.direction}
          </p>
        </div>
        <FactBadge />
      </div>

      <div className="mt-6 flex items-end gap-4">
        {trend.points.map((p, i) => (
          <div key={`${p.date}-${i}`} className="flex flex-1 flex-col items-center gap-2">
            <span className="font-mono text-xs text-fact-foreground">{p.value}</span>
            <div
              className="w-full rounded-t-sm bg-fact/70"
              style={{ height: `${16 + ((p.value - min) / span) * 90}px` }}
            />
            <span className="font-mono text-[0.625rem] text-muted-foreground">{p.date}</span>
          </div>
        ))}
      </div>

      {trend.note && (
        <p className="mt-5 border-t border-paper-edge pt-4 text-sm text-ink-soft">{trend.note}</p>
      )}
      <Sources ids={trend.points.map((p) => p.sourceDocId)} docs={docs} />
    </div>
  );
}

export function DoctorView({ analysis, docs }: { analysis: AnalysisResult; docs: DocMeta[] }) {
  return (
    <div className="space-y-10">
      <section className="paper-card p-7">
        <p className="rule-label">Clinician summary</p>
        <p className="mt-3 whitespace-pre-line text-[0.95rem] leading-relaxed text-ink-soft">
          {analysis.doctorSummary || "No summary generated."}
        </p>
      </section>

      <section>
        <h2 className="text-2xl">Contradictions</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Where the record disagrees with itself. Every item cites its documents.
        </p>
        <div className="mt-5 space-y-4">
          {analysis.contradictions.length ? (
            analysis.contradictions.map((c, i) => <ContradictionCard key={i} item={c} docs={docs} />)
          ) : (
            <p className="text-sm text-muted-foreground">None detected in the supplied documents.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl">Missing context</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Follow-ups instructed in one document with no later record of them happening.
        </p>
        <div className="mt-5 space-y-4">
          {analysis.missingContext.length ? (
            analysis.missingContext.map((m, i) => <GapCard key={i} item={m} docs={docs} />)
          ) : (
            <p className="text-sm text-muted-foreground">No gaps detected.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-2xl">Trends</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {analysis.trends.length ? (
            analysis.trends.map((t, i) => <TrendCard key={i} trend={t} docs={docs} />)
          ) : (
            <p className="text-sm text-muted-foreground">No repeated values found across documents.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export function PatientView({ analysis, docs }: { analysis: AnalysisResult; docs: DocMeta[] }) {
  return (
    <div className="space-y-10">
      <section className="paper-card p-8">
        <p className="rule-label">Your records, in plain language</p>
        <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink">
          {analysis.patientSummary || "No summary generated."}
        </p>
      </section>

      {analysis.contradictions.length > 0 && (
        <section>
          <h2 className="text-2xl">Things to raise with your doctor</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            These are places where your hospital records don't match each other. Setu does not
            know which one is correct — your doctor decides.
          </p>
          <div className="mt-5 space-y-4">
            {analysis.contradictions.map((c, i) => (
              <ContradictionCard key={i} item={c} docs={docs} />
            ))}
          </div>
        </section>
      )}

      {analysis.missingContext.length > 0 && (
        <section>
          <h2 className="text-2xl">Appointments and tests that were advised</h2>
          <div className="mt-5 space-y-4">
            {analysis.missingContext.map((m, i) => (
              <GapCard key={i} item={m} docs={docs} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
