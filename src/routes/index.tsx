import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { SetuMark } from "@/components/setu/AppShell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Setu — AI continuity of care across Indian hospitals" },
      {
        name: "description",
        content:
          "Setu reconciles a patient's records across hospitals, flagging contradictions, missed follow-ups and lab trends, with doctor and patient views of the same data.",
      },
      { property: "og:title", content: "Setu — AI continuity of care" },
      {
        property: "og:description",
        content:
          "Reconcile fragmented hospital records into one cited timeline. Contradictions and gaps, never diagnoses.",
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    label: "Reconcile",
    body: "Records from every hospital a patient has visited, merged into one chronological account with the source document always attached.",
  },
  {
    label: "Contradict",
    body: "Where two hospitals disagree — an allergy recorded in Mumbai and denied in Chennai — Setu flags it in clay, and cites both documents.",
  },
  {
    label: "Trend",
    body: "Values repeated across visits are lined up over time, so a creatinine drifting upward across three cities becomes visible.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
        <SetuMark />
        <Link to="/auth">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="border-b border-paper-edge py-20">
          <p className="rule-label">Continuity of care · India</p>
          <h1 className="mt-6 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            A patient moves between hospitals.
            <span className="block text-ink-soft">Their story shouldn't stay behind.</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-relaxed text-muted-foreground">
            Setu is a bridge between fragmented clinical records. It reads what each hospital
            wrote, reconstructs one cited timeline, and flags where the record contradicts
            itself or goes quiet.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/auth">
              <Button size="lg">Open the demo workspace</Button>
            </Link>
            <span className="text-xs text-muted-foreground">
              Synthetic demo patient included · no real records
            </span>
          </div>
        </section>

        <section className="grid gap-px border-b border-paper-edge bg-paper-edge sm:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.label} className="bg-background p-7">
              <p className="rule-label">{p.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </div>
          ))}
        </section>

        <section className="py-16">
          <div className="paper-card p-8">
            <h2 className="text-xl">What Setu will never do</h2>
            <ul className="mt-5 space-y-3 text-sm text-ink-soft">
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fact" />
                Diagnose, prescribe, or suggest treatment. It reconciles records — nothing more.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fact" />
                Assert anything not written in a supplied document. Every flag cites its source.
              </li>
              <li className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-fact" />
                Blur the line between an extracted fact and an AI-observed pattern. The interface
                keeps them visually distinct.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 pb-12">
        <p className="border-t border-paper-edge pt-5 text-xs text-muted-foreground">
          Setu · a demonstration of AI-assisted record reconciliation. Not a medical device.
        </p>
      </footer>
    </div>
  );
}
