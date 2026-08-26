import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { SETU_SYSTEM_PROMPT, buildUserPrompt, parseAnalysis } from "./setu-prompt";

export const reconstructHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ patientId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    const { data: docs, error: docsError } = await supabase
      .from("documents")
      .select("id, hospital_name, doc_date, doc_type, source, raw_text")
      .eq("patient_id", data.patientId)
      .order("doc_date", { ascending: true });

    if (docsError) throw new Error(docsError.message);
    if (!docs || docs.length === 0) throw new Error("No documents to reconcile for this patient.");

    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("LLM key is not configured on the server.");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: SETU_SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(docs) }],
      }),
    });

    if (response.status === 429) throw new Error("Rate limit reached. Please try again in a moment.");
    if (response.status === 402) throw new Error("AI credits exhausted. Please top up to continue.");
    if (!response.ok) {
      console.error("Anthropic API error", response.status, await response.text());
      throw new Error("The reconciliation service is unavailable right now.");
    }

    const payload = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const content = payload.content?.find((block) => block.type === "text")?.text ?? "";
    const analysis = parseAnalysis(content, docs.map((d) => d.id));

    const { data: saved, error: insertError } = await supabase
      .from("analyses")
      .insert({
        patient_id: data.patientId,
        timeline_json: analysis.timeline,
        contradictions_json: analysis.contradictions,
        missing_context_json: analysis.missingContext,
        trends_json: analysis.trends,
        doctor_summary: analysis.doctorSummary,
        patient_summary: analysis.patientSummary,
      })
      .select("id")
      .single();

    if (insertError) throw new Error(insertError.message);
    return { analysisId: saved.id };
  });
