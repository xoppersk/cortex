/**
 * Demo-mode in-memory store.
 *
 * Mirrors the Postgres schema closely enough that API routes can share
 * business logic between demo and production paths. Module-level singleton;
 * seeded on first access with a demo team, templates, conversations, and a
 * knowledge base built from `supabase/seed/knowledge-base/*.md`.
 *
 * NOT for production — data lives in the Node process and resets on restart.
 */
import { randomUUID } from "crypto";

export interface DemoUser {
  id: string;
  email: string;
  displayName: string;
}

export interface DemoTeam {
  id: string;
  name: string;
  slug: string;
  plan: "starter" | "pro" | "team";
  seatCount: number;
  monthlyTokenBudget: number | null;
  budgetHardStop: boolean;
  defaultModelId: string;
  defaultTemperature: number;
  retentionDays: 30 | 90 | 365;
}

export interface DemoMembership {
  teamId: string;
  userId: string;
  role: "owner" | "admin" | "member";
  status: "active" | "invited" | "deactivated";
}

export interface DemoConversation {
  id: string;
  teamId: string;
  userId: string;
  title: string;
  modelId: string;
  folder: string | null;
  pinned: boolean;
  templateId: string | null;
  messageCount: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  lastMessageAt: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface DemoMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "streaming" | "complete" | "error" | "stopped";
  modelId: string | null;
  promptTokens: number;
  completionTokens: number;
  latencyMs: number | null;
  version: number;
  citations: Array<{
    chunkId: string;
    documentId: string;
    documentName: string;
    label: string;
    score: number;
    excerpt: string;
  }> | null;
  errorCode: string | null;
  createdAt: string;
}

export interface DemoTemplate {
  id: string;
  teamId: string;
  authorId: string;
  name: string;
  description: string;
  category: string;
  promptBody: string;
  variables: Array<{ name: string; label: string; defaultValue: string; required: boolean }>;
  visibility: "personal" | "team";
  featured: boolean;
  version: number;
  runCount: number;
  createdAt: string;
}

export interface DemoUsageEvent {
  id: number;
  teamId: string;
  userId: string;
  conversationId: string | null;
  messageId: string | null;
  templateId: string | null;
  modelId: string;
  promptTokens: number;
  completionTokens: number;
  estimatedCostUsd: number;
  latencyMs: number | null;
  ragEmbeddingTokens: number | null;
  ragRetrievalLatencyMs: number | null;
  createdAt: string;
}

export interface DemoChunk {
  id: string;
  documentId: string;
  documentName: string;
  kbId: string;
  chunkIndex: number;
  content: string;
  tokenCount: number;
  sectionHeading: string;
  /** Deterministic mock embedding vector (unit-ish, 64 dims for speed). */
  vector: number[];
}

export interface DemoDocument {
  id: string;
  kbId: string;
  name: string;
  status: "queued" | "processing" | "ready" | "failed" | "quarantined";
  statusError: string | null;
  chunkCount: number;
  injectionFlags: number;
  createdAt: string;
}

export interface DemoKB {
  id: string;
  teamId: string;
  name: string;
  description: string;
  retrievalTopK: number;
  rerankTopN: number;
  similarityThreshold: number;
  chunkSizeTokens: number;
  chunkOverlapPct: number;
  createdAt: string;
}

interface DemoDB {
  users: DemoUser[];
  teams: DemoTeam[];
  memberships: DemoMembership[];
  conversations: DemoConversation[];
  messages: DemoMessage[];
  templates: DemoTemplate[];
  usage: DemoUsageEvent[];
  kbs: DemoKB[];
  documents: DemoDocument[];
  chunks: DemoChunk[];
  invites: Array<{ id: string; teamId: string; email: string; role: string; token: string; expiresAt: string }>;
  usageSeq: number;
  seeded: boolean;
}

const db: DemoDB = {
  users: [],
  teams: [],
  memberships: [],
  conversations: [],
  messages: [],
  templates: [],
  usage: [],
  kbs: [],
  documents: [],
  chunks: [],
  invites: [],
  usageSeq: 1,
  seeded: false,
};

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_TEAM_ID = "00000000-0000-0000-0000-000000000002";
export const DEMO_KB_ID = "00000000-0000-0000-0000-000000000003";

export function getDB(): DemoDB {
  if (!db.seeded) {
    seedDemo();
    db.seeded = true;
  }
  return db;
}

function now(): string {
  return new Date().toISOString();
}

function seedDemo() {
  db.users.push({
    id: DEMO_USER_ID,
    email: "amara@example.com",
    displayName: "Amara Diallo",
  });
  db.teams.push({
    id: DEMO_TEAM_ID,
    name: "Acme Marketing",
    slug: "acme-marketing",
    plan: "pro",
    seatCount: 10,
    monthlyTokenBudget: 500,
    budgetHardStop: false,
    defaultModelId: "cortex-flash",
    defaultTemperature: 0.7,
    retentionDays: 90,
  });
  db.memberships.push({
    teamId: DEMO_TEAM_ID,
    userId: DEMO_USER_ID,
    role: "owner",
    status: "active",
  });

  const templates: Array<Omit<DemoTemplate, "id" | "createdAt" | "runCount" | "version">> = [
    {
      teamId: DEMO_TEAM_ID, authorId: DEMO_USER_ID,
      name: "Cold outreach v3", description: "Short, direct cold email with one observation and one ask.",
      category: "Sales",
      promptBody: "Write a {{tone}} cold email to {{prospect}} at {{company}} about {{product}}. Open with one specific observation about their business, connect it to a single pain {{product}} solves, and close with a low-friction ask. Keep it under {{max_words}} words. No buzzwords.",
      variables: [
        { name: "prospect", label: "Prospect name", defaultValue: "", required: true },
        { name: "company", label: "Company", defaultValue: "", required: true },
        { name: "product", label: "Product", defaultValue: "Cortex", required: false },
        { name: "tone", label: "Tone", defaultValue: "direct", required: false },
        { name: "max_words", label: "Max words", defaultValue: "120", required: false },
      ],
      visibility: "team", featured: true,
    },
    {
      teamId: DEMO_TEAM_ID, authorId: DEMO_USER_ID,
      name: "Launch email draft", description: "Announce a feature to your audience without the hype.",
      category: "Marketing",
      promptBody: "Announce {{feature}} to {{audience}}. Lead with the benefit ({{benefit}}), then what changed in two bullets, then one sentence on how to try it. Tone: helpful, never hypey.",
      variables: [
        { name: "feature", label: "Feature", defaultValue: "", required: true },
        { name: "audience", label: "Audience", defaultValue: "customers", required: false },
        { name: "benefit", label: "Key benefit", defaultValue: "", required: true },
      ],
      visibility: "team", featured: false,
    },
    {
      teamId: DEMO_TEAM_ID, authorId: DEMO_USER_ID,
      name: "Meeting notes → action items", description: "Turn raw notes into owners and deadlines.",
      category: "Ops",
      promptBody: "Turn these meeting notes into action items: {{notes}}. Output a table with columns: Action, Owner, Deadline. Infer owners from context where obvious; mark the rest as TBD.",
      variables: [{ name: "notes", label: "Meeting notes", defaultValue: "", required: true }],
      visibility: "personal", featured: false,
    },
    {
      teamId: DEMO_TEAM_ID, authorId: DEMO_USER_ID,
      name: "Bug triage summary", description: "Ticket text in, engineering-ready bug report out.",
      category: "Engineering",
      promptBody: "Turn this ticket into an engineering-ready bug report: {{ticket_text}}. Output: Summary (one line), Steps to reproduce (numbered), Expected vs actual, Severity (P1-P4) with one-line justification.",
      variables: [{ name: "ticket_text", label: "Ticket text", defaultValue: "", required: true }],
      visibility: "team", featured: false,
    },
    {
      teamId: DEMO_TEAM_ID, authorId: DEMO_USER_ID,
      name: "Weekly status update", description: "Wins, risks, and next week in exec-readable form!.",
      category: "Ops",
      promptBody: "Write my weekly status update from these bullets: {{bullets}}. Sections: Wins, Risks / blockers, Next week. Keep each bullet to one line, plain language.",
      variables: [{ name: "bullets", label: "Raw bullets", defaultValue: "", required: true }],
      visibility: "personal", featured: false,
    },
    {
      teamId: DEMO_TEAM_ID, authorId: DEMO_USER_ID,
      name: "Competitor teardown", description: "Structured teardown of a competitor's positioning.",
      category: "Marketing",
      promptBody: "Teardown {{competitor}}'s positioning for {{audience}}. Cover: headline promise, proof points, pricing psychology, and three gaps we can exploit. Cite anything checkable as [source needed].",
      variables: [
        { name: "competitor", label: "Competitor", defaultValue: "", required: true },
        { name: "audience", label: "Target audience", defaultValue: "", required: false },
      ],
      visibility: "team", featured: true,
    },
  ];
  for (const t of templates) {
    db.templates.push({ ...t, id: randomUUID(), runCount: Math.floor(Math.random() * 40), version: 1, createdAt: now() });
  }

  // One demo conversation with a couple of messages.
  const convoId = randomUUID();
  db.conversations.push({
    id: convoId, teamId: DEMO_TEAM_ID, userId: DEMO_USER_ID,
    title: "Launch email draft — Cortex KB", modelId: "cortex-flash",
    folder: null, pinned: true, templateId: null,
    messageCount: 2, totalPromptTokens: 120, totalCompletionTokens: 310,
    lastMessageAt: now(), createdAt: now(), deletedAt: null,
  });
  db.messages.push(
    {
      id: randomUUID(), conversationId: convoId, role: "user",
      content: "Draft a launch email for our knowledge base feature.",
      status: "complete", modelId: null, promptTokens: 0, completionTokens: 0,
      latencyMs: null, version: 1, citations: null, errorCode: null, createdAt: now(),
    },
    {
      id: randomUUID(), conversationId: convoId, role: "assistant",
      content: "Here's a draft for the knowledge-base launch:\n\n**Subject:** Your team's docs, now answerable\n\nHi team,\n\nCortex can now answer questions straight from our own documents — every answer cites its sources, so you can verify any claim in one click.\n\nTry it: open Knowledge → Cortex Help Center → Ask, and ask anything about our pricing or security docs.",
      status: "complete", modelId: "cortex-flash", promptTokens: 120, completionTokens: 310,
      latencyMs: 900, version: 1, citations: null, errorCode: null, createdAt: now(),
    },
  );

  // Demo knowledge base (documents/chunks are ingested lazily on first KB access
  // so `next dev` boots fast — see ensureDemoKBSeeded()).
  db.kbs.push({
    id: DEMO_KB_ID, teamId: DEMO_TEAM_ID,
    name: "Cortex Help Center",
    description: "Seeded product docs, pricing, and security guides.",
    retrievalTopK: 8, rerankTopN: 4, similarityThreshold: 0.25,
    chunkSizeTokens: 800, chunkOverlapPct: 15,
    createdAt: now(),
  });
}

export async function getDemoTeamContext(userId: string, email: string | undefined) {
  const d = getDB();
  const memberships = d.memberships.filter((m) => m!.userId === userId && m!.status === "active");
  const teams = memberships.map((m) => {
    const t = d.teams.find((x) => x.id === m!.teamId)!;
    return { id: t.id, name: t.name, plan: t.plan, role: m!.role };
  });
  if (teams.length === 0) return null;
  const activeTeam = teams[0];
  const m = memberships[0];
  return {
    user: { id: userId, email },
    profile: { displayName: "Amara Diallo", defaultModelId: "cortex-flash" },
    teams,
    activeTeam,
    membership: { teamId: m!.teamId, role: m!.role, status: m!.status },
  };
}

export function nextUsageId(): number {
  return getDB().usageSeq++;
}
