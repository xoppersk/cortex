#!/usr/bin/env node
/**
 * create-owner.mjs — creates the Cortex OWNER auth account (W1 deliverable).
 *
 * Creates xoppersk@gmail.com via the Supabase Auth Admin API with a
 * cryptographically random password and email_confirm: true, then writes
 * ONLY { email, password, created_at } to
 *   ~/workspace/cortex-v2-audit/hidden/owner-credential.txt   (mode 0600)
 *
 * The password is never printed. Idempotent: if the user already exists,
 * the script reports that and exits 0 WITHOUT touching an existing
 * credential file.
 *
 * DO NOT run casually — the production coordinator runs this once at
 * integration time.
 *
 * Usage:  node scripts/create-owner.mjs    (reads .env.local next to the repo root)
 */
import { randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OWNER_EMAIL = "xoppersk@gmail.com";
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const credentialPath = join(
  homedir(),
  "workspace/cortex-v2-audit/hidden/owner-credential.txt",
);

function readEnvLocal() {
  const env = {};
  for (const line of readFileSync(join(repoRoot, ".env.local"), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

const env = readEnvLocal();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const adminHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

// Idempotency: look the owner up first (list users, match email exactly).
const listRes = await fetch(`${url}/auth/v1/admin/users?per_page=200`, {
  headers: adminHeaders,
});
if (!listRes.ok) {
  console.error(`Admin list users failed: HTTP ${listRes.status}`);
  process.exit(1);
}
const { users } = await listRes.json();
const existing = (users ?? []).find(
  (u) => u.email?.toLowerCase() === OWNER_EMAIL.toLowerCase(),
);
if (existing) {
  console.log(`Owner account already exists (${OWNER_EMAIL}, id ${existing.id}). Nothing changed.`);
  process.exit(0);
}

const password =
  randomBytes(24).toString("base64url") + "Aa1!"; // 32 random chars + class coverage

const createRes = await fetch(`${url}/auth/v1/admin/users`, {
  method: "POST",
  headers: adminHeaders,
  body: JSON.stringify({
    email: OWNER_EMAIL,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Sheku Koroma" },
  }),
});
if (!createRes.ok) {
  const body = await createRes.text();
  // Race-safe: another run created it between list and create.
  if (/already.*registered|already exists/i.test(body)) {
    console.log(`Owner account already exists (${OWNER_EMAIL}). Nothing changed.`);
    process.exit(0);
  }
  console.error(`Admin create user failed: HTTP ${createRes.status}`);
  process.exit(1);
}
const created = await createRes.json();

mkdirSync(dirname(credentialPath), { recursive: true, mode: 0o700 });
if (existsSync(credentialPath)) {
  console.error(
    `Owner user created (id ${created.id}) but ${credentialPath} already exists — not overwriting it. Reconcile manually.`,
  );
  process.exit(1);
}
writeFileSync(
  credentialPath,
  JSON.stringify(
    { email: OWNER_EMAIL, password, created_at: new Date().toISOString() },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);

console.log(`Owner account created for ${OWNER_EMAIL} (id ${created.id}). Credential written to ${credentialPath} (0600).`);
