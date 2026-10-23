import "server-only";

/**
 * Cortex data layer — async, Supabase-backed DTO functions.
 *
 * Every exported getter keeps the v2 DTO shape from src/lib/types.ts but is
 * implemented over the request-scoped server client for the signed-in
 * user's ACTIVE TEAM (see getTeamContext). No fixture JSON is imported
 * anywhere in production code: data/*.json is read only by
 * scripts/seed-owner.mjs (owner workspace seed) and the seed-mapping test.
 *
 * getStates() was REPLACED (see the state section at the bottom):
 *  - invite / auth / signup copy -> owned by W1's auth screens now
 *  - emptyHistory -> getEmptyHistoryState() (real workspace + KB data)
 *  - upgrade      -> getUpgradeState() (real team plan/seats/usage)
 * A deprecated getStates() shim remains ONLY so W1's in-flight auth pages
 * keep compiling until they drop it; new code must not call it.
 */

import { getTeamContext, type TeamContext } from "./auth/team";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";
import type {
  AdminData,
  ConversationsData,
  EvaluationsData,
  KnowledgeData,
  MembersData,
  ShellData,
  PlaybooksData,
  Role,
  StatesData,
  TemplatesData,
  ThreadData,
  UsageData,
  WorkspaceData,
} from "./types";

/* ------------------------------------------------------------------ types */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

export type { ShellData } from "./types";

/* ---------------------------------------------------------------- helpers */

const PLAN_LIMITS: Record<string, number> = { starter: 50, pro: 100, team: 200 };
const PLAN_LABELS: Record<string, string> = { starter: "Starter", pro: "Pro", team: "Team" };
const ROLE_LABELS: Record<string, Role> = { owner: "Admin", admin: "Admin", member: "Editor" };

function planLabel(plan: string | null | undefined): string {
  return PLAN_LABELS[plan ?? "starter"] ?? "Starter";
}
function planLimit(plan: string | null | undefined): number {
  return PLAN_LIMITS[plan ?? "starter"] ?? 50;
}
function roleLabel(role: string | null | undefined): Role {
  return ROLE_LABELS[role ?? "member"] ?? "Editor";
}

function fmtDay(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function fmtTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  return fmtDay(iso);
}
function groupFor(iso: string | null | undefined): "Today" | "This week" | "Earlier" {
  if (!iso) return "Earlier";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  return now.getTime() - d.getTime() < 7 * 86400000 ? "This week" : "Earlier";
}
function cycleBounds(now = new Date()): { start: Date; end: Date; label: string; daysLeft: number } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const label = `${start.toLocaleDateString("en-US", { month: "long", day: "numeric" })} \u2013 ${new Date(end.getTime() - 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;
  return { start, end, label, daysLeft: Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) };
}
function money(n: number): number {
  return Math.round(n * 100) / 100;
}

type Ctx = Omit<TeamContext, "activeTeam"> & {
  activeTeam: NonNullable<TeamContext["activeTeam"]>;
};

/** Resolve the signed-in context; null when signed out / no team / blocked. */
export async function resolveContext(): Promise<Ctx | null> {
  try {
    const ctx = await getTeamContext();
    if (!ctx || "blocked" in ctx || !ctx.activeTeam) return null;
    return ctx as Ctx;
  } catch {
    return null;
  }
}

async function teamRow(teamId: string): Promise<Row | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("teams").select("*").eq("id", teamId).maybeSingle();
  return (data as Row | null) ?? null;
}

async function modelCatalog(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("model_catalog")
    .select("model_id, display_name")
    .eq("enabled", true)
    .order("sort_order");
  const rows = (data as Row[] | null) ?? [];
  if (rows.length === 0) {
    return [
      { id: "cortex-flash", name: "Cortex Flash" },
      { id: "cortex-pro", name: "Cortex Pro" },
    ];
  }
  return rows.map((r) => ({ id: String(r.model_id), name: String(r.display_name) }));
}

async function monthSpend(teamId: string): Promise<number> {
  const supabase = await createClient();
  const { start } = cycleBounds();
  const { data } = await supabase
    .from("usage_daily")
    .select("estimated_cost_usd")
    .eq("team_id", teamId)
    .is("user_id", null)
    .eq("model_id", "*")
    .gte("day", start.toISOString().slice(0, 10));
  const rows = (data as Row[] | null) ?? [];
  if (rows.length > 0) return money(rows.reduce((t, r) => t + Number(r.estimated_cost_usd ?? 0), 0));
  const { data: events } = await supabase
    .from("usage_events")
    .select("estimated_cost_usd")
    .eq("team_id", teamId)
    .gte("created_at", start.toISOString());
  return money(((events as Row[] | null) ?? []).reduce((t, r) => t + Number(r.estimated_cost_usd ?? 0), 0));
}

/** userId -> email via the service-role Admin API (server-only). */
async function emailMap(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    for (const u of data?.users ?? []) if (u.email) map.set(u.id, u.email);
  } catch {
    /* emails are display-only; names still resolve from profiles */
  }
  return map;
}

async function profileNames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, display_name").in("id", ids);
  for (const r of (data as Row[] | null) ?? []) {
    if (r.display_name) map.set(String(r.id), String(r.display_name));
  }
  return map;
}

/* ------------------------------------------------------------- workspace */

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const ctx = await resolveContext();
  const models = await modelCatalog();
  const now = new Date();
  const cycle = cycleBounds(now);
  if (!ctx) {
    return {
      currentUser: { id: "", name: "Signed out", email: "", role: "Viewer", owner: false },
      workspace: {
        id: "", name: "Cortex", slug: "", plan: "Starter", paidSeats: 1,
        monthlyLimit: 50, spend: 0, projectedSpend: 0, perAnswerCeiling: 0.08,
        alertThreshold: 0.9,
        billingCycle: { start: fmtDay(cycle.start.toISOString()), end: fmtDay(cycle.end.toISOString()), label: cycle.label, daysLeft: cycle.daysLeft },
        fixtureNow: now.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
        fixtureDate: fmtDay(now.toISOString()),
        defaultModel: models[0]?.name ?? "Cortex Flash",
        citationRule: "Every claim must be cited", sourceFreshnessDays: 30,
      },
      models,
    };
  }
  const team = await teamRow(ctx.activeTeam.id);
  const spend = await monthSpend(ctx.activeTeam.id);
  const elapsed = Math.max(1, now.getDate());
  const projected = money((spend / elapsed) * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate());
  const defaultModelId = String(team?.default_model_id ?? ctx.profile.defaultModelId ?? "cortex-flash");
  const defaultModel = models.find((m) => m.id === defaultModelId)?.name ?? defaultModelId;
  return {
    currentUser: {
      id: ctx.user.id,
      name: ctx.profile.displayName ?? ctx.user.email?.split("@")[0] ?? "You",
      email: ctx.user.email ?? "",
      role: roleLabel(ctx.membership?.role),
      owner: ctx.membership?.role === "owner",
    },
    workspace: {
      id: ctx.activeTeam.id,
      name: String(team?.name ?? ctx.activeTeam.name),
      slug: String(team?.slug ?? ""),
      plan: planLabel(team?.plan ?? ctx.activeTeam.plan),
      paidSeats: Number(team?.seat_count ?? 1),
      monthlyLimit: planLimit(team?.plan ?? ctx.activeTeam.plan),
      spend,
      projectedSpend: projected,
      perAnswerCeiling: 0.08,
      alertThreshold: 0.9,
      billingCycle: { start: fmtDay(cycle.start.toISOString()), end: fmtDay(new Date(cycle.end.getTime() - 86400000).toISOString()), label: cycle.label, daysLeft: cycle.daysLeft },
      fixtureNow: now.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }),
      fixtureDate: fmtDay(now.toISOString()),
      defaultModel,
      citationRule: "Every claim must be cited",
      sourceFreshnessDays: 30,
    },
    models,
  };
}

/* --------------------------------------------------------------- members */

const ROLE_DEFINITIONS: MembersData["roleDefinitions"] = [
  { role: "Viewer", description: "Reads shared conversations and opens their sources. Cannot ask questions, so costs nothing." },
  { role: "Editor", description: "Asks questions, runs and builds playbooks, uploads documents." },
  { role: "Admin", description: "Everything above, plus members, keys, budgets and billing." },
];

export async function getMembers(): Promise<MembersData> {
  const ctx = await resolveContext();
  const emptyInvite = { name: "", email: "", role: "Editor" as Role, sent: "", expires: "", label: "", status: "" };
  if (!ctx) return { summary: "", members: [], pendingInvite: emptyInvite, roleDefinitions: ROLE_DEFINITIONS, rolesFooter: "Every role change is written to the audit log. A new seat is billed from the day the invite is accepted." };
  const supabase = await createClient();
  const teamId = ctx.activeTeam.id;
  const [{ data: memberRows }, { data: inviteRows }, emails] = await Promise.all([
    supabase.from("team_members").select("*").eq("team_id", teamId).order("created_at"),
    supabase.from("team_invites").select("*").eq("team_id", teamId).is("accepted_at", null).order("created_at", { ascending: false }),
    emailMap(),
  ]);
  const membersRaw = (memberRows as Row[] | null) ?? [];
  const names = await profileNames(membersRaw.map((r) => String(r.user_id)));
  const team = await teamRow(teamId);
  const members: MembersData["members"] = membersRaw
    .filter((r) => r.status !== "deactivated")
    .map((r) => {
      const id = String(r.user_id);
      const name = names.get(id) ?? emails.get(id)?.split("@")[0] ?? "Member";
      const role = roleLabel(r.role);
      return {
        id, name, email: emails.get(id) ?? "", role,
        team: role === "Admin" ? "Operations" : "Workspace",
        detail: r.role === "owner" ? `Owner \u00b7 ${name}` : role,
        lastActive: id === ctx.user.id ? "Now" : fmtTime(r.updated_at ?? r.created_at),
        self: id === ctx.user.id || undefined,
        removable: id !== ctx.user.id && r.role !== "owner" ? true : undefined,
      };
    });
  const invite = ((inviteRows as Row[] | null) ?? [])[0];
  const pendingInvite = invite
    ? {
        name: String(invite.email).split("@")[0] ?? "",
        email: String(invite.email),
        role: roleLabel(invite.role),
        sent: fmtDay(invite.created_at),
        expires: fmtDay(invite.expires_at),
        label: `Invited ${fmtDay(invite.created_at)} \u00b7 expires ${fmtDay(invite.expires_at)}`,
        status: "Not joined",
      }
    : emptyInvite;
  const seats = Number(team?.seat_count ?? members.length);
  return {
    summary: `${seats} paid seat${seats === 1 ? "" : "s"} on the ${planLabel(team?.plan)} plan, ${members.length} in use.${invite ? " One invitation is waiting; it becomes a seat when accepted." : ""}`,
    members,
    pendingInvite,
    roleDefinitions: ROLE_DEFINITIONS,
    rolesFooter: "Every role change is written to the audit log. A new seat is billed from the day the invite is accepted.",
  };
}

/* ---------------------------------------------------------- conversations */

interface ConvAggregate {
  costByConv: Map<string, number>;
  sourcesByConv: Map<string, number>;
}

async function conversationAggregates(teamId: string, convIds: string[]): Promise<ConvAggregate> {
  const costByConv = new Map<string, number>();
  const sourcesByConv = new Map<string, number>();
  if (convIds.length === 0) return { costByConv, sourcesByConv };
  const supabase = await createClient();
  const { data: usage } = await supabase
    .from("usage_events")
    .select("conversation_id, estimated_cost_usd")
    .eq("team_id", teamId)
    .in("conversation_id", convIds);
  for (const r of (usage as Row[] | null) ?? []) {
    const id = String(r.conversation_id);
    costByConv.set(id, (costByConv.get(id) ?? 0) + Number(r.estimated_cost_usd ?? 0));
  }
  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, citations")
    .in("conversation_id", convIds)
    .eq("role", "assistant");
  const docsByConv = new Map<string, Set<string>>();
      if (c.document_id) docIds.add(String(c.document_id));
    }
  }
  const docNames = new Map<string, string>();
  if (docIds.size > 0) {
    const { data: docs } = await supabase.from("documents").select("id, name").in("id", [...docIds]);
    for (const d of (docs as Row[] | null) ?? []) docNames.set(String(d.id), String(d.name));
  }
  const names = await profileNames([String(conv.user_id)]);
  const speaker = names.get(String(conv.user_id)) ?? ctx.profile.displayName ?? "You";

  const notes: ThreadData["notes"] = [];
  const turns: ThreadData["turns"] = [];
  let noteN = 0;
  let pendingQuestion: Row | null = null;
  const pushTurn = (question: Row | null, answer: Row | null) => {
    const cites = answer && Array.isArray(answer.citations) ? (answer.citations as Row[]) : [];
    const segments: Array<{ text: string; footnote?: number }> = [];
    if (answer) {
      segments.push({ text: String(answer.content ?? "") });
      cites.forEach((c, i) => {
        noteN += 1;
        const docTitle = docNames.get(String(c.document_id)) ?? String(c.label ?? "Source");
        notes.push({
          id: `note-${noteN}`,
          n: noteN,
          paragraphId: `turn-${turns.length + 1}`,
          documentTitle: docTitle,
          catalog: "Knowledge base",
          meta: `Match ${Number(c.score ?? 0).toFixed(2)}`,
          excerpt: [{ text: String(c.excerpt ?? c.label ?? docTitle) }],
          passageHref: c.document_id ? `/app/knowledge/documents/${String(c.document_id)}` : undefined,
        });
        segments.push({ text: "", footnote: i + 1 });
      });
    }
    const tokens = answer ? Number(answer.prompt_tokens ?? 0) + Number(answer.completion_tokens ?? 0) : 0;
    turns.push({
      id: String((answer ?? question)?.id ?? `turn-${turns.length + 1}`),
      speaker,
      time: fmtTime((question ?? answer)?.created_at),
      question: question ? String(question.content ?? "") : "",
      answer: {
        heading: "",
        blocks: answer ? [{ type: "paragraph", segments }] : [],
        footer: answer
          ? { tokens: `${tokens.toLocaleString()} tokens`, duration: answer.total_duration_ms ? `${(Number(answer.total_duration_ms) / 1000).toFixed(1)} s` : "—", cost: 0, citedLabel: cites.length > 0 ? "every claim cited" : "no citations" }
          : null,
      },
    });
  };
  for (const m of messages) {
    if (m.role === "user") {
      if (pendingQuestion) pushTurn(pendingQuestion, null);
      pendingQuestion = m;
    } else if (m.role === "assistant") {
      pushTurn(pendingQuestion, m);
      pendingQuestion = null;
    }
  }
  if (pendingQuestion) pushTurn(pendingQuestion, null);

  const { data: kbs } = await supabase.from("knowledge_bases").select("name").eq("team_id", teamId).is("deleted_at", null);
  const kbNames = ((kbs as Row[] | null) ?? []).map((k) => String(k.name));
  const models = await modelCatalog();
  const modelName = models.find((m) => m.id === String(conv.model_id))?.name ?? String(conv.model_id ?? "Cortex Flash");
  return {
    id: convId,
    header: {
      title: String(conv.title ?? "Conversation"),
      meta: `${notes.length > 0 ? `${new Set(notes.map((n) => n.documentTitle)).size} sources \u00b7 ` : ""}${modelName}`,
      project: String(conv.folder ?? "Unfiled"),
      edited: `Edited ${fmtTime(conv.last_message_at ?? conv.updated_at)}`,
    },
    turns,
    notes,
    composer: {
      sources: kbNames.join(", ") || "No collections yet",
      playbook: "No playbook",
      model: modelName,
      costSentence: "Replies are generated from your documents and costed in Usage.",
      placeholder: "Ask a follow-up",
    },
    ...THREAD_VARIANTS,
  };
}

/* ------------------------------------------------------------- playbooks */

function playbookRow(r: Row, names: Map<string, string>): PlaybooksData["team"][number] {
  return {
    id: String(r.id),
    name: String(r.name),
    owner: names.get(String(r.author_id)) ?? undefined,
    runs: Number(r.run_count ?? 0),
    updated: fmtDay(r.updated_at),
    description: String(r.description ?? "") || undefined,
    inputsLabel: Array.isArray(r.variables) ? `${(r.variables as Row[]).length} inputs` : undefined,
  };
}

function editBlock(r: Row | null, kbNames: string[]): PlaybooksData["edit"] {
  const variables = r && Array.isArray(r.variables) ? (r.variables as Row[]) : [];
  return {
    instructions: r ? String(r.prompt_body ?? "") : "",
    inputs: variables.map((v) => ({
      input: String(v.name ?? v.label ?? "input"),
      type: "Text",
      required: Boolean(v.required),
      example: String(v.default_value ?? v.defaultValue ?? ""),
    })),
    sources: kbNames.map((label, i) => ({ label, state: (i === 0 ? "checked" : "unchecked") as "checked" | "unchecked" })),
    checks: [
      { label: "Every claim cited", checked: true },
      { label: "Sources under 30 days old", checked: false },
    ],
    sharing: {
      selected: r ? String(r.visibility ?? "personal") : "personal",
      options: [
        { value: "personal", label: "Only me" },
        { value: "team", label: "Whole team" },
      ],
    },
    preview: r ? String(r.prompt_body ?? "").slice(0, 240) : "",
    testRunCost: 0,
    changesSincePrevious: [],
    version: r ? `v${Number(r.version ?? 1)}` : "v1",
    liveVersion: r ? `v${Number(r.version ?? 1)}` : "v1",
    savedNote: r ? `Saved \u00b7 ${fmtDay(r.updated_at)}` : "",
  };
}

export async function getPlaybooks(): Promise<PlaybooksData> {
  const ctx = await resolveContext();
  const blankFeatured: PlaybooksData["featured"] = {
    id: "", name: "No playbooks yet", runs: 0, updated: "", instructions: "", inputs: "", sources: "", checks: "", passRate: "",
  };
  if (!ctx) return { featured: blankFeatured, team: [], private: [], archived: [], edit: editBlock(null, []) };
  const supabase = await createClient();
  const teamId = ctx.activeTeam.id;
  const [{ data }, { data: archivedData }, { data: kbs }] = await Promise.all([
    supabase.from("prompt_templates").select("*").eq("team_id", teamId).is("deleted_at", null).order("updated_at", { ascending: false }),
    supabase.from("prompt_templates").select("*").eq("team_id", teamId).not("deleted_at", "is", null).order("updated_at", { ascending: false }),
    supabase.from("knowledge_bases").select("name").eq("team_id", teamId).is("deleted_at", null),
  ]);
  const rows = (data as Row[] | null) ?? [];
  const names = await profileNames([...new Set(rows.map((r) => String(r.author_id)))]);
  const kbNames = ((kbs as Row[] | null) ?? []).map((k) => String(k.name));
  const featuredRow = rows.find((r) => r.featured) ?? rows.find((r) => r.visibility === "team") ?? rows[0] ?? null;
  const featured: PlaybooksData["featured"] = featuredRow
    ? {
        ...playbookRow(featuredRow, names),
        instructions: String(featuredRow.prompt_body ?? ""),
        inputs: Array.isArray(featuredRow.variables) ? `${(featuredRow.variables as Row[]).length} inputs` : "0 inputs",
        sources: kbNames.join(", "),
        checks: "Every claim cited",
        passRate: "",
      }
    : blankFeatured;
  return {
    featured,
    team: rows.filter((r) => r.visibility === "team" && String(r.id) !== featured.id).map((r) => playbookRow(r, names)),
    private: rows.filter((r) => r.visibility !== "team" && String(r.author_id) === ctx.user.id).map((r) => playbookRow(r, names)),
    archived: ((archivedData as Row[] | null) ?? []).map((r) => ({
      ...playbookRow(r, names),
      status: `Archived ${fmtDay(r.deleted_at)}`,
    })),
    edit: editBlock(featuredRow, kbNames),
  };
}

export async function getPlaybook(id: string) {
  const ctx = await resolveContext();
  if (!ctx) return undefined;
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", id)
    .eq("team_id", ctx.activeTeam.id)
    .maybeSingle();
  if (!data) return undefined;
  const names = await profileNames([String((data as Row).author_id)]);
  return playbookRow(data as Row, names);
}

/** Full edit DTO for one template (used by the edit page). */
export async function getPlaybookEdit(id: string) {
  const ctx = await resolveContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("prompt_templates")
    .select("*")
    .eq("id", id)
    .eq("team_id", ctx.activeTeam.id)
    .maybeSingle();
  if (!data) return null;
  const row = data as Row;
  const { data: kbs } = await supabase.from("knowledge_bases").select("name").eq("team_id", ctx.activeTeam.id).is("deleted_at", null);
  const kbNames = ((kbs as Row[] | null) ?? []).map((k) => String(k.name));
  return { id: String(row.id), name: String(row.name), edit: editBlock(row, kbNames) };
}

/* -------------------------------------------------------------- knowledge */

function docStatus(status: string): "indexed" | "indexing" | "failed" | "stale" {
  if (status === "ready") return "indexed";
  if (status === "failed" || status === "quarantined") return "failed";
  return "indexing";
}

export async function getKnowledge(): Promise<KnowledgeData> {
  const ctx = await resolveContext();
  const emptyAsk: KnowledgeData["ask"] = {
    collectionId: "", collectionLabel: "", question: "", answerHeading: "",
    answerBlocks: [], answerMeta: "",
    search: { top: 8, minimumMatch: 0.7, freshnessDays: 30, reranking: true },
    traceIntro: "", trace: [],
  };
  const emptyInspector: KnowledgeData["inspector"] = {
    documentId: "", documentTitle: "", collectionName: "", totalPassages: 0,
    splitting: "", indexedLabel: "", sectionHeading: "", passages: [],
    selectedPassage: { number: 0, tokens: 0, page: "", heading: "", usage: "" },
  };
  if (!ctx) {
    return { summary: "", collections: [], documents: [], needsAttention: [], evaluationLine: { label: "", detail: "", actionLabel: "" }, ask: emptyAsk, inspector: emptyInspector };
  }
  const supabase = await createClient();
  const teamId = ctx.activeTeam.id;
  const [{ data: kbRows }, { data: docRows }] = await Promise.all([
    supabase.from("knowledge_bases").select("*").eq("team_id", teamId).is("deleted_at", null).order("created_at"),
    supabase.from("documents").select("*").eq("team_id", teamId).order("created_at", { ascending: false }),
  ]);
  const kbs = (kbRows as Row[] | null) ?? [];
  const docs = (docRows as Row[] | null) ?? [];
  const kbName = new Map(kbs.map((k) => [String(k.id), String(k.name)]));
  const names = await profileNames([...new Set(docs.map((d) => String(d.uploaded_by)))]);

  const collections: KnowledgeData["collections"] = kbs.map((kb) => {
    const kbDocs = docs.filter((d) => String(d.kb_id) === String(kb.id));
    const passages = kbDocs.reduce((t, d) => t + Number(d.chunk_count ?? 0), 0);
  
    const newest = kbDocs.map((d) => String(d.updated_at ?? "")).sort().at(-1);
    const failed = kbDocs.some((d) => d.status === "failed");
    const indexing = kbDocs.some((d) => d.status === "queued" || d.status === "processing");
    return {
      id: String(kb.id),
      name: String(kb.name),
      description: String(kb.description ?? ""),
      owner: names.get(String(kb.created_by)) ?? "",
      documents: kbDocs.length,
      passages,
      newest: newest ? fmtDay(newest) : "—",
      cited30d: null,
      status: failed
        ? { type: "stale" as const, label: "Needs attention", note: "A document failed to index." }
        : indexing
          ? { type: "indexing" as const, label: "Indexing", percent: 50 }
          : { type: "current" as const, label: "Current" },
    };
  });

  const documents: KnowledgeData["documents"] = docs.map((d) => ({
    id: String(d.id),
    title: String(d.name),
    collection: kbName.get(String(d.kb_id)) ?? "",
    passages: d.chunk_count === null || d.chunk_count === undefined ? null : Number(d.chunk_count),
    status: docStatus(String(d.status)),
    updated: fmtDay(d.updated_at),
    format: String(d.mime_type ?? d.source_type ?? "document"),
    owner: names.get(String(d.uploaded_by)) ?? "",
    statusDetail: d.status_error ? String(d.status_error) : undefined,
  }));

  const needsAttention = documents
    .filter((d) => d.status === "failed")
    .map((d) => ({ label: d.title, detail: d.statusDetail ?? "Indexing failed.", actionLabel: "Inspect" }));

  // Inspector: first document with chunks.
  let inspector = emptyInspector;
  const firstDoc = docs[0];
  if (firstDoc) {
    const { data: chunkRows } = await supabase
      .from("document_chunks")
      .select("*")
      .eq("document_id", String(firstDoc.id))
      .order("chunk_index")
      .limit(50);
    const chunks = (chunkRows as Row[] | null) ?? [];
    const first = chunks[0];
    inspector = {
      documentId: String(firstDoc.id),
      documentTitle: String(firstDoc.name),
      collectionName: kbName.get(String(firstDoc.kb_id)) ?? "",
      totalPassages: chunks.length,
      splitting: "Split on headings, then by token window",
      indexedLabel: fmtDay(firstDoc.updated_at),
      sectionHeading: first ? String((first.metadata as Row | null)?.section_heading ?? "Passages") : "Passages",
      passages: chunks.map((c, i) => ({
        number: i + 1,
        text: String(c.content ?? ""),
        selected: i === 0 || undefined,
      })),
      selectedPassage: first
        ? {
            number: 1,
            tokens: Number(first.token_count ?? 0),
            page: String((first.metadata as Row | null)?.page ?? "—"),
            heading: String((first.metadata as Row | null)?.section_heading ?? ""),
            usage: "Cited in answers from this workspace.",
          }
        : emptyInspector.selectedPassage,
    };
  }

  const firstKb = kbs[0];
  const totalDocs = documents.length;
    const totalPassages = collections.reduce((t, c) => t + c.passages, 0);
  return {
    summary: `${collections.length} knowledge base${collections.length === 1 ? "" : "s"} \u00b7 ${totalDocs} documents \u00b7 ${totalPassages.toLocaleString()} passages your answers can cite.`,
    collections,
    documents,
    needsAttention,
    evaluationLine: { label: "Evaluations", detail: "Retrieval quality is checked against your evaluation sets.", actionLabel: "Open evaluations" },
    ask: {
      ...emptyAsk,
      collectionId: firstKb ? String(firstKb.id) : "",
      collectionLabel: firstKb ? `${String(firstKb.name)} \u00b7 ${documents.filter((d) => d.collection === String(firstKb.name)).length} documents` : "",
      search: firstKb
        ? { top: Number(firstKb.retrieval_top_k ?? 8), minimumMatch: Number(firstKb.similarity_threshold ?? 0.25), freshnessDays: 30, reranking: true }
        : emptyAsk.search,
    },
    inspector,
  };
}

export async function getCollection(id: string) {
  const data = await getKnowledge();
  return data.collections.find((c) => c.id === id);
}

export async function getDocument(id: string) {
  const data = await getKnowledge();
  return data.documents.find((d) => d.id === id);
}

/** Inspector DTO for one document (used by the document detail page). */
export async function getDocumentInspector(id: string) {
  const ctx = await resolveContext();
  if (!ctx) return null;
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("*").eq("id", id).eq("team_id", ctx.activeTeam.id).maybeSingle();
  if (!doc) return null;
  const row = doc as Row;
  const knowledge = await getKnowledge();
  const { data: chunkRows } = await supabase.from("document_chunks").select("*").eq("document_id", id).order("chunk_index").limit(200);
  const chunks = (chunkRows as Row[] | null) ?? [];
  const first = chunks[0];
  return {
    document: knowledge.documents.find((d) => d.id === id) ?? null,
    inspector: {
      documentId: id,
      documentTitle: String(row.name),
      collectionName: knowledge.documents.find((d) => d.id === id)?.collection ?? "",
      totalPassages: chunks.length,
      splitting: "Split on headings, then by token window",
      indexedLabel: fmtDay(row.updated_at),
      sectionHeading: first ? String((first.metadata as Row | null)?.section_heading ?? "Passages") : "Passages",
      passages: chunks.map((c, i) => ({ number: i + 1, text: String(c.content ?? ""), selected: i === 0 || undefined })),
      selectedPassage: first
        ? { number: 1, tokens: Number(first.token_count ?? 0), page: String((first.metadata as Row | null)?.page ?? "—"), heading: String((first.metadata as Row | null)?.section_heading ?? ""), usage: "Cited in answers from this workspace." }
        : { number: 0, tokens: 0, page: "", heading: "", usage: "" },
    } satisfies KnowledgeData["inspector"],
  };
}

/* ----------------------------------------------------------------- usage */

export async function getUsage(): Promise<UsageData> {
  const ctx = await resolveContext();
  const cycle = cycleBounds();
  if (!ctx) {
    return { summary: "", cycleLabel: cycle.label, chartCaption: "", series: [], projection: { date: "", value: 0 }, byProject: [], byModel: [], byPerson: [], marginActions: [] };
  }
  const supabase = await createClient();
  const teamId = ctx.activeTeam.id;
  const team = await teamRow(teamId);
  const limit = planLimit(team?.plan);
  const { data: daily } = await supabase
    .from("usage_daily")
    .select("*")
    .eq("team_id", teamId)
    .is("user_id", null)
    .order("day");
  const dailyRows = ((daily as Row[] | null) ?? []).filter((r) => String(r.model_id) === "*");
  // Cumulative series sampled at up to 5 points.
  let running = 0;
  const cumulative = dailyRows.map((r) => {
    running += Number(r.estimated_cost_usd ?? 0);
    return { date: fmtDay(String(r.day)), value: money(running) };
  });
  const series = cumulative.length <= 5
    ? [{ date: fmtDay(cycle.start.toISOString()), value: 0 }, ...cumulative]
    : [cumulative[0]!, cumulative[Math.floor(cumulative.length / 4)]!, cumulative[Math.floor(cumulative.length / 2)]!, cumulative[Math.floor((cumulative.length * 3) / 4)]!, cumulative[cumulative.length - 1]!];
  const total = money(running);
  const elapsedDays = Math.max(1, Math.round((Date.now() - cycle.start.getTime()) / 86400000));
  const projected = money(total + (total / elapsedDays) * cycle.daysLeft);

  const { data: events } = await supabase.from("usage_events").select("*").eq("team_id", teamId).order("created_at", { ascending: false }).limit(2000);
  const eventRows = (events as Row[] | null) ?? [];
  const models = await modelCatalog();
  const modelName = (id: string) => models.find((m) => m.id === id)?.name ?? id;

  const byModelMap = new Map<string, number>();
  const byPersonMap = new Map<string, number>();
  const byConv = new Map<string, { amount: number; prompt: number; completion: number }>();
  for (const e of eventRows) {
    byModelMap.set(modelName(String(e.model_id)), (byModelMap.get(modelName(String(e.model_id))) ?? 0) + Number(e.estimated_cost_usd ?? 0));
    const personKey = e.api_key_id ? "API keys" : String(e.user_id);
    byPersonMap.set(personKey, (byPersonMap.get(personKey) ?? 0) + Number(e.estimated_cost_usd ?? 0));
    if (e.conversation_id) {
      const row = byConv.get(String(e.conversation_id)) ?? { amount: 0, prompt: 0, completion: 0 };
      row.amount += Number(e.estimated_cost_usd ?? 0);
      row.prompt += Number(e.prompt_tokens ?? 0);
      row.completion += Number(e.completion_tokens ?? 0);
      byConv.set(String(e.conversation_id), row);
    }
  }
  const personNames = await profileNames([...byPersonMap.keys()].filter((k) => k !== "API keys"));
  const convData = await getConversations();
  const folderOf = new Map(convData.conversations.map((c) => [c.id, c.project]));
  const byProjectMap = new Map<string, { amount: number; conversations: number; prompt: number; completion: number }>();
  for (const [convId, agg] of byConv) {
    const folder = folderOf.get(convId) ?? "Unfiled";
    const row = byProjectMap.get(folder) ?? { amount: 0, conversations: 0, prompt: 0, completion: 0 };
    row.amount += agg.amount; row.conversations += 1; row.prompt += agg.prompt; row.completion += agg.completion;
    byProjectMap.set(folder, row);
  }
  return {
    summary: `$${total.toFixed(0)} of the $${limit} limit is spent with ${cycle.daysLeft} days left in the cycle.`,
    cycleLabel: `Billing cycle ${cycle.label} \u00b7 updated ${fmtTime(new Date().toISOString())}`,
    chartCaption: "Spend so far this cycle. The dotted segment projects this week's rate to the end of the cycle.",
    series: series.length > 0 ? series : [{ date: fmtDay(cycle.start.toISOString()), value: 0 }],
    projection: { date: fmtDay(new Date(cycle.end.getTime() - 86400000).toISOString()), value: projected },
    byProject: [...byProjectMap.entries()].map(([name, r]) => ({
      name, detail: `${r.conversations} conversation${r.conversations === 1 ? "" : "s"}`, amount: money(r.amount),
      conversations: r.conversations, tokensK: Math.round((r.prompt + r.completion) / 1000) || null,
      writtenTokens: r.completion, readTokens: r.prompt,
    })),
    byModel: [...byModelMap.entries()].map(([name, amount]) => ({ name, amount: money(amount), median: "—" })),
    byPerson: [...byPersonMap.entries()].map(([key, amount]) => ({ name: key === "API keys" ? "API keys" : (personNames.get(key) ?? "Member"), amount: money(amount) })),
    marginActions: [
      { label: "Cap answers at $0.05 until the cycle resets", description: "Long answers may stop early." },
      { label: `Raise this cycle's limit`, description: "Plan changes are recorded on the workspace; billing is not charged in-app." },
      { label: "Do nothing", description: `New answers pause at $${limit}; reading and citations keep working.` },
    ],
  };
}

/* ------------------------------------------------------------ evaluations */

export async function getEvaluations(): Promise<EvaluationsData> {
  const ctx = await resolveContext();
  if (!ctx) return { summary: "", set: { name: "", questions: 0, edited: "", schedule: "" }, runs: [], runsNote: "", failures: [], otherSets: [], runCost: 0 };
  const supabase = await createClient();
  const teamId = ctx.activeTeam.id;
  const { data: kbs } = await supabase.from("knowledge_bases").select("*").eq("team_id", teamId).is("deleted_at", null).order("created_at");
  const kbRows = (kbs as Row[] | null) ?? [];
  if (kbRows.length === 0) {
    return { summary: "Add a knowledge base and evaluation questions to start checking retrieval quality.", set: { name: "No evaluation set yet", questions: 0, edited: "", schedule: "runs nightly at 2 AM" }, runs: [], runsNote: "", failures: [], otherSets: [], runCost: 0 };
  }
  const primary = kbRows[0]!;
  const sets: Array<{ kb: Row; questions: number; runs: Row[] }> = [];
  for (const kb of kbRows) {
    const [{ count }, { data: runs }] = await Promise.all([
      supabase.from("eval_cases").select("id", { count: "exact", head: true }).eq("kb_id", String(kb.id)),
      supabase.from("eval_runs").select("*").eq("kb_id", String(kb.id)).order("created_at", { ascending: false }).limit(5),
    ]);
    sets.push({ kb, questions: count ?? 0, runs: (runs as Row[] | null) ?? [] });
  }
  const primarySet = sets[0]!;
  const latest = primarySet.runs[0];
  const failures: EvaluationsData["failures"] = [];
  const details = latest && Array.isArray(latest.details) ? (latest.details as Row[]) : [];
  details.filter((d) => d.passed === false || d.status === "failed").slice(0, 5).forEach((d, i) => {
    failures.push({
      id: String(d.id ?? d.case_id ?? `Q${i + 1}`),
      tag: "Failed check",
      question: String(d.question ?? ""),
      expected: String(d.expected ?? d.expected_answer ?? ""),
      got: String(d.got ?? d.actual ?? ""),
      why: String(d.why ?? d.reason ?? "The retrieved passages did not support the expected answer."),
      fixLabel: "Inspect passage",
      actions: ["Inspect passage"],
    });
  });
  return {
    summary: latest
      ? `Latest run: ${Number(latest.cases_passed ?? 0)} of ${Number(latest.cases_total ?? primarySet.questions)} questions passed.`
      : "No evaluation runs yet for this set.",
    set: { name: String(primary.name), questions: primarySet.questions, edited: fmtDay(primary.updated_at), schedule: "runs nightly at 2 AM" },
    runs: primarySet.runs.map((r) => ({ date: fmtDay(r.created_at), passed: Number(r.cases_passed ?? 0), cost: 0 })),
    runsNote: "",
    failures,
    otherSets: sets.slice(1).map((s) => ({
      name: String(s.kb.name),
      questions: s.questions,
      latest: s.runs[0] ? `${Number(s.runs[0].cases_passed ?? 0)} passed ${fmtDay(s.runs[0].created_at)}` : "No runs yet",
    })),
    runCost: 0,
  };
}

/* -------------------------------------------------------------- templates */

/**
 * Public gallery: reads via the service-role (admin) client — server-only,
 * the key never reaches the client — the OWNER team's featured/team
 * templates. The owner is xoppersk@gmail.com (W1's create-owner script);
 * if that account is absent we fall back to whichever team has featured
 * templates, so the public page never hard-fails.
 */
export async function getTemplates(): Promise<TemplatesData> {
  const empty: TemplatesData = {
    categories: [{ name: "All", count: 0 }],
    featured: { id: "", name: "No featured template yet", category: "General" },
    templates: [],
  };
  try {
    const admin = createAdminClient();
    let ownerTeamId: string | null = null;
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const owner = users?.users.find((u) => u.email === "xoppersk@gmail.com");
    if (owner) {
      const { data: membership } = await admin
        .from("team_members")
        .select("team_id")
        .eq("user_id", owner.id)
        .eq("role", "owner")
        .limit(1)
        .maybeSingle();
      ownerTeamId = membership ? String((membership as Row).team_id) : null;
    }
    let query = admin
      .from("prompt_templates")
      .select("*")
      .is("deleted_at", null)
      .order("run_count", { ascending: false })
      .limit(50);
    if (ownerTeamId) query = query.eq("team_id", ownerTeamId);
    else query = query.eq("featured", true);
    const { data } = await query;
    let rows = (data as Row[] | null) ?? [];
    if (rows.length === 0 && ownerTeamId) {
      const { data: fallback } = await admin.from("prompt_templates").select("*").eq("featured", true).is("deleted_at", null).limit(50);
      rows = (fallback as Row[] | null) ?? [];
    }
    if (rows.length === 0) return empty;
    const toItem = (r: Row): TemplatesData["templates"][number] => ({
      id: String(r.id),
      name: String(r.name),
      category: String(r.category ?? "General"),
      description: String(r.description ?? "") || undefined,
      expects: undefined,
      copied: r.run_count ? `${Number(r.run_count).toLocaleString()} runs` : undefined,
      instructions: String(r.prompt_body ?? "") || undefined,
      inputs: Array.isArray(r.variables) ? `${(r.variables as Row[]).length}` : undefined,
      sources: undefined,
      checks: "Every answer cited",
      runs: r.run_count ? String(r.run_count) : undefined,
      typicalRun: undefined,
    });
    const featuredRow = rows.find((r) => r.featured) ?? rows[0]!;
    const categories = new Map<string, number>();
    for (const r of rows) categories.set(String(r.category ?? "General"), (categories.get(String(r.category ?? "General")) ?? 0) + 1);
    return {
      categories: [{ name: "All", count: rows.length }, ...[...categories.entries()].map(([name, count]) => ({ name, count }))],
      featured: toItem(featuredRow),
      templates: rows.map(toItem),
    };
  } catch {
    return empty;
  }
}

/* ------------------------------------------------------------ admin data */

export async function getAdminData(): Promise<AdminData> {
  const ctx = await resolveContext();
  const ws = await getWorkspaceData();
  const members = await getMembers();
  const spend = ws.workspace.spend;
  const limit = ws.workspace.monthlyLimit;
  const teamId = ctx?.activeTeam.id ?? "";
  const supabase = await createClient();

  let keyRows: Row[] = [];
  let auditRows: Row[] = [];
  if (ctx) {
    const [{ data: keys }, { data: audit }] = await Promise.all([
      supabase.from("api_keys").select("*").eq("team_id", teamId).is("revoked_at", null).order("created_at", { ascending: false }),
      supabase.from("audit_log").select("*").eq("team_id", teamId).order("created_at", { ascending: false }).limit(50),
    ]);
    keyRows = (keys as Row[] | null) ?? [];
    auditRows = (audit as Row[] | null) ?? [];
  }
  const actorNames = await profileNames([...new Set(auditRows.map((r) => String(r.actor_id)))]);
  const auditGroupsMap = new Map<string, Row[]>();
  for (const r of auditRows) {
    const day = new Date(String(r.created_at)).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    auditGroupsMap.set(day, [...(auditGroupsMap.get(day) ?? []), r]);
  }

  const plan = ws.workspace.plan;
  const seats = ws.workspace.paidSeats;
  const perSeat = plan === "Team" ? 30 : plan === "Pro" ? 18 : 0;
  const cycle = cycleBounds();

  const admin = {
    apiKeys: {
      summary: "Keys let other tools ask Cortex questions. Each one is limited to what it needs and counts toward the same spending limit. Only a hash of each key is stored — the full key is shown once, at creation.",
      reveal: {
        heading: "Create a key to reveal it here.",
        body: "This is the only time the full key is shown. If you lose it, revoke it and create another.",
        label: "New API key",
        key: "",
        can: "Ask questions, read sources",
        cannot: "Upload, change settings",
        expires: "Set at creation",
      },
      rows: keyRows.map((r) => ({
        id: String(r.id),
        name: String(r.name),
        masked: `${String(r.key_prefix ?? "cxk_")}\u2026`,
        createdNote: `created ${fmtDay(r.created_at)}`,
        access: Array.isArray(r.scopes) ? (r.scopes as string[]).join(", ") : "chat",
        lastUsed: r.last_used_at ? fmtTime(r.last_used_at) : "Never",
        ...(r.expires_at ? { expiresNote: `Expires ${fmtDay(r.expires_at)}` } : {}),
        cost: null,
      })),
      footer: "Revoking is immediate and permanent, and is recorded in the audit log. Calls made with a revoked key are refused with a 401 error.",
      footerSegments: [
        { text: "Revoking is immediate and permanent, and is recorded in the " },
        { text: "audit log", href: "/settings/audit" },
        { text: ". Calls made with a revoked key are refused with a 401 error." },
      ],
    },
    audit: {
      summary: "Every change to people, keys, settings and shared work. Entries cannot be edited or deleted.",
      totalEntries: auditRows.length,
      filters: {
        who: ["Everyone", ...[...new Set(auditRows.map((r) => actorNames.get(String(r.actor_id)) ?? "Member"))]],
        what: ["All changes", "Members and roles", "API keys", "Settings", "Exports"],
        when: ["Last 7 days", "Last 30 days", "Custom range"],
      },
      groups: [...auditGroupsMap.entries()].map(([day, entries]) => ({
        day,
        entries: entries.map((r) => ({
          time: fmtTime(r.created_at),
          actor: actorNames.get(String(r.actor_id)) ?? "Member",
          sentence: String(r.action),
          category: String(r.target_type ?? "Settings"),
          date: String(r.created_at).slice(0, 10),
          sentenceSegments: [{ text: String(r.action) }],
        })),
      })),
      notShown: "Questions and answers themselves. Those stay in each conversation, visible to the people it is shared with. Streaming this log to Splunk or Datadog is part of Enterprise.",
      notShownSegments: [
        { text: "Questions and answers themselves. Those stay in each conversation, visible to the people it is shared with. Streaming this log to Splunk or Datadog is part of " },
        { text: "Enterprise", href: "/settings/billing" },
        { text: "." },
      ],
    },
    billing: {
      summary: `${plan} plan, ${seats} seat${seats === 1 ? "" : "s"}. Model use so far this cycle is $${spend.toFixed(2)} of the $${limit} limit. No payment method is connected — plan changes are recorded on the workspace and no charge is made.`,
      summarySegments: [
        { text: `${plan} plan, ${seats} seat${seats === 1 ? "" : "s"}. Model use so far is ` },
        { text: `$${spend.toFixed(2)}`, bold: true },
        { text: ` of the $${limit} limit. No card is charged in-app.` },
      ],
      card: {
        warning: "No payment method on file. Plan changes are recorded as intent only until billing is connected.",
        detail: "No card on file \u00b7 expires —",
        receiptsEmail: ctx?.user.email ?? "",
      },
      nextInvoice: {
        heading: "Next invoice, so far",
        lines: [
          { label: `${seats} seats × $${perSeat}`, detail: cycle.label, amount: `$${(seats * perSeat).toFixed(2)}` },
          {
            label: "Model use this cycle",
            detail: `Capped at your $${limit} limit \u00b7 see usage`,
            amount: `$${spend.toFixed(2)}`,
            detailSegments: [{ text: `Capped at your $${limit} limit \u00b7 ` }, { text: "see usage", href: "/app/usage" }],
          },
        ],
        totalLabel: "Total so far",
        total: `$${(seats * perSeat + spend).toFixed(2)}`,
      },
      plan: {
        heading: "Plan",
        body: `${plan} \u00b7 $${perSeat} per seat per month, model use at cost up to your limit. Enterprise adds single sign-on, custom retention and audit export. Priced per contract.`,
        actionLabel: "Talk to sales",
        bodySegments: [
          { text: plan, strong: true },
          { text: ` \u00b7 $${perSeat} per seat per month, model use at cost up to your limit. ` },
          { text: "Enterprise", strong: true },
          { text: " adds single sign-on, custom retention and audit export. Priced per contract." },
        ],
      },
      pastInvoices: [],
    },
    profile: {
      name: ws.currentUser.name,
      email: ws.currentUser.email,
      teamLabel: ws.workspace.name,
      profileNote: "Your name and team label appear on shared conversations and in the audit log.",
      notifications: [
        { label: "Someone shares a conversation or playbook with me", checked: true },
        { label: "A playbook I own fails its checks", checked: true },
        { label: "Workspace spending crosses the alert level \u00b7 admins only", checked: true },
        { label: "Every Monday, with last week's usage and evaluation results", checked: false },
      ],
      notificationsNote: "Mentions in a conversation always notify you in the app.",
      reading: {
        appearance: "Light",
        textSize: "Comfortable \u00b7 18",
        textSizeOptions: ["Comfortable \u00b7 18", "Compact \u00b7 16", "Large \u00b7 20"],
        sourcePlacement: "In the margin",
        sourcePlacementOptions: ["In the margin", "Below each answer"],
      },
      sessions: [{ name: "Current session", place: "", when: "Now" }],
      twoStepNote: "Two-step verification is managed with your account provider.",
    },
    workspaceSettings: {
      unsavedChanges: 0,
      identity: {
        name: ws.workspace.name,
        slug: ws.workspace.slug,
        addressPrefix: "cortex.app/",
        addressNote: "Changing the address breaks links people have already bookmarked. Old links redirect for 30 days.",
      },
      answerDefaults: {
        model: ws.workspace.defaultModel,
        modelOptions: ws.models.map((m) => m.name),
        citationRule: ws.workspace.citationRule,
        citationOptions: ["Every claim must be cited", "Cite when available"],
        sourceFreshnessDays: ws.workspace.sourceFreshnessDays,
        perAnswerCeiling: "$0.08",
        perAnswerNote: "changed from $0.10",
        note: "These apply to new conversations. Playbooks keep their own settings.",
      },
      spending: {
        monthlyLimit: `$${limit}`,
        alertThreshold: "90",
        allowEditorsRaise: true,
        allowEditorsLabel: "Let editors raise the per-answer limit for one conversation, up to $0.25",
        note: `At the limit, new answers pause. Reading, sharing and citations keep working. $${spend.toFixed(0)} is spent so far this cycle.`,
      },
      retention: {
        conversations: "1 year",
        conversationsOptions: ["2 years", "1 year", "Forever"],
        passages: "7 years",
        passagesOptions: ["7 years", "Same as conversation"],
        note: "Cited passages are stored as they were when the answer was written, so an old answer still shows what it relied on even after the document changes.",
      },
      signIn: {
        options: [
          { label: "Require two-step verification for admins", checked: true },
          { label: "Single sign-on with Okta, Entra or Google \u00b7 Enterprise plan", checked: false, disabled: true, labelSegments: [{ text: "Single sign-on with Okta, Entra or Google \u00b7 " }, { text: "Enterprise plan", href: "/settings/billing" }] },
        ],
        note: "Domain joins count as seats only once someone is promoted to Editor.",
      },
      deleteWorkspace: {
        body: `Removes this workspace's conversations, playbooks and documents for everyone. This cannot be undone.`,
        buttonLabel: `Delete ${ws.workspace.name} workspace`,
        note: "Export first from Audit log or each conversation's menu.",
        noteSegments: [{ text: "Export first from " }, { text: "Audit log", href: "/settings/audit" }, { text: " or each conversation's menu." }],
      },
    },
  };
  void members;
  return admin as unknown as AdminData;
}

/* ------------------------------------------------- shell + computed totals */

export async function getShellData(): Promise<ShellData> {
  const ctx = await resolveContext();
  if (!ctx) {
    return { workspaceName: "Cortex", plan: "Starter", userName: "", userEmail: "", conversationCount: 0, playbookCount: 0, documentCount: 0, memberCount: 0, apiKeyCount: 0, recent: [], spend: 0, monthlyLimit: 50, spendCaption: "" };
  }
  const teamId = ctx.activeTeam.id;
  const supabase = await createClient();
  const [ws, convs, spend] = await Promise.all([getWorkspaceData(), getConversations(), monthSpend(teamId)]);
  const [{ count: playbookCount }, { count: documentCount }, { count: memberCount }, { count: apiKeyCount }] = await Promise.all([
    supabase.from("prompt_templates").select("id", { count: "exact", head: true }).eq("team_id", teamId).is("deleted_at", null),
    supabase.from("documents").select("id", { count: "exact", head: true }).eq("team_id", teamId),
    supabase.from("team_members").select("id", { count: "exact", head: true }).eq("team_id", teamId).eq("status", "active"),
    supabase.from("api_keys").select("id", { count: "exact", head: true }).eq("team_id", teamId).is("revoked_at", null),
  ]);
  const limit = ws.workspace.monthlyLimit;
  const pct = limit > 0 ? Math.round((spend / limit) * 100) : 0;
  return {
    workspaceName: ws.workspace.name,
    plan: ws.workspace.plan,
    userName: ws.currentUser.name,
    userEmail: ws.currentUser.email,
    conversationCount: convs.conversations.length,
    playbookCount: playbookCount ?? 0,
    documentCount: documentCount ?? 0,
    memberCount: memberCount ?? 0,
    apiKeyCount: apiKeyCount ?? 0,
    recent: convs.conversations.slice(0, 5).map((c) => ({ id: c.id, title: c.title })),
    spend,
    monthlyLimit: limit,
    spendCaption: `${pct}% of the $${limit} limit \u00b7 ${ws.workspace.billingCycle.daysLeft} days left in cycle`,
  };
}

export interface ComputedTotals {
  spendByModel: number;
  spendByPerson: number;
  spendByProject: number;
  documents: number;
  passages: number;
  conversations: number;
  conversationsByProject: Array<{ name: string; declared: number; actual: number }>;
}

/** Computed replacement for the old fixtureTotals constant (same shape). */
export async function getComputedTotals(): Promise<ComputedTotals> {
  const [usage, knowledge, convs] = await Promise.all([getUsage(), getKnowledge(), getConversations()]);
  return {
    spendByModel: money(usage.byModel.reduce((t, r) => t + r.amount, 0)),
    spendByPerson: money(usage.byPerson.reduce((t, r) => t + r.amount, 0)),
    spendByProject: money(usage.byProject.reduce((t, r) => t + r.amount, 0)),
    documents: knowledge.collections.reduce((t, r) => t + r.documents, 0),
    passages: knowledge.collections.reduce((t, r) => t + r.passages, 0),
    conversations: convs.conversations.length,
    conversationsByProject: convs.projects.map((p) => ({
      name: p.name,
      declared: p.count,
      actual: convs.conversations.filter((c) => c.project === p.name).length,
    })),
  };
}
/** Back-compat alias: totals are computed now, so this is async. */
export const fixtureTotals = getComputedTotals;

/* ------------------------------------------- getStates REPLACEMENT states */

/** states.json `emptyHistory`, rebuilt from the real workspace + KBs. */
export async function getEmptyHistoryState(): Promise<StatesData["emptyHistory"]> {
  const ctx = await resolveContext();
  const knowledge = await getKnowledge();
  const ws = await getWorkspaceData();
  return {
    workspace: ctx ? `${ws.workspace.name} \u00b7 ${ws.workspace.plan.toLowerCase()}` : "Your workspace",
    caption: "No conversations yet",
    heading: "Begin with a question worth keeping.",
    body: "Cortex works best when you name the decision, attach the evidence, and say what a useful answer should make clearer.",
    starters: [
      "What do our documents say about the decision in front of us?",
      "Summarise the research into three bets for next quarter.",
      "Which claims in our plan have no evidence behind them yet?",
    ],
    readyToCite: [
      ...knowledge.collections.slice(0, 3).map((c) => `${c.name} \u00b7 ${c.passages} passages`),
      "Add your own documents",
    ],
  };
}

/** states.json `upgrade`, rebuilt from the real team (plan/seats/usage). */
export async function getUpgradeState(): Promise<StatesData["upgrade"]> {
  const ws = await getWorkspaceData();
  const members = await getMembers();
  const end = new Date();
  end.setDate(end.getDate() + 7);
  return {
    workspace: ws.workspace.name,
    trialEnds: `Trial ends ${end.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`,
    heading: `Keep ${ws.workspace.name} answering.`,
    body: "Nothing is deleted when the trial ends; answers just pause. Pick seats and a spending limit and the switch happens at the end of the trial. No card is charged in-app — the plan change is recorded on your workspace.",
    seatsInTrial: Math.max(1, members.members.length),
    perSeat: 30,
    limitValue: `$${ws.workspace.monthlyLimit}`,
    usageNote: `The workspace has used $${ws.workspace.spend.toFixed(2)} so far this cycle.`,
    modelUseNote: `Billed after each month, never over $${ws.workspace.monthlyLimit}`,
    chargedDate: end.toLocaleDateString("en-US", { month: "long", day: "numeric" }),
    footerNote: "Seats added later are charged for the days left in the month. Cancel any time before the trial ends and nothing is charged.",
  };
}

// Designed auth/invite copy (states.json). W1's auth screens own these
// surfaces now; the constants stay here only so their in-flight pages keep
// compiling. New code must not import getStates.
const AUTH_STATE_COPY: StatesData["auth"] = {
  quote: {
    segments: [{ text: "\u201cIf I can't show where it came from, I can't send it.\u201d" }, { text: "", footnote: 1 }],
    source: "A head of research, in the interview study that shaped Cortex. Every answer you get here is footnoted like this one.",
  },
  trialFacts: [
    "14 days, no card needed",
    "$20 of model use, roughly 600 cited answers",
    "Up to 3 people and 25 documents",
    "When it ends, nothing is deleted. Answers pause until someone picks a plan.",
  ],
  signupError: "Use your work address so teammates can find your workspace. Personal addresses can join a workspace but not start one.",
};
const SIGNUP_STATE_COPY: StatesData["signup"] = {
  stepLabel: "Step 1 of 2 \u00b7 then name your workspace",
  errorName: "",
  errorEmail: "",
  legal: "By continuing you agree to the terms and privacy policy. Your documents are never used for training.",
};

/**
 * @deprecated Replaced by getEmptyHistoryState() / getUpgradeState() and by
 * W1's auth screens. Kept synchronous + copy-only so W1's login/signup/
 * invite pages compile until they drop it. Invite data here is a shape
 * placeholder — the real invite page resolves its token against
 * team_invites (W1 territory).
 */
export function getStates(): StatesData {
  return {
    invite: {
      inviter: "", role: "Editor", email: "", name: "", workspace: "", expires: "",
      roleDescription: "you can ask questions, run playbooks and upload documents",
      waiting: [], quote: { text: "", author: "" },
    },
    emptyHistory: {
      workspace: "", caption: "No conversations yet",
      heading: "Begin with a question worth keeping.",
      body: "Cortex works best when you name the decision, attach the evidence, and say what a useful answer should make clearer.",
      starters: [], readyToCite: [],
    },
    upgrade: {
      workspace: "", trialEnds: "", heading: "", body: "", seatsInTrial: 1, perSeat: 30,
      limitValue: "$75", usageNote: "", modelUseNote: "", chargedDate: "", footerNote: "",
    },
    signup: SIGNUP_STATE_COPY,
    auth: AUTH_STATE_COPY,
  };
}

/** Owner's seeded demo thread id for the landing page (null until seeded). */
export async function getFeaturedThreadId(): Promise<string | null> {
  try {
    const admin = createAdminClient();
    const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const owner = users?.users.find((u) => u.email === "xoppersk@gmail.com");
    if (!owner) return null;
    const { data } = await admin
      .from("conversations")
      .select("id")
      .eq("user_id", owner.id)
      .is("deleted_at", null)
      .order("created_at")
      .limit(1)
      .maybeSingle();
    return data ? String((data as Row).id) : null;
  } catch {
    return null;
  }
}
