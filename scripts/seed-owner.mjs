#!/usr/bin/env node
/**
 * Seed the OWNER workspace with the v2 fixture content (data/*.json).
 *
 * - Service-role REST + Auth Admin API only (reads .env.local). No secrets
 *   are printed — counts only.
 * - Owner = the auth user xoppersk@gmail.com, created beforehand by
 *   scripts/create-owner.mjs (W1). If the owner is absent this script exits
 *   with a clear message; the coordinator runs the scripts in order.
 * - Fixtures become data owned by the OWNER's team only. Fixture people
 *   become seeded auth users (email_confirm, unusable random passwords) +
 *   profiles + team_members so FK constraints hold.
 * - Deterministic + idempotent: the team is found/created by the fixture
 *   slug, and a completed seed writes an audit_log marker
 *   ("seed:owner-fixtures"); a re-run detects the marker and skips.
 *
 * Mapping notes (schema has fewer concepts than the design fixtures):
 * - Roles: owner->owner, Admin->admin, Editor/Viewer->member (team_members
 *   only knows owner/admin/member).
 * - Models: "Cortex 4"->cortex-pro, "Cortex 4 mini"->cortex-flash,
 *   "Indexing"->cortex-flash (model_catalog ids from supabase/seed.sql).
 * - Usage: usage.json's series/byModel/byPerson all total $184. The seed
 *   emits 184 one-dollar usage_events allocated greedily across the series
 *   segment dates, model quotas and person quotas so all three designed
 *   breakdowns reproduce exactly, plus matching usage_daily rollups.
 * - Chunks: real chunk rows are created from the fixture texts that exist
 *   (inspector passages, thread margin notes, ask trace excerpts, one
 *   summary chunk per other document). Designed passage totals live on
 *   documents.chunk_count, which is what the UI aggregates.
 */
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const env = {};
  for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

const env = loadEnv();
const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !SERVICE_KEY) {
  console.error("seed-owner: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing in .env.local");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, { method = "GET", body, prefer } = {}) {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    method,
    headers: prefer ? { ...headers, Prefer: prefer } : headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`REST ${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

async function adminUsers() {
  const res = await fetch(`${URL_BASE}/auth/v1/admin/users?per_page=1000`, { headers });
  if (!res.ok) throw new Error(`admin list users -> ${res.status}`);
  const data = await res.json();
  return data.users ?? [];
}

async function createAuthUser(email, displayName) {
  const res = await fetch(`${URL_BASE}/auth/v1/admin/users`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      email,
      password: randomBytes(32).toString("base64url"),
      email_confirm: true,
      user_metadata: { display_name: displayName },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`admin create user ${email} -> ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  return data;
}

const readJson = (name) => JSON.parse(readFileSync(join(root, "data", `${name}.json`), "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const MODEL_IDS = { "Cortex 4": "cortex-pro", "Cortex 4 mini": "cortex-flash", Indexing: "cortex-flash" };
const ROLE_IDS = { Admin: "admin", Editor: "member", Viewer: "member" };

async function main() {
  const workspace = readJson("workspace");
  const membersData = readJson("members");
  const conversationsData = readJson("conversations");
  const thread = readJson("thread");
  const playbooks = readJson("playbooks");
  const knowledge = readJson("knowledge");
  const usage = readJson("usage");
  const evaluations = readJson("evaluations");
  const templates = readJson("templates");
  const admin = readJson("admin");

  const users = await adminUsers();
  const owner = users.find((u) => u.email === "xoppersk@gmail.com");
  if (!owner) {
    console.error(
      "seed-owner: owner auth user xoppersk@gmail.com not found. Run scripts/create-owner.mjs first (coordinator runs the scripts in order).",
    );
    process.exit(1);
  }
  const counts = {};

  // ---- team (by fixture slug) ----
  const slug = workspace.workspace.slug;
  let team = (await rest(`teams?slug=eq.${encodeURIComponent(slug)}&select=*`))[0];
  if (!team) {
    [team] = await rest("teams", {
      method: "POST",
      prefer: "return=representation",
      body: {
        name: workspace.workspace.name,
        slug,
        plan: "team",
        seat_count: workspace.workspace.paidSeats,
        default_model_id: MODEL_IDS[workspace.workspace.defaultModel] ?? "cortex-flash",
        retention_days: 365,
      },
    });
  }
  counts.team = 1;

  const marker = await rest(
    `audit_log?team_id=eq.${team.id}&action=eq.${encodeURIComponent("seed:owner-fixtures")}&select=id&limit=1`,
  );
  if (marker.length > 0) {
    console.log(`seed-owner: team ${slug} already seeded (marker found) — skipping.`);
    const convs = await rest(`conversations?team_id=eq.${team.id}&select=id`);
    console.log(`seed-owner: existing counts: conversations=${convs.length}`);
    return;
  }

  // ---- people: owner + fixture members as seeded auth users ----
  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const userByFixtureId = new Map();
  const ensureUser = async (email, name) => {
    if (userByEmail.has(email)) return userByEmail.get(email);
    const created = await createAuthUser(email, name);
    userByEmail.set(email, created);
    return created;
  };

  // Owner membership + profile.
  // on_conflict is required: merge-duplicates otherwise targets the PK
  // and a re-run dies on the (team_id, user_id) unique constraint (409).
  await rest("team_members?on_conflict=team_id,user_id", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: { team_id: team.id, user_id: owner.id, role: "owner", status: "active" },
  });
  await rest(`profiles?id=eq.${owner.id}`, {
    method: "PATCH",
    body: { display_name: workspace.currentUser.name, active_team_id: team.id },
  });

  let memberCount = 1;
  for (const member of membersData.members) {
    const user = await ensureUser(member.email, member.name);
    userByFixtureId.set(member.id, user);
    await rest(`profiles?id=eq.${user.id}`, {
      method: "PATCH",
      body: { display_name: member.name },
    });
    await rest("team_members?on_conflict=team_id,user_id", {
      method: "POST",
      prefer: "resolution=merge-duplicates,return=minimal",
      body: {
        team_id: team.id,
        user_id: user.id,
        role: ROLE_IDS[member.role] ?? "member",
        status: "active",
        invited_by: owner.id,
      },
    });
    memberCount += 1;
  }
  counts.members = memberCount;
  // Pending invite from the fixture.
  await rest("team_invites?on_conflict=team_id,email", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: {
      team_id: team.id,
      email: membersData.pendingInvite.email,
      role: ROLE_IDS[membersData.pendingInvite.role] ?? "member",
      token_hash: sha256(randomBytes(32).toString("hex")),
      invited_by: owner.id,
    },
  });
  counts.invites = 1;

  // ---- knowledge bases + documents + chunks ----
  const kbByName = new Map();
  for (const collection of knowledge.collections) {
    const [kb] = await rest("knowledge_bases", {
      method: "POST",
      prefer: "return=representation",
      body: {
        team_id: team.id,
        name: collection.name,
        description: collection.description ?? "",
        created_by: owner.id,
      },
    });
    kbByName.set(collection.name, kb);
  }
  counts.knowledgeBases = kbByName.size;

  const docByTitle = new Map();
  const docByFixtureId = new Map();
  for (const doc of knowledge.documents) {
    const kb = kbByName.get(doc.collection);
    if (!kb) continue;
    const [row] = await rest("documents", {
      method: "POST",
      prefer: "return=representation",
      body: {
        kb_id: kb.id,
        team_id: team.id,
        name: doc.title,
        source_type: "upload",
        mime_type: doc.format ?? null,
        status: doc.status === "failed" ? "failed" : doc.status === "indexing" ? "processing" : "ready",
        status_error: doc.statusDetail ?? null,
        chunk_count: doc.passages ?? 0,
        uploaded_by: owner.id,
      },
    });
    docByTitle.set(doc.title, row);
    docByFixtureId.set(doc.id, row);
  }
  counts.documents = docByTitle.size;
  const chunkRows = [];
  const pushChunk = (doc, content, section) => {
    if (!doc || !content?.trim()) return;
    chunkRows.push({
      document_id: doc.id,
      kb_id: doc.kb_id,
      team_id: team.id,
      chunk_index: chunkRows.filter((c) => c.document_id === doc.id).length,
      content: content.trim(),
      token_count: Math.max(1, Math.round(content.length / 4)),
      metadata: section ? { section_heading: section } : {},
    });
  };
  const synthesis = docByFixtureId.get(knowledge.inspector.documentId);
  for (const passage of knowledge.inspector.passages ?? []) pushChunk(synthesis, passage.text, knowledge.inspector.sectionHeading);
  for (const note of thread.notes ?? []) {
    const doc = docByTitle.get(note.documentTitle);
    const text = (note.excerpt ?? []).map((s) => s.text).join("");
    if (text) pushChunk(doc, text, note.catalog);
  }
  for (const row of knowledge.ask.trace ?? []) {
    const docTitle = String(row.source ?? "").split(" \u00b7 ")[0];
    if (typeof row.excerpt === "string") pushChunk(docByTitle.get(docTitle), row.excerpt, "Ask trace");
  }
  for (const doc of knowledge.documents) {
    const row = docByFixtureId.get(doc.id);
    if (row && !chunkRows.some((c) => c.document_id === row.id)) {
      pushChunk(row, `${doc.title}. ${doc.statusDetail ?? "Document in the " + doc.collection + " collection."}`, doc.collection);
    }
  }
  if (chunkRows.length > 0) {
    await rest("document_chunks", { method: "POST", prefer: "return=minimal", body: chunkRows });
  }
  counts.chunks = chunkRows.length;
  const chunkByDoc = new Map();
  const seededChunks = await rest(`document_chunks?team_id=eq.${team.id}&select=id,document_id`);
  for (const chunk of seededChunks) {
    if (!chunkByDoc.has(chunk.document_id)) chunkByDoc.set(chunk.document_id, chunk.id);
  }

  // ---- conversations + the seeded thread ----
  const convByFixtureId = new Map();
  for (const conv of conversationsData.conversations) {
    const author =
      conv.startedBy === "me" ? owner : (userByFixtureId.get(conv.startedBy) ?? owner);
    const [row] = await rest("conversations", {
      method: "POST",
      prefer: "return=representation",
      body: {
        team_id: team.id,
        user_id: author.id,
        title: conv.title,
        model_id: "cortex-pro",
        folder: conv.project,
        pinned: Boolean(conv.pinned),
      },
    });
    convByFixtureId.set(conv.id, row);
  }
  counts.conversations = convByFixtureId.size;

  const launchConv = convByFixtureId.get(thread.id);
  let messageCount = 0;
  if (launchConv) {
    const rows = [];
    for (const turn of thread.turns) {
      const speaker = membersData.members.find((m) => m.name === turn.speaker);
      const author = speaker ? (userByFixtureId.get(speaker.id) ?? owner) : owner;
      void author;
      // PostgREST bulk inserts require uniform keys across the batch
      // (PGRST102) — user rows carry the assistant-only columns too:
      // model_id/citations are nullable; the token columns are
      // NOT NULL DEFAULT 0, so they take 0 (never null — 23502).
      rows.push({
        conversation_id: launchConv.id,
        role: "user",
        content: turn.question,
        status: "complete",
        model_id: null,
        prompt_tokens: 0,
        completion_tokens: 0,
        citations: null,
      });
      const answerText = (turn.answer.blocks ?? [])
        .map((block) => {
          if (block.type === "pullQuote") return block.text ?? "";
          if (block.type === "list") return (block.items ?? []).map((item) => item.map((s) => s.text).join("")).join("\n");
          return (block.segments ?? []).map((s) => s.text).join("");
        })
        .filter(Boolean)
        .join("\n\n");
      const citations = [];
      const seen = new Set();
      for (const block of turn.answer.blocks ?? []) {
        const segments = [...(block.segments ?? []), ...((block.items ?? []).flat())];
        for (const segment of segments) {
          if (!segment.footnote || seen.has(segment.footnote)) continue;
          seen.add(segment.footnote);
          const note = (thread.notes ?? []).find((n) => n.n === segment.footnote);
          if (!note) continue;
          const doc = docByTitle.get(note.documentTitle);
          citations.push({
            chunk_id: doc ? (chunkByDoc.get(doc.id) ?? null) : null,
            document_id: doc?.id ?? null,
            label: note.documentTitle,
            score: Math.max(0.5, 0.95 - segment.footnote * 0.04),
            excerpt: (note.excerpt ?? []).map((s) => s.text).join(""),
          });
        }
      }
      const tokens = Number(String(turn.answer.footer?.tokens ?? "0").replace(/[^0-9]/g, "")) || 0;
      rows.push({
        conversation_id: launchConv.id,
        role: "assistant",
        content: `${turn.answer.heading}\n\n${answerText}`,
        status: "complete",
        model_id: "cortex-pro",
        prompt_tokens: Math.round(tokens * 0.75),
        completion_tokens: Math.round(tokens * 0.25),
        citations,
      });
    }
    await rest("messages", { method: "POST", prefer: "return=minimal", body: rows });
    messageCount = rows.length;
  }
  counts.messages = messageCount;

  // ---- playbooks + templates (prompt_templates) ----
  const authorByName = (name) => {
    const member = membersData.members.find((m) => m.name === name);
    return member ? (userByFixtureId.get(member.id) ?? owner) : owner;
  };
  const templateRows = [];
  const addTemplate = (row, visibility, featured, deletedAt) => {
    templateRows.push({
      team_id: team.id,
      author_id: authorByName(row.owner).id,
      name: row.name,
      description: row.description ?? "",
      category: row.category ?? "General",
      prompt_body: row.instructions ?? row.description ?? row.name,
      variables: [],
      visibility,
      featured: Boolean(featured),
      run_count: row.runs ?? (row.copied ? Number(String(row.copied).replace(/[^0-9]/g, "")) || 0 : 0),
      deleted_at: deletedAt ?? null,
    });
  };
  addTemplate({ ...playbooks.featured, category: "Go-to-market" }, "team", true, null);
  for (const row of playbooks.team) addTemplate(row, "team", false, null);
  for (const row of playbooks.private) addTemplate(row, "personal", false, null);
  for (const row of playbooks.archived) addTemplate(row, "team", false, new Date().toISOString());
  addTemplate({ ...templates.featured, instructions: templates.featured.instructions }, "team", true, null);
  for (const row of templates.templates) {
    if (row.id === templates.featured.id) continue;
    addTemplate(row, "team", false, null);
  }
  // The featured playbook carries the designed input variables.
  const featuredVars = (playbooks.edit?.inputs ?? []).map((input) => ({
    name: input.input,
    label: input.input,
    default_value: input.example ?? "",
    required: Boolean(input.required),
  }));
  if (templateRows[0]) templateRows[0].variables = featuredVars;
  await rest("prompt_templates", { method: "POST", prefer: "return=minimal", body: templateRows });
  counts.templates = templateRows.length;

  // ---- evaluations ----
  const firstKb = kbByName.get(knowledge.collections[0]?.name);
  let caseCount = 0;
  let runCount = 0;
  if (firstKb) {
    const caseRows = (evaluations.failures ?? []).map((failure) => ({
      kb_id: firstKb.id,
      question: failure.question,
      expected_answer: failure.expected,
      tags: [failure.tag],
      created_by: owner.id,
    }));
    if (caseRows.length > 0) {
      await rest("eval_cases", { method: "POST", prefer: "return=minimal", body: caseRows });
      caseCount = caseRows.length;
    }
    const runRows = (evaluations.runs ?? []).map((run) => ({
      kb_id: firstKb.id,
      triggered_by: "nightly",
      status: "passed",
      cases_total: evaluations.set.questions,
      cases_passed: run.passed,
      details: (evaluations.failures ?? []).map((failure) => ({
        question: failure.question,
        expected: failure.expected,
        got: failure.got,
        why: failure.why,
        passed: false,
      })),
    }));
    // created_at parsing: fixture dates are like "Oct 5" — pin them to 2026.
    runRows.forEach((row, index) => {
      const fixtureDate = evaluations.runs[index].date;
      row.created_at = new Date(`${fixtureDate}, 2026 02:00:00`).toISOString();
    });
    await rest("eval_runs", { method: "POST", prefer: "return=minimal", body: runRows });
    runCount = runRows.length;
  }
  counts.evalCases = caseCount;
  counts.evalRuns = runCount;

  // ---- api keys (hashed only) + audit rows ----
  const keyIdByFixture = new Map();
  for (const key of admin.apiKeys.rows) {
    const plaintext = `cxk_seed_${randomBytes(24).toString("base64url")}`;
    const [row] = await rest("api_keys", {
      method: "POST",
      prefer: "return=representation",
      body: {
        team_id: team.id,
        created_by: owner.id,
        name: key.name,
        key_hash: sha256(plaintext),
        key_prefix: String(key.masked ?? "cxk_seed_").slice(0, 10),
        scopes: ["chat"],
        last_used_at: key.lastUsed && key.lastUsed !== "Never" ? null : null,
      },
    });
    keyIdByFixture.set(key.id, row.id);
  }
  counts.apiKeys = keyIdByFixture.size;

  const auditRows = [];
  for (const group of admin.audit.groups ?? []) {
    for (const entry of group.entries ?? []) {
      const actorMember = membersData.members.find((m) => m.name === entry.actor);
      const actor = actorMember ? (userByFixtureId.get(actorMember.id) ?? owner) : owner;
      auditRows.push({
        team_id: team.id,
        actor_id: actor.id,
        action: entry.sentence,
        target_type: entry.category,
        created_at: new Date(`${entry.date}T12:00:00Z`).toISOString(),
      });
    }
  }
  if (auditRows.length > 0) {
    await rest("audit_log", { method: "POST", prefer: "return=minimal", body: auditRows });
  }
  counts.auditEntries = auditRows.length;

  // ---- usage: 184 one-dollar events hitting series/model/person totals ----
  const segmentDates = { "Sep 10": "2026-09-10", "Sep 16": "2026-09-16", "Sep 23": "2026-09-23", "Sep 30": "2026-09-30", "Oct 6": "2026-10-06" };
  const segments = [];
  let previous = 0;
  for (const point of usage.series) {
    segments.push({ date: segmentDates[point.date] ?? "2026-10-06", delta: point.value - previous });
    previous = point.value;
  }
  const modelQuota = new Map(usage.byModel.map((row) => [MODEL_IDS[row.name] ?? "cortex-flash", row.amount]));
  // "Indexing" shares cortex-flash with "Cortex 4 mini"; keep them distinct
  // for quota purposes by tracking display names, then mapping at insert.
  const modelNameQuota = usage.byModel.map((row) => ({ name: row.name, left: row.amount }));
  const personQuota = usage.byPerson.map((row) => {
    if (row.name === "API keys") return { kind: "api", left: row.amount };
    const member = membersData.members.find((m) => m.name === row.name);
    return { kind: "user", user: member ? (userByFixtureId.get(member.id) ?? owner) : owner, left: row.amount };
  });
  const events = [];
  const dailyModel = new Map();
  for (const segment of segments) {
    for (let i = 0; i < segment.delta; i++) {
      const modelEntry = modelNameQuota.find((entry) => entry.left > 0) ?? modelNameQuota[0];
      modelEntry.left -= 1;
      const personEntry = personQuota.find((entry) => entry.left > 0) ?? personQuota[0];
      personEntry.left -= 1;
      const isApi = personEntry.kind === "api";
      events.push({
        team_id: team.id,
        user_id: isApi ? owner.id : personEntry.user.id,
        conversation_id: launchConv?.id ?? null,
        api_key_id: isApi ? (keyIdByFixture.get("production-api") ?? null) : null,
        model_id: MODEL_IDS[modelEntry.name] ?? "cortex-flash",
        prompt_tokens: 2000,
        completion_tokens: 1000,
        estimated_cost_usd: 1,
        created_at: `${segment.date}T12:00:00Z`,
      });
      const key = `${segment.date}|${MODEL_IDS[modelEntry.name] ?? "cortex-flash"}`;
      dailyModel.set(key, (dailyModel.get(key) ?? 0) + 1);
    }
  }
  void modelQuota;
  if (events.length > 0) {
    await rest("usage_events", { method: "POST", prefer: "return=minimal", body: events });
  }
  counts.usageEvents = events.length;

  const dailyRows = [];
  for (const segment of segments) {
    if (segment.delta === 0) continue;
    dailyRows.push({
      team_id: team.id, user_id: null, model_id: "*",
      day: segment.date, prompt_tokens: segment.delta * 2000,
      completion_tokens: segment.delta * 1000, estimated_cost_usd: segment.delta,
      message_count: segment.delta,
    });
  }
  for (const [key, amount] of dailyModel) {
    const [day, modelId] = key.split("|");
    dailyRows.push({
      team_id: team.id, user_id: null, model_id: modelId,
      day, prompt_tokens: amount * 2000, completion_tokens: amount * 1000,
      estimated_cost_usd: amount, message_count: amount,
    });
  }
  if (dailyRows.length > 0) {
    await rest("usage_daily", { method: "POST", prefer: "return=minimal", body: dailyRows });
  }
  counts.usageDaily = dailyRows.length;

  // ---- marker (idempotency) ----
  await rest("audit_log", {
    method: "POST",
    prefer: "return=minimal",
    body: { team_id: team.id, actor_id: owner.id, action: "seed:owner-fixtures", target_type: "seed", metadata: { counts } },
  });

  console.log(`seed-owner: seeded team ${slug} (${team.id})`);
  console.log(`seed-owner: counts ${JSON.stringify(counts)}`);
}

main().catch((error) => {
  console.error(`seed-owner: failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
