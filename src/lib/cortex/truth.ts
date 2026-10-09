/**
 * Cortex truth ledger — the shared contract for every route.
 *
 * These values are reconciled across the signature surface, route pages,
 * flow states, and reports. Hardcoded ONLY where the app has no live data
 * for it; never in place of a working live query.
 */

/** 32 indexed sources. IDs 01–32, stable across signature, catalog, evals. */
export const SOURCES: { id: string; title: string; date: string }[] = [
  { id: "01", title: "Positioning research", date: "October 1, 2026" },
  { id: "02", title: "Customer interview synthesis", date: "October 2, 2026" },
  { id: "03", title: "Model governance memo", date: "October 1, 2026" },
  { id: "04", title: "Cortex evaluation notes", date: "October 5, 2026" },
  { id: "05", title: "Buyer workflow benchmark", date: "October 2, 2026" },
  { id: "06", title: "Enterprise AI adoption pulse", date: "October 1, 2026" },
  { id: "07", title: "Product council interview synthesis", date: "October 1, 2026" },
  { id: "08", title: "Trust and traceability study", date: "October 2, 2026" },
  { id: "09", title: "Procurement objection log", date: "October 3, 2026" },
  { id: "10", title: "Research operations workflow audit", date: "October 3, 2026" },
  { id: "11", title: "Analyst brief: governed AI workspaces", date: "October 2, 2026" },
  { id: "12", title: "Knowledge retrieval quality review", date: "October 3, 2026" },
  { id: "13", title: "Pilot team diary study", date: "October 1, 2026" },
  { id: "14", title: "Competitive capability matrix", date: "October 2, 2026" },
  { id: "15", title: "Security review notes", date: "October 3, 2026" },
  { id: "16", title: "Finance team cost analysis", date: "October 4, 2026" },
  { id: "17", title: "Legal review: evidence retention", date: "October 2, 2026" },
  { id: "18", title: "Customer advisory board minutes", date: "October 3, 2026" },
  { id: "19", title: "Support ticket theme analysis", date: "October 1, 2026" },
  { id: "20", title: "Playbook reuse study", date: "October 4, 2026" },
  { id: "21", title: "Model latency benchmark", date: "October 5, 2026" },
  { id: "22", title: "Information architecture critique", date: "October 3, 2026" },
  { id: "23", title: "Enterprise search field notes", date: "October 2, 2026" },
  { id: "24", title: "Usage governance working paper", date: "October 4, 2026" },
  { id: "25", title: "Evaluation harness results", date: "October 2, 2026" },
  { id: "26", title: "Sales discovery call synthesis", date: "October 3, 2026" },
  { id: "27", title: "Onboarding friction review", date: "October 4, 2026" },
  { id: "28", title: "Source freshness audit", date: "October 4, 2026" },
  { id: "29", title: "Product strategy decision log", date: "October 1, 2026" },
  { id: "30", title: "Retrieval failure postmortems", date: "October 5, 2026" },
  { id: "31", title: "Launch readiness memo", date: "October 6, 2026" },
  { id: "32", title: "Executive narrative review", date: "October 6, 2026" },
];

export function sourceById(id: string) {
  return SOURCES.find((s) => s.id === id);
}

/** The 9 citation IDs cited in the Launch narrative thread. */
export const THREAD_CITATIONS = ["01", "02", "03", "07", "16", "17", "20", "28", "31"];

/** Governance: $0.08 per-response ceiling; $0.050 spent across two answers. */
export const GOVERNANCE = {
  responseCeiling: 0.08,
  threadSpent: 0.031 + 0.019,
  monthlyLimit: 200,
  monthlySpent: 184,
  nextReview: "October 31, 2026",
};

/** The designed signature thread — verbatim copy from the spec. */
export interface DesignedAnswer {
  label: string;
  heading: string;
  body: { type: "p"; html: string } | { type: "quote"; text: string } | { type: "h5"; text: string };
  tokens: number;
  seconds: number;
  cost: number;
}

export const SIGNATURE_THREAD = {
  title: "Launch narrative",
  subtitle: "Research synthesis · last edited October 6",
  modelLine: "Cortex 4 · 32 sources",
  opener: "Turn the research into a clear launch position.",
  followUp: "What gives that position credibility with enterprise buyers?",
  answers: [
    {
      label: "Answer 01 · Positioning",
      heading: "Lead with confidence, not complexity.",
      blocks: [
        {
          type: "p",
          html: "Your strongest position is not “another AI workspace.” It is a governed thinking environment where teams can trace every answer back to its source [01], reuse what works, and see the cost of every decision [03].",
        },
        { type: "h5", text: "Recommended narrative" },
        {
          type: "quote",
          text: "Cortex turns scattered expertise into trusted, repeatable playbooks—with citations and cost controls built in.",
        },
        {
          type: "p",
          html: "The proof is operational: every claim remains attached to evidence [02], every useful response can become a team pattern [20], and every model decision stays within a visible budget [16].",
        },
      ],
      tokens: 2184,
      seconds: 4.2,
      cost: 0.031,
    },
    {
      label: "Answer 02 · Proof",
      heading: "Make trust observable.",
      blocks: [
        {
          type: "p",
          html: "Enterprise teams do not need another promise of intelligence. They need an answer trail they can inspect, a source-freshness signal they can challenge [28], and clear controls for retention and access [17].",
        },
        {
          type: "p",
          html: "Lead the demo with a real decision: open the source, inspect the retrieval, save the answer as a playbook, then show the budget impact. That sequence maps directly to the concerns raised in buyer interviews [07] and the launch readiness review [31].",
        },
      ],
      tokens: 1406,
      seconds: 3.1,
      cost: 0.019,
    },
  ],
} as const;

export type SignatureAnswer = (typeof SIGNATURE_THREAD.answers)[number];

/** Usage chart truth: workspaces, monthly burn, thread reconciliation. */
export const CHART_DATA = {
  workspaces: [
    { name: "Launch narrative", model: 2260, context: 1330 },
    { name: "Research synthesis", model: 1930, context: 880 },
    { name: "Pricing analysis", model: 980, context: 440 },
  ],
  budget: [38, 72, 126, 184],
  planLimit: 200,
  currentThread: {
    answers: [
      { tokens: 2184, cost: 0.031 },
      { tokens: 1406, cost: 0.019 },
    ],
    ceiling: 0.08,
  },
};

/** Per-screen descriptions used on designed pages. */
export const SCREEN_COPY: Record<string, string> = {
  "New chat":
    "Begin with a blank, source-aware composer and choose the model, knowledge base, or playbook before sending.",
  History:
    "Search every conversation by title, collaborator, source, or date and return to the exact message you need.",
  "Playbook builder":
    "Define instructions, variables, knowledge, quality checks, and sharing in one guided build sequence.",
  "Knowledge bases":
    "See indexing health and coverage across the collections that ground Cortex answers.",
  Documents:
    "Review source status, size, owner, and indexing progress before a document can influence an answer.",
  "Usage dashboard":
    "Track tokens, model mix, cost, latency, and budget thresholds across the workspace.",
  Team: "Invite collaborators, assign access, and understand their last activity without leaving the workspace.",
  "API keys":
    "Create scoped credentials, reveal them once, and revoke access with a permanent audit event.",
  Billing:
    "Manage seats, plan limits, invoices, and payment recovery without obscuring proration.",
  "Launch narrative": "Return to the active launch-positioning thread and its cited research.",
  "Research synthesis":
    "Review the research workspace, saved findings, and the evidence behind each conclusion.",
  Conversations:
    "Start, revisit, and organize source-grounded conversations without losing the thread.",
  Playbooks:
    "Turn strong work into repeatable team workflows with variables, owners, and sharing controls.",
  Knowledge: "Ingest documents, inspect chunks, and ask questions with every answer tied back to its source.",
  Usage: "Understand token cost, model mix, budgets, and limits before they become surprises.",
};

export const TRUTH_SETS = {
  people: [
    ["Maya Jordan", "Editor · Product", "Active"],
    ["Owen Clarke", "Viewer · Research", "Active"],
    ["Priya Shah", "Admin · Operations", "Invited"],
  ],
  keys: [
    ["Production API", "chat:write · sources:read", "Used October 6, 2026 at 10:08 PM"],
    ["Evaluation runner", "eval:write", "Used October 5, 2026"],
    ["Local development", "Full workspace", "Expires October 31, 2026"],
  ],
  knowledge: [
    ["Customer interviews", "426 chunks", "Ready"],
    ["Positioning research", "188 chunks", "Ready"],
    ["Pricing archive", "92 chunks", "Indexing"],
  ],
  playbooks: [
    ["Launch brief", "6 variables", "Team"],
    ["Research synthesis", "3 variables", "Private"],
    ["Weekly decision memo", "4 variables", "Team"],
  ],
  threads: [
    ["Launch narrative", "32 sources", "October 6, 2026 · 10:12 PM"],
    ["Research synthesis", "7 sources", "October 6, 2026 · 9:38 PM"],
    ["Pricing analysis", "4 sources", "October 5, 2026"],
  ],
};

export const WORKSPACE_STATS = [
  ["Active threads", "24"],
  ["Sources indexed", "1,842"],
  ["Quality score", "94%"],
];

export const ACTUAL_METRICS = [
  ["Conversations", "24"],
  ["Sources", "1,842"],
  ["Quality", "94%"],
  ["Spend", "$184"],
];

/** Composer model picker options — the truth models from the spec. */
export const PICKER_MODELS = ["Cortex 4", "Cortex 4 Mini", "Reasoning 2"] as const;

/** Spec picker label → live model registry id (chat API). */
export const PICKER_TO_REGISTRY: Record<string, string> = {
  "Cortex 4": "cortex-pro",
  "Cortex 4 Mini": "cortex-flash",
  "Reasoning 2": "cortex-reason",
};

export function registryModelId(pickerLabel: string): string {
  return PICKER_TO_REGISTRY[pickerLabel] ?? "cortex-flash";
}

/** Registry id → spec picker label (for restoring the composer selection). */
const REGISTRY_TO_PICKER: Record<string, string> = {
  "cortex-pro": "Cortex 4",
  "cortex-flash": "Cortex 4 Mini",
  "cortex-reason": "Reasoning 2",
};

export function pickerLabelFor(registryId: string): string {
  return REGISTRY_TO_PICKER[registryId] ?? "Cortex 4 Mini";
}

/** Empty-state suggestion cards for /app/chat. */
export const SUGGESTION_CARDS = [
  { label: "Compare the three strongest objections in our buyer interviews.", hint: "Grounded synthesis" },
  { label: "Draft a launch brief using only sources updated this week.", hint: "Playbook draft" },
  { label: "Which claims in the positioning memo need stronger evidence?", hint: "Evidence audit" },
  { label: "Summarize the launch readiness memo for the exec review.", hint: "Executive brief" },
];

export const ONBOARDING_STEPS = [
  "Send your first message",
  "Save it as a template",
  "Invite your team",
];

export const EVAL_RUNS = [
  { name: "Weekly regression", date: "October 6, 2026", sha: "a3f9c21", groundedness: 94, precision: 0.86, relevance: 0.91, latency: 1.9, status: "Passed" },
  { name: "Retrieval tuning pass", date: "October 4, 2026", sha: "77bd04e", groundedness: 91, precision: 0.82, relevance: 0.88, latency: 2.3, status: "Passed" },
  { name: "Nightly eval", date: "October 3, 2026", sha: "e1c550a", groundedness: 88, precision: 0.79, relevance: 0.84, latency: 2.6, status: "Failed" },
];
