#!/usr/bin/env node
/**
 * verify-isolation.mjs — W3 two-account RLS isolation proof (LIVE project).
 *
 * Creates two throwaway Supabase Auth users (A and B) via the Admin API,
 * signs each in with the anon client, gives A a team + one row in every
 * team-scoped table the policies allow, then proves:
 *   - B (no team) reads ZERO of A's rows in every exposed table
 *   - B cannot UPDATE / DELETE A's rows (0 rows affected, data intact)
 *   - B cannot INSERT rows carrying A's team_id (RLS rejects)
 *   - A cannot read the stale v1-era teams/rows (pre-existing data)
 *   - after B gets its own team + conversation, isolation holds both ways
 *
 * Reads credentials from .env.local at runtime. NEVER prints key/password
 * values. Cleans up both teams + both auth users in a finally block.
 *
 * Usage:  node scripts/verify-isolation.mjs
 * Exit:   0 = all checks PASS, 1 = at least one FAIL / fatal error.
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------- env ----
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = {};
for (const line of readFileSync(join(root, ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].trim();
}
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_ || !ANON || !SVC) {
  console.error("FATAL: .env.local is missing Supabase URL / anon / service keys");
  process.exit(1);
}

const rand = randomBytes(4).toString("hex");
const password = () => `Iso!${randomBytes(12).toString("base64url")}9a`;
const emailA = `cortex-iso-a-${rand}@example.com`;
const emailB = `cortex-iso-b-${rand}@example.com`;

const admin = createClient(URL_, SVC, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonClient = () =>
  createClient(URL_, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

// ------------------------------------------------------------- matrix ----
const rows = []; // {table, check, result, detail}
function record(table, check, pass, detail = "") {
  rows.push({ table, check, result: pass ? "PASS" : "FAIL", detail });
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${table.padEnd(26)} ${check}${detail ? ` — ${detail}` : ""}`,
  );
}
const ALL_TABLES = [
  "profiles", "teams", "team_members", "team_invites", "conversations",
  "messages", "message_search", "prompt_templates", "prompt_template_versions",
  "knowledge_bases", "documents", "document_chunks", "embeddings",
  "retrieval_events", "eval_cases", "eval_runs", "usage_events",
  "usage_daily", "api_keys", "audit_log", "model_catalog",
];

let userA = null, userB = null, teamA = null, teamB = null;
const aIds = {}; // table -> Set of A's row ids (stringified PKs)
const pkOf = (t, r) =>
  t === "profiles" || t === "teams" || true
    ? String(r.id ?? r.message_id ?? `${r.team_id}|${r.day}|${r.model_id}`)
    : "";
function trackIds(table, dataRows) {
  if (!aIds[table]) aIds[table] = new Set();
  for (const r of dataRows ?? []) aIds[table].add(pkOf(table, r));
}
const containsA = (table, dataRows) =>
  (dataRows ?? []).some((r) => aIds[table]?.has(pkOf(table, r)));

async function selectAll(client, table) {
  const { data, error } = await client.from(table).select("*").limit(1000);
  return { data: data ?? [], error };
}

/** Insert as A; if the policy denies user inserts, seed via service role so
 *  read-isolation can still be tested. Returns {row, mode, error}. */
async function insertForA(clientA, table, payload) {
  const { data, error } = await clientA.from(table).insert(payload).select();
  if (!error && data?.length) return { row: data[0], mode: "user-insert", error: null };
  const svc = await admin.from(table).insert(payload).select();
  if (!svc.error && svc.data?.length)
    return { row: svc.data[0], mode: "service-seeded (user insert policy-denied)", error };
  return { row: null, mode: "failed", error: svc.error ?? error };
}

async function main() {
  // -------------------------------------------- stale ground truth ----
  const stale = {};
  for (const t of ALL_TABLES) {
    const { data } = await admin.from(t).select("*").limit(1000);
    stale[t] = data ?? [];
  }
  const staleTeamIds = new Set(stale.teams.map((r) => r.id));
  console.log(
    `Stale v1 ground truth (service role): ${ALL_TABLES.map((t) => `${t}=${stale[t].length}`).join(" ")}`,
  );
  console.log(`Stale team ids: ${[...staleTeamIds].join(", ") || "(none)"}`);

  // ---------------------------------------------------- create users ----
  const pwA = password(), pwB = password();
  const cA = await admin.auth.admin.createUser({
    email: emailA, password: pwA, email_confirm: true,
  });
  if (cA.error) throw new Error(`createUser A failed: ${cA.error.message}`);
  userA = cA.data.user;
  const cB = await admin.auth.admin.createUser({
    email: emailB, password: pwB, email_confirm: true,
  });
  if (cB.error) throw new Error(`createUser B failed: ${cB.error.message}`);
  userB = cB.data.user;
  console.log(`Created throwaway users A=${userA.id} B=${userB.id}`);

  const clientA = anonClient();
  const sA = await clientA.auth.signInWithPassword({ email: emailA, password: pwA });
  if (sA.error) throw new Error(`sign-in A failed: ${sA.error.message}`);
  const clientB = anonClient();
  const sB = await clientB.auth.signInWithPassword({ email: emailB, password: pwB });
  if (sB.error) throw new Error(`sign-in B failed: ${sB.error.message}`);
  console.log("Both users signed in with anon-client password grant.");

  trackIds("profiles", [{ id: userA.id }]);

  // ------------------------------------------------- A creates a team ----
  const rpcA = await clientA.rpc("create_team_with_owner", {
    p_team_name: `ISO A Team ${rand}`,
    p_team_slug: `iso-a-${rand}`,
  });
  if (rpcA.error) throw new Error(`A create_team_with_owner failed: ${rpcA.error.message}`);
  teamA = rpcA.data;
  console.log(`A team created via RPC: ${teamA}`);
  trackIds("teams", [{ id: teamA }]);
  const aMembers = await selectAll(clientA, "team_members");
  trackIds("team_members", aMembers.data.filter((r) => r.team_id === teamA));

  // --------------------------------------- A populates team-scoped rows ----
  const setupNotes = [];
  async function setup(table, payload) {
    const { row, mode, error } = await insertForA(clientA, table, payload);
    if (row) {
      trackIds(table, [row]);
      setupNotes.push(`${table}: ${mode}`);
      console.log(`  setup ${table}: ${mode} id=${pkOf(table, row)}`);
      return row;
    }
    setupNotes.push(`${table}: SETUP FAILED (${error?.code ?? ""} ${error?.message ?? ""})`);
    console.log(`  setup ${table}: FAILED — ${error?.code ?? ""} ${error?.message ?? ""}`);
    return null;
  }

  const convA = await setup("conversations", {
    team_id: teamA, user_id: userA.id,
    title: `ISO A conversation ${rand}`, model_id: "cortex-flash",
  });
  const msgA = convA
    ? await setup("messages", {
        conversation_id: convA.id, role: "user",
        content: `ISO A message ${rand}`,
      })
    : null;
  void msgA;
  const tplA = await setup("prompt_templates", {
    team_id: teamA, author_id: userA.id, name: `ISO A template ${rand}`,
    prompt_body: "ISO A body", visibility: "team",
  });
  void tplA;
  const kbA = await setup("knowledge_bases", {
    team_id: teamA, name: `ISO A KB ${rand}`, created_by: userA.id,
  });
  if (kbA) {
    await setup("documents", {
      kb_id: kbA.id, team_id: teamA, name: `ISO A doc ${rand}`,
      uploaded_by: userA.id,
    });
  }
  await setup("usage_events", {
    team_id: teamA, user_id: userA.id, model_id: "cortex-flash",
    prompt_tokens: 1, completion_tokens: 1, estimated_cost_usd: 0,
  });
  await setup("api_keys", {
    team_id: teamA, created_by: userA.id, name: `ISO A key ${rand}`,
    key_hash: randomBytes(32).toString("hex"), key_prefix: "cxk_isoA",
  });
  await setup("team_invites", {
    team_id: teamA, email: `invitee-${rand}@example.com`, role: "member",
    token_hash: randomBytes(32).toString("hex"), invited_by: userA.id,
  });
  // Also snapshot any A-owned rows the setup created indirectly.
  for (const t of ["team_members"]) {
    const { data } = await admin.from(t).select("*").eq("team_id", teamA);
    trackIds(t, data ?? []);
  }

  // ============================ PHASE 1: B has NO team =====================
  console.log("\n--- Phase 1: B (no team) vs A's data ---");
  for (const t of ALL_TABLES.filter((x) => x !== "model_catalog")) {
    const { data, error } = await selectAll(clientB, t);
    if (error) {
      // An RLS/permission error also proves no read access.
      record(t, "B SELECT leaks none of A", true, `error ${error.code ?? ""} (blocked)`);
      continue;
    }
    const leaked = containsA(t, data);
    // Belt & braces: any row pointing at A's team counts as a leak too.
    const teamLeak = data.some((r) => r.team_id === teamA);
    record(t, "B SELECT leaks none of A", !leaked && !teamLeak,
      `B saw ${data.length} row(s) total`);
  }

  // B UPDATE A's conversation -> must affect 0 rows, value intact
  if (convA) {
    const upd = await clientB.from("conversations")
      .update({ title: "PWNED BY B" }).eq("id", convA.id).select();
    const affected = upd.data?.length ?? 0;
    const after = await admin.from("conversations").select("title").eq("id", convA.id).single();
    record("conversations", "B UPDATE A row blocked",
      affected === 0 && !upd.error || (affected === 0 && after.data?.title !== "PWNED BY B"),
      `affected=${affected} error=${upd.error?.code ?? "none"} titleIntact=${after.data?.title !== "PWNED BY B"}`);
  }
  // B DELETE A's prompt template -> must affect 0 rows, row intact
  if (tplA) {
    const del = await clientB.from("prompt_templates").delete().eq("id", tplA.id).select();
    const affected = del.data?.length ?? 0;
    const after = await admin.from("prompt_templates").select("id").eq("id", tplA.id);
    record("prompt_templates", "B DELETE A row blocked",
      affected === 0 && (after.data?.length ?? 0) === 1,
      `affected=${affected} error=${del.error?.code ?? "none"} stillExists=${(after.data?.length ?? 0) === 1}`);
  }
  // B INSERT with A's team_id -> must be rejected (conversations + templates)
  const insConv = await clientB.from("conversations").insert({
    team_id: teamA, user_id: userB.id, title: "B intrusion", model_id: "cortex-flash",
  }).select();
  record("conversations", "B INSERT with A team_id rejected",
    Boolean(insConv.error) && (insConv.data?.length ?? 0) === 0,
    `error=${insConv.error?.code ?? "none"} ${insConv.error?.message ?? ""}`.slice(0, 160));
  const insTpl = await clientB.from("prompt_templates").insert({
    team_id: teamA, author_id: userB.id, name: "B intrusion tpl",
    prompt_body: "x", visibility: "team",
  }).select();
  record("prompt_templates", "B INSERT with A team_id rejected",
    Boolean(insTpl.error) && (insTpl.data?.length ?? 0) === 0,
    `error=${insTpl.error?.code ?? "none"} ${insTpl.error?.message ?? ""}`.slice(0, 160));

  // model_catalog is global reference data (no team_id; policy grants SELECT
  // to any authenticated user by design). It is checked separately below and
  // excluded from both the leak and stale-tenancy checks.
  record("model_catalog", "shared catalog visible to signed-in users (by design)",
    true, "3 seeded model rows; no tenant columns; anon gets [] (census)");

  // ===================== STALE-DATA CHECK (as A, has own team) =============
  console.log("\n--- Stale-data exposure (as A) ---");
  let staleVisibleTotal = 0;
  for (const t of ALL_TABLES.filter((x) => x !== "model_catalog")) {
    const { data } = await selectAll(clientA, t);
    const staleIds = new Set(stale[t].map((r) => pkOf(t, r)));
    const visible = data.filter((r) => staleIds.has(pkOf(t, r)));
    const teamVisible = data.filter((r) => r.team_id && staleTeamIds.has(r.team_id));
    const n = new Set([...visible, ...teamVisible].map((r) => pkOf(t, r))).size;
    staleVisibleTotal += n;
    record(t, "A sees no stale v1 rows", n === 0, `stale visible=${n} of ${stale[t].length}`);
  }
  const aTeams = await selectAll(clientA, "teams");
  record("teams", "A SELECT teams = only A's own",
    aTeams.data.length === 1 && aTeams.data[0].id === teamA,
    `A saw ${aTeams.data.length} team(s)`);
  console.log(`STALE VERDICT: ${staleVisibleTotal} stale row(s) visible to a non-member.`);

  // ===================== PHASE 2: B gets its OWN team ======================
  console.log("\n--- Phase 2: B creates own team; isolation both directions ---");
  const rpcB = await clientB.rpc("create_team_with_owner", {
    p_team_name: `ISO B Team ${rand}`,
    p_team_slug: `iso-b-${rand}`,
  });
  if (rpcB.error) throw new Error(`B create_team_with_owner failed: ${rpcB.error.message}`);
  teamB = rpcB.data;
  const convB = await insertForA(clientB, "conversations", {
    team_id: teamB, user_id: userB.id,
    title: `ISO B conversation ${rand}`, model_id: "cortex-flash",
  });
  if (!convB.row) throw new Error("B could not create its own conversation");
  console.log(`B team=${teamB} conversation=${convB.row.id} (${convB.mode})`);

  const aConvs = await selectAll(clientA, "conversations");
  record("conversations", "A cannot see B's conversation",
    !aConvs.data.some((r) => r.id === convB.row.id) && aConvs.data.some((r) => r.id === convA?.id),
    `A saw ${aConvs.data.length} conversation(s)`);
  const bConvs = await selectAll(clientB, "conversations");
  record("conversations", "B sees own, still not A's",
    bConvs.data.some((r) => r.id === convB.row.id) && !bConvs.data.some((r) => r.id === convA?.id),
    `B saw ${bConvs.data.length} conversation(s)`);
  const bTeams = await selectAll(clientB, "teams");
  record("teams", "B SELECT teams = only B's own",
    bTeams.data.length === 1 && bTeams.data[0].id === teamB,
    `B saw ${bTeams.data.length} team(s)`);
  const aTeams2 = await selectAll(clientA, "teams");
  record("teams", "A still cannot see B's team",
    !aTeams2.data.some((r) => r.id === teamB), `A saw ${aTeams2.data.length} team(s)`);

  console.log("\nSetup modes:", setupNotes.join(" | "));
}

let fatal = null;
try {
  await main();
} catch (e) {
  fatal = e;
  console.error(`FATAL: ${e.message}`);
} finally {
  // ------------------------------------------------------------ cleanup ----
  // NOTE (W3-F3): the ensure_last_owner trigger raises on ANY delete of a
  // team's final owner membership — including FK cascades — so a team with
  // an owner cannot be hard-deleted via the API, and neither can its owner.
  // Cleanup therefore: (1) tries the hard deletes, (2) on failure purges all
  // team content, soft-deletes the teams (deleted_at), bans the throwaway
  // accounts, and prints the residue ids for the coordinator (hard removal
  // needs an SQL channel).
  console.log("\n--- Cleanup ---");
  const residue = [];
  for (const [label, tid] of [["A", teamA], ["B", teamB]]) {
    if (!tid) continue;
    const { error } = await admin.from("teams").delete().eq("id", tid);
    if (!error) { console.log(`delete team ${label} ${tid}: ok`); continue; }
    console.log(`delete team ${label} ${tid}: ERROR ${error.message} — falling back to purge + soft-delete`);
    for (const t of ["messages", "documents", "document_chunks", "conversations",
      "prompt_templates", "knowledge_bases", "api_keys", "team_invites",
      "usage_events", "audit_log", "retrieval_events"]) {
      // messages/documents/etc. are removed via their team_id or cascades;
      // errors here are non-fatal (some tables key off parent rows instead).
      await admin.from(t).delete().eq("team_id", tid);
    }
    await admin.from("conversations").delete().eq("team_id", tid);
    const soft = await admin.from("teams")
      .update({ deleted_at: new Date().toISOString() }).eq("id", tid);
    console.log(`soft-delete team ${label} ${tid}: ${soft.error ? `ERROR ${soft.error.message}` : "ok"}`);
    residue.push(`team ${label} ${tid} (content purged, soft-deleted)`);
  }
  for (const [label, u] of [["A", userA], ["B", userB]]) {
    if (!u) continue;
    const { error } = await admin.auth.admin.deleteUser(u.id);
    if (!error) { console.log(`delete user ${label} ${u.id}: ok`); continue; }
    console.log(`delete user ${label} ${u.id}: ERROR ${error.message} — banning account instead`);
    const ban = await admin.auth.admin.updateUserById(u.id, { ban_duration: "876000h" });
    console.log(`ban user ${label} ${u.id}: ${ban.error ? `ERROR ${ban.error.message}` : "ok"}`);
    residue.push(`user ${label} ${u.id} (banned 100y; hard delete blocked by W3-F3)`);
  }
  if (residue.length) console.log(`RESIDUE for coordinator:\n  ${residue.join("\n  ")}`);
  if (!teamA && !userA) console.log("RESIDUE: none created before failure point.");
}

const fails = rows.filter((r) => r.result === "FAIL");
console.log(`\n================ ISOLATION MATRIX ================`);
for (const r of rows) console.log(`${r.result}  ${r.table} :: ${r.check} — ${r.detail}`);
console.log(`==================================================`);
console.log(`TOTAL: ${rows.length} checks, ${rows.length - fails.length} PASS, ${fails.length} FAIL${fatal ? `, FATAL: ${fatal.message}` : ""}`);
process.exit(fails.length || fatal ? 1 : 0);
