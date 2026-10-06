import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { getActor, getActorTeam, jsonError } from "@/lib/api/auth";
import { getKb, listDocuments } from "@/lib/data/kb";
import { isDemoMode } from "@/lib/demo";
import { getDB, type DemoDocument } from "@/lib/demo/store";
import { DemoIngestSink, ensureDemoKBSeeded } from "@/lib/demo/rag";
import { createAdminClient } from "@/lib/supabase/admin";
import { ingestDocument, type IngestSink } from "@/lib/rag/ingest";

interface Params {
  params: Promise<{ kbId: string }>;
}

async function resolve(params: Params) {
  const actor = await getActor();
  if (!actor) return { error: jsonError("unauthorized", "Sign in first.", 401) } as const;
  const team = await getActorTeam(actor.userId);
  if (team.response) return { error: team.response } as const;
  const { kbId } = await params.params;
  const kb = await getKb(team.actor.teamId, kbId);
  if (!kb) return { error: jsonError("not_found", "Knowledge base not found.", 404) } as const;
  return { actor, team: team.actor, kb } as const;
}

export async function GET(_req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;
  return NextResponse.json({ documents: await listDocuments(r.team.teamId, r.kb.id) });
}

const ALLOWED_MIME = new Set([
  "application/pdf", "text/plain", "text/markdown", "text/csv", "text/x-csv",
]);
const MAX_BYTES = 25 * 1024 * 1024;

/** Production ingest sink factory: service_role writes, one transaction per document. */
function makeSupabaseSink(teamId: string): IngestSink {
  return {
    async setDocumentStatus(documentId, status, detail) {
      const admin = createAdminClient();
      await admin
        .from("documents")
        .update({
          status,
          status_error: detail?.error ?? null,
          chunk_count: detail?.chunkCount ?? 0,
          injection_flags: detail?.injectionFlags ?? 0,
        })
        .eq("id", documentId);
    },
    async insertChunks(kbId, documentId, _documentName, chunks) {
      void _documentName;
      const admin = createAdminClient();
      const { data: rows, error: chunkErr } = await admin
        .from("document_chunks")
        .insert(
          chunks.map((c, i) => ({
            document_id: documentId,
            kb_id: kbId,
            team_id: teamId,
            chunk_index: i,
            content: c.content,
            token_count: c.tokenCount,
            metadata: { section_heading: c.sectionHeading },
          })),
        )
        .select("id");
      if (chunkErr) throw new Error(`chunk insert failed: ${chunkErr.message}`);
      const { error: embErr } = await admin.from("embeddings").insert(
        (rows ?? []).map((row, i) => ({
          chunk_id: row.id,
          kb_id: kbId,
          team_id: teamId,
          embedding: `[${chunks[i]!.vector!.join(",")}]`,
        })),
      );
      if (embErr) throw new Error(`embedding insert failed: ${embErr.message}`);
    },
  };
}

export async function POST(req: Request, params: Params) {
  const r = await resolve(params);
  if ("error" in r) return r.error;

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return jsonError("invalid_request", "Upload a file as multipart field 'file'.", 400);
  }
  const mimeOk =
    ALLOWED_MIME.has(file.type) || /\.(pdf|txt|md|markdown|csv)$/i.test(file.name);
  if (!mimeOk) {
    return jsonError("invalid_request", "Only PDF, TXT, MD, and CSV files are accepted.", 400);
  }
  if (file.size > MAX_BYTES) {
    return jsonError("invalid_request", "File exceeds the 25 MB limit.", 400);
  }
  if (file.size === 0) {
    return jsonError("invalid_request", "The file is empty.", 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const documentId = randomUUID();

  if (isDemoMode()) {
    const db = getDB();
    await ensureDemoKBSeeded();
    const doc: DemoDocument = {
      id: documentId, kbId: r.kb.id, name: file.name, status: "queued",
      statusError: null, chunkCount: 0, injectionFlags: 0,
      createdAt: new Date().toISOString(),
    };
    db.documents.push(doc);
    // Ingest inline (fast for text fixtures); the UI polls GET for status.
    const result = await ingestDocument(
      {
        kbId: r.kb.id, documentId, documentName: file.name,
        mimeType: file.type || "text/plain", bytes,
        chunkOptions: { chunkSizeTokens: 800, overlapPct: 0.15 },
      },
      new DemoIngestSink(),
    );
    return NextResponse.json({ document: { ...doc, status: result.status }, result }, { status: 201 });
  }

  // Production: create the document row, then ingest inline (a background
  // worker/queue replaces this in the scaled deployment — see runbook).
  const admin = createAdminClient();
  const { data: kbRow } = await admin
    .from("knowledge_bases")
    .select("team_id")
    .eq("id", r.kb.id)
    .single();

  const { error: docErr } = await admin.from("documents").insert({
    id: documentId,
    kb_id: r.kb.id,
    team_id: kbRow?.team_id ?? r.team.teamId,
    name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
    status: "queued",
    uploaded_by: r.actor.userId,
  });
  if (docErr) return jsonError("db_error", docErr.message, 500);

  const teamId = kbRow?.team_id ?? r.team.teamId;
  const sink = makeSupabaseSink(teamId);
  const result = await ingestDocument(
    {
      kbId: r.kb.id, documentId, documentName: file.name,
      mimeType: file.type, bytes,
      chunkOptions: { chunkSizeTokens: 800, overlapPct: 0.15 },
    },
    sink,
  );
  return NextResponse.json({ documentId, result }, { status: 201 });
}
