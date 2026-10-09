"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader } from "@/components/cortex/states";
import { ReadinessBadge } from "@/components/cortex/badges";
import { SCREEN_COPY, TRUTH_SETS } from "@/lib/cortex/truth";

export interface KbSummary {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  chunkCount: number;
  ready: boolean;
  indexing?: boolean;
}

/** /app/knowledge — KB card grid. Live list + truth-set seeded rows. */
export function KnowledgeView({ kbs }: { kbs: KbSummary[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const truthKbs: KbSummary[] = TRUTH_SETS.knowledge.map(([n, chunks, status], i) => ({
    id: `truth-kb-${i}`,
    name: n ?? "Seeded collection",
    description: "Seeded demo collection — replace with your own documents.",
    documentCount: [14, 8, 5][i] ?? 0,
    chunkCount: parseInt(chunks ?? "0", 10),
    ready: status === "Ready",
    indexing: status === "Indexing",
  }));

  async function create() {
    if (!name.trim()) {
      toast.error("Name the knowledge base first.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });
      if (!res.ok) {
        toast.error("Could not create the knowledge base.");
        return;
      }
      const { knowledgeBase } = await res.json();
      setOpen(false);
      router.push(`/app/knowledge/${knowledgeBase.id}`);
      router.refresh();
    } catch {
      toast.error("Could not create the knowledge base.");
    } finally {
      setCreating(false);
    }
  }

  const all = [...kbs, ...truthKbs];

  return (
    <>
      <PageHeader
        kicker="Cortex / Knowledge"
        title="Knowledge bases"
        lede={SCREEN_COPY["Knowledge bases"]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>New knowledge base</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-medium">
                  New knowledge base
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-2">
                <div>
                  <Label htmlFor="kb-name">Name</Label>
                  <Input
                    id="kb-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Support playbooks"
                    className="mt-1.5 h-11 rounded-[10px]"
                  />
                </div>
                <div>
                  <Label htmlFor="kb-desc">Description</Label>
                  <Textarea
                    id="kb-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What this collection covers."
                    className="mt-1.5 rounded-[10px]"
                    rows={2}
                  />
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Defaults: 512-token chunks, 50 overlap, top-k 8 with rerank 4, similarity ≥ 0.72.
                </p>
                <Button onClick={() => void create()} disabled={creating}>
                  {creating ? "Creating…" : "Create knowledge base"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {all.length === 0 ? (
        <EmptyState
          headline="No knowledge bases yet"
          actionLabel="Create your first"
          onAction={() => setOpen(true)}
        >
          Ingest documents and ask questions with every answer tied back to its source.
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((kb) => (
            <Link
              key={kb.id}
              href={`/app/knowledge/${kb.id}`}
              className="rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium">{kb.name}</h3>
                <ReadinessBadge
                  status={kb.ready ? "Ready" : kb.indexing ? "Indexing" : "Attention"}
                />
              </div>
              <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{kb.description}</p>
              <p className="mt-4 font-mono text-[11px] text-muted-foreground">
                {kb.documentCount} docs · {kb.chunkCount} chunks
              </p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
