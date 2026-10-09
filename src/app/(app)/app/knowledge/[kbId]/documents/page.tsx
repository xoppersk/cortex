import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { getKb, listDocuments } from "@/lib/data/kb";
import { DocumentsView, type DocSummary } from "@/components/cortex/documents-view";

export const metadata: Metadata = { title: "Documents" };

const TRUTH_DOCS: Record<string, { name: string; docs: string[]; chunks: number[] }> = {
  "truth-kb-0": {
    name: "Customer interviews",
    docs: ["Interview transcript — batch 1.pdf", "Interview transcript — batch 2.pdf", "Synthesis working notes.md"],
    chunks: [148, 162, 116],
  },
  "truth-kb-1": {
    name: "Positioning research",
    docs: ["Positioning brief v3.pdf", "Competitive notes.md"],
    chunks: [104, 84],
  },
  "truth-kb-2": {
    name: "Pricing archive",
    docs: ["2025 pricing tiers.csv", "Discount policy.md"],
    chunks: [41, 51],
  },
};

export default async function DocumentsPage({
  params,
}: {
  params: Promise<{ kbId: string }>;
}) {
  const { kbId } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/login?next=/app/knowledge/${kbId}/documents`);
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  if (kbId.startsWith("truth-kb-")) {
    const seed = TRUTH_DOCS[kbId];
    if (!seed) notFound();
    const docs: DocSummary[] = seed.docs.map((name, i) => ({
      id: `truth-doc-${i}`,
      name,
      status: kbId === "truth-kb-2" && i === 0 ? "processing" : "ready",
      statusError: null,
      chunkCount: seed.chunks[i] ?? 0,
      injectionFlags: 0,
      createdAt: "2026-10-05",
    }));
    return <DocumentsView kbId={kbId} kbName={seed.name} initialDocs={docs} seeded />;
  }

  const kb = await getKb(team.actor.teamId, kbId).catch(() => null);
  if (!kb) notFound();
  const docs = await listDocuments(team.actor.teamId, kbId).catch(() => []);

  return (
    <DocumentsView
      kbId={kbId}
      kbName={kb.name}
      initialDocs={docs.map(
        (d): DocSummary => ({
          id: d.id,
          name: d.name,
          status: d.status,
          statusError: d.statusError,
          chunkCount: d.chunkCount,
          injectionFlags: d.injectionFlags,
          createdAt: d.createdAt,
        }),
      )}
    />
  );
}
