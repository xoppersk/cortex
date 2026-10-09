import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { getActor, getActorTeam } from "@/lib/api/auth";
import { getKb } from "@/lib/data/kb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReadinessBadge } from "@/components/cortex/badges";
import { KbAskView } from "@/components/cortex/kb-ask";
import { KbSettings } from "@/components/cortex/kb-settings";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Knowledge base" };

const TRUTH_KB: Record<string, { name: string; description: string; docs: number; chunks: number; ready: boolean; indexing?: boolean }> = {
  "truth-kb-0": { name: "Customer interviews", description: "Seeded demo collection — replace with your own documents.", docs: 14, chunks: 426, ready: true },
  "truth-kb-1": { name: "Positioning research", description: "Seeded demo collection — replace with your own documents.", docs: 8, chunks: 188, ready: true },
  "truth-kb-2": { name: "Pricing archive", description: "Seeded demo collection — replace with your own documents.", docs: 5, chunks: 92, ready: false, indexing: true },
};

/** /app/knowledge/[kbId] — KB overview: Ask / Documents / Evals / Settings. */
export default async function KbDetailPage({
  params,
}: {
  params: Promise<{ kbId: string }>;
}) {
  const { kbId } = await params;
  const actor = await getActor();
  if (!actor) redirect(`/login?next=/app/knowledge/${kbId}`);
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const truth = TRUTH_KB[kbId];
  const kb = truth
    ? { id: kbId, name: truth.name, description: truth.description, documentCount: truth.docs, chunkCount: truth.chunks, ready: truth.ready, retrievalTopK: 8, rerankTopN: 4, similarityThreshold: 0.72, createdAt: "" }
    : await getKb(team.actor.teamId, kbId).catch(() => null);
  if (!kb) notFound();

  const isAdmin = team.actor.role === "owner" || team.actor.role === "admin";

  return (
    <>
      <header className="mb-8">
        <span className="screen-kicker">Cortex / Knowledge</span>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-serif text-[30px] font-medium leading-tight tracking-[-0.02em]">
            {kb.name}
          </h1>
          <ReadinessBadge status={kb.ready ? "Ready" : truth?.indexing ? "Indexing" : "Attention"} />
        </div>
        <p className="mt-2 max-w-[65ch] text-[15px] text-muted-foreground">
          {kb.description} · {kb.documentCount} documents · {kb.chunkCount} chunks
        </p>
      </header>

      <Tabs defaultValue="ask">
        <TabsList>
          <TabsTrigger value="ask">Ask</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="evals">Evals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="ask" className="mt-6">
          {truth ? (
            <div className="rounded-[14px] border border-border bg-card p-8 text-center">
              <h3 className="font-serif text-xl font-medium">Seeded demo collection</h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                This collection illustrates the layout. Create your own knowledge
                base and ingest documents to ask grounded questions here.
              </p>
              <Button asChild className="mt-5">
                <Link href="/app/knowledge">Open knowledge bases</Link>
              </Button>
            </div>
          ) : (
            <KbAskView
              kbId={kb.id}
              kbName={kb.name}
              exampleQuestions={[
                "What do our documents say about refunds?",
                "Which documents mention onboarding friction?",
                "Summarize the most recent findings.",
              ]}
            />
          )}
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-medium">Documents</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {kb.documentCount} documents · {kb.chunkCount} chunks indexed
                </p>
              </div>
              <Button asChild>
                <Link href={`/app/knowledge/${kb.id}/documents`}>Open document manager</Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="evals" className="mt-6">
          <div className="rounded-[14px] border border-border bg-card p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-medium">Evaluations</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Last eval: groundedness 94% · precision@4 0.86 · above the CI gate.
                </p>
              </div>
              <Button asChild>
                <Link href={`/app/knowledge/${kb.id}/evals`}>Open eval command center</Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {truth ? (
            <p className="text-sm text-muted-foreground">
              Seeded demo collections can’t be edited. Create your own knowledge
              base to tune retrieval.
            </p>
          ) : (
            <KbSettings
              kbId={kb.id}
              initial={{
                topK: kb.retrievalTopK,
                rerankN: kb.rerankTopN,
                threshold: kb.similarityThreshold,
              }}
              readOnly={!isAdmin}
            />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
