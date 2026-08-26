export type TimelineEvent = {
  date: string;
  hospital: string;
  title: string;
  detail: string;
  category: string;
  sourceDocIds: string[];
};

export type Contradiction = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  sourceDocIds: string[];
};

export type MissingContextItem = {
  title: string;
  detail: string;
  sourceDocIds: string[];
};

export type TrendPoint = {
  date: string;
  value: number;
  sourceDocId: string;
};

export type Trend = {
  label: string;
  unit: string;
  direction: "rising" | "falling" | "stable";
  points: TrendPoint[];
  note: string;
};

export type AnalysisResult = {
  timeline: TimelineEvent[];
  contradictions: Contradiction[];
  missingContext: MissingContextItem[];
  trends: Trend[];
  doctorSummary: string;
  patientSummary: string;
};

export const emptyAnalysis: AnalysisResult = {
  timeline: [],
  contradictions: [],
  missingContext: [],
  trends: [],
  doctorSummary: "",
  patientSummary: "",
};
