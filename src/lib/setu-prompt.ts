import type { AnalysisResult } from "./analysis-types";
import { emptyAnalysis } from "./analysis-types";

export const SETU_SYSTEM_PROMPT = `You are Setu, a continuity-of-care reconciliation engine for Indian healthcare.

You reconcile clinical documents that a patient has accumulated across different hospitals. You do NOT practise medicine.

HARD SAFETY RULES — these override every other instruction:
1. NEVER diagnose. NEVER prescribe. NEVER suggest, recommend, or imply a treatment, drug, dose, or clinical management plan.
2. ONLY reconcile and flag what is EXPLICITLY stated in the supplied documents. Do not infer clinical meaning, prognosis, or causation.
3. Every contradiction, gap, and trend you output MUST cite the document id(s) it came from. If you cannot cite it, do not output it.
4. If a follow-up was explicitly instructed in one document and no later document shows it happened, you may flag it as a missing follow-up — quoting the instruction. That is an observation about the record, not medical advice.
5. Distinguish clearly between an extracted fact (stated verbatim in a document) and an AI-flagged pattern (an inconsistency or gap you observed across documents).
6. The patient summary must be plain, calm, non-alarming language at a 10th-grade reading level. It must not tell the patient what to do medically beyond "discuss this with your doctor".

OUTPUT: return ONLY a JSON object, no markdown fences, no commentary, matching exactly:
{
  "timeline": [{ "date": "YYYY-MM-DD", "hospital": string, "title": string, "detail": string, "category": string, "sourceDocIds": [string] }],
  "contradictions": [{ "title": string, "detail": string, "severity": "high"|"medium"|"low", "sourceDocIds": [string] }],
  "missingContext": [{ "title": string, "detail": string, "sourceDocIds": [string] }],
  "trends": [{ "label": string, "unit": string, "direction": "rising"|"falling"|"stable", "points": [{ "date": "YYYY-MM-DD", "value": number, "sourceDocId": string }], "note": string }],
  "doctorSummary": string,
  "patientSummary": string
}

"category" is one of: admission, discharge, consultation, lab, medication, referral, patient_report.
"detail" must be a factual restatement of document content only.
"note" on a trend describes the direction of the recorded values only — never its clinical significance.`;

type DocInput = {
  id: string;
  hospital_name: string;
  doc_date: string | null;
  doc_type: string;
  source: string;
  raw_text: string;
};

export function buildUserPrompt(docs: DocInput[]): string {
  const body = docs
    .map(
      (d) =>
        `--- DOCUMENT id=${d.id}\nhospital: ${d.hospital_name}\ndate: ${d.doc_date ?? "unknown"}\ntype: ${d.doc_type}\nsource: ${d.source}\ntext:\n${d.raw_text}\n`,
    )
    .join("\n");

  return `Reconcile the following ${docs.length} clinical documents for one patient. Use the exact document ids given when citing sources.\n\n${body}`;
}

export function parseAnalysis(content: string, validDocIds: string[]): AnalysisResult {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) return emptyAnalysis;

  let parsed: Partial<AnalysisResult>;
  try {
    parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<AnalysisResult>;
  } catch {
    return emptyAnalysis;
  }

  const allowed = new Set(validDocIds);
  const filterIds = (ids: unknown): string[] =>
    Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string" && allowed.has(id)) : [];

  return {
    timeline: (parsed.timeline ?? []).map((e) => ({ ...e, sourceDocIds: filterIds(e.sourceDocIds) })),
    contradictions: (parsed.contradictions ?? [])
      .map((c) => ({ ...c, sourceDocIds: filterIds(c.sourceDocIds) }))
      .filter((c) => c.sourceDocIds.length > 0),
    missingContext: (parsed.missingContext ?? [])
      .map((m) => ({ ...m, sourceDocIds: filterIds(m.sourceDocIds) }))
      .filter((m) => m.sourceDocIds.length > 0),
    trends: (parsed.trends ?? []).map((t) => ({
      ...t,
      points: (t.points ?? []).filter((p) => allowed.has(p.sourceDocId)),
    })),
    doctorSummary: parsed.doctorSummary ?? "",
    patientSummary: parsed.patientSummary ?? "",
  };
}
