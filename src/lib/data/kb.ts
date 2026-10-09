/**
 * Knowledge-base data access — demo store or Supabase (RLS-enforced).
 */
import { randomUUID } from "crypto";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { getDB, type DemoKB, type DemoDocument } from "@/lib/demo/store";
import { ensureDemoKBSeeded } from "@/lib/demo/rag";

export interface KbDTO {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  ready: boolean;
  retrievalTopK: number;
  rerankTopN: number;
  similarityThreshold: number;
  createdAt: string;
}

export interface DocumentDTO {
  id: string;
  name: string;
  status: DemoDocument["status"];
  statusError: string | null;
  chunkCount: number;
  injectionFlags: number;
  createdAt: string;
}

function demoKbToDTO(kb: DemoKB): KbDTO {
  const db = getDB();
  const docs = db.documents.filter((d) => d.kbId === kb.id);
  return {
    id: kb.id,
    name: kb.name,
    description: kb.description,
    documentCount: docs.length,
    chunkCount: docs.reduce((s, d) => s + d.chunkCount, 0),
    ready: docs.length > 0 && docs.every((d) => d.status === "ready" || d.status === "quarantined"),
    retrievalTopK: kb.retrievalTopK,
    rerankTopN: kb.rerankTopN,
    similarityThreshold: kb.similarityThreshold,
    createdAt: kb.createdAt,
  };
}

export async function listKbs(teamId: string): Promise<KbDTO[]> {
  if (isDemoMode()) {
    await ensureDemoKBSeeded();
    return getDB().kbs.filter((k) => k.teamId === teamId).map(demoKbToDTO);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .select("id,name,description,retrieval_top_k,rerank_top_n,similarity_threshold,created_at")
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const admin = createAdminClient();
  const out: KbDTO[] = [];
  for (const kb of data ?? []) {
    const { count: docs } = await admin
      .from("documents").select("id", { count: "exact", head: true }).eq("kb_id", kb.id);
    const { count: chunks } = await admin
      .from("document_chunks").select("id", { count: "exact", head: true }).eq("kb_id", kb.id);
    out.push({
      id: kb.id, name: kb.name, description: kb.description,
      documentCount: docs ?? 0, chunkCount: chunks ?? 0, ready: (chunks ?? 0) > 0,
      retrievalTopK: kb.retrieval_top_k, rerankTopN: kb.rerank_top_n,
      similarityThreshold: Number(kb.similarity_threshold), createdAt: kb.created_at,
    });
  }
  return out;
}

export async function getKb(teamId: string, kbId: string): Promise<KbDTO | null> {
  if (isDemoMode()) {
    await ensureDemoKBSeeded();
    const kb = getDB().kbs.find((k) => k.id === kbId && k.teamId === teamId);
    return kb ? demoKbToDTO(kb) : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .select("id,name,description,retrieval_top_k,rerank_top_n,similarity_threshold,created_at")
    .eq("id", kbId)
    .eq("team_id", teamId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id, name: data.name, description: data.description,
    documentCount: 0, chunkCount: 0, ready: false,
    retrievalTopK: data.retrieval_top_k, rerankTopN: data.rerank_top_n,
    similarityThreshold: Number(data.similarity_threshold), createdAt: data.created_at,
  };
}

export async function createKb(
  teamId: string,
  userId: string,
  input: { name: string; description: string },
): Promise<KbDTO> {
  if (isDemoMode()) {
    const db = getDB();
    const kb: DemoKB = {
      id: randomUUID(), teamId, name: input.name, description: input.description,
      retrievalTopK: 8, rerankTopN: 4, similarityThreshold: 0.25,
      chunkSizeTokens: 800, chunkOverlapPct: 15, createdAt: new Date().toISOString(),
    };
    db.kbs.push(kb);
    return demoKbToDTO(kb);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_bases")
    .insert({ team_id: teamId, name: input.name, description: input.description, created_by: userId })
    .select("id,name,description,retrieval_top_k,rerank_top_n,similarity_threshold,created_at")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id, name: data.name, description: data.description,
    documentCount: 0, chunkCount: 0, ready: false,
    retrievalTopK: data.retrieval_top_k, rerankTopN: data.rerank_top_n,
    similarityThreshold: Number(data.similarity_threshold), createdAt: data.created_at,
  };
}

export async function updateKb(
  teamId: string,
  kbId: string,
  patch: {
    name?: string; description?: string; chunkSizeTokens?: number;
    chunkOverlapPct?: number; retrievalTopK?: number; rerankTopN?: number;
    similarityThreshold?: number;
  },
): Promise<KbDTO | null> {
  if (isDemoMode()) {
    const db = getDB();
    const kb = db.kbs.find((k) => k.id === kbId && k.teamId === teamId);
    if (!kb) return null;
    if (patch.name !== undefined) kb.name = patch.name;
    if (patch.description !== undefined) kb.description = patch.description;
    if (patch.chunkSizeTokens !== undefined) kb.chunkSizeTokens = patch.chunkSizeTokens;
    if (patch.chunkOverlapPct !== undefined) kb.chunkOverlapPct = patch.chunkOverlapPct;
    if (patch.retrievalTopK !== undefined) kb.retrievalTopK = patch.retrievalTopK;
    if (patch.rerankTopN !== undefined) kb.rerankTopN = patch.rerankTopN;
    if (patch.similarityThreshold !== undefined) kb.similarityThreshold = patch.similarityThreshold;
    return demoKbToDTO(kb);
  }
  const supabase = await createClient();
  const columnMap: Record<string, string> = {
    name: "name", description: "description", chunkSizeTokens: "chunk_size_tokens",
    chunkOverlapPct: "chunk_overlap_pct", retrievalTopK: "retrieval_top_k",
    rerankTopN: "rerank_top_n", similarityThreshold: "similarity_threshold",
  };
  const updates: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && columnMap[k]) updates[columnMap[k]] = v;
  }
  const { error } = await supabase
    .from("knowledge_bases")
    .update(updates)
    .eq("id", kbId)
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  return getKb(teamId, kbId);
}

export async function deleteKb(teamId: string, kbId: string): Promise<boolean> {
  if (isDemoMode()) {
    const db = getDB();
    const idx = db.kbs.findIndex((k) => k.id === kbId && k.teamId === teamId);
    if (idx === -1) return false;
    db.kbs.splice(idx, 1);
    db.documents = db.documents.filter((d) => d.kbId !== kbId);
    db.chunks = db.chunks.filter((c) => c.kbId !== kbId);
    return true;
  }
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("knowledge_bases")
    .delete({ count: "exact" })
    .eq("id", kbId)
    .eq("team_id", teamId);
  if (error) throw new Error(error.message);
  return (count ?? 0) > 0;
}

export interface ChunkDTO {
  id: string;
  index: number;
  content: string;
  tokenCount: number;
  sectionHeading: string | null;
}

export async function getChunks(
  teamId: string,
  kbId: string,
  documentId: string,
): Promise<ChunkDTO[]> {
  if (isDemoMode()) {
    return getDB()
      .chunks.filter((c) => c.kbId === kbId && c.documentId === documentId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex)
      .map((c) => ({
        id: c.id, index: c.chunkIndex, content: c.content,
        tokenCount: c.tokenCount, sectionHeading: c.sectionHeading ?? null,
      }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("document_chunks")
    .select("id,chunk_index,content,token_count,metadata")
    .eq("kb_id", kbId)
    .eq("document_id", documentId)
    .eq("team_id", teamId)
    .order("chunk_index", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({
    id: c.id, index: c.chunk_index, content: c.content,
    tokenCount: c.token_count,
    sectionHeading: (c.metadata as { section_heading?: string } | null)?.section_heading ?? null,
  }));
}

export async function listDocuments(teamId: string, kbId: string): Promise<DocumentDTO[]> {
  if (isDemoMode()) {
    await ensureDemoKBSeeded();
    return getDB()
      .documents.filter((d) => d.kbId === kbId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((d) => ({
        id: d.id, name: d.name, status: d.status, statusError: d.statusError,
        chunkCount: d.chunkCount, injectionFlags: d.injectionFlags, createdAt: d.createdAt,
      }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id,name,status,status_error,chunk_count,injection_flags,created_at")
    .eq("kb_id", kbId)
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    id: d.id, name: d.name, status: d.status as DocumentDTO["status"],
    statusError: d.status_error, chunkCount: d.chunk_count,
    injectionFlags: d.injection_flags, createdAt: d.created_at,
  }));
}
