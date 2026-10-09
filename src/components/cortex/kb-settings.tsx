"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** KB settings tab (admin): chunking sliders, top-k/rerank, threshold, delete. */
export function KbSettings({
  kbId,
  initial,
  readOnly,
}: {
  kbId: string;
  initial: { topK: number; rerankN: number; threshold: number };
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [topK, setTopK] = useState(initial.topK);
  const [rerankN, setRerankN] = useState(initial.rerankN);
  const [threshold, setThreshold] = useState(initial.threshold);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/kb/${kbId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          retrievalTopK: topK,
          rerankTopN: rerankN,
          similarityThreshold: threshold,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        toast.error(err?.message ?? "Save failed.");
        return;
      }
      toast.success("Retrieval settings saved");
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function destroy() {
    try {
      const res = await fetch(`/api/kb/${kbId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Could not delete the knowledge base.");
        return;
      }
      toast.success("Knowledge base deleted");
      router.push("/app/knowledge");
      router.refresh();
    } catch {
      toast.error("Could not delete the knowledge base.");
    }
  }

  if (readOnly) {
    return (
      <p className="text-sm text-muted-foreground">
        Retrieval settings are admin-only. Ask a workspace admin to tune this
        knowledge base.
      </p>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <section>
        <h3 className="font-serif text-xl font-medium">Retrieval tuning</h3>
        <div className="mt-5 flex flex-col gap-6">
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Retrieval top-k</Label>
              <span className="font-mono text-[12px]">{topK}</span>
            </div>
            <Slider
              value={[topK]}
              onValueChange={([v]) => setTopK(v ?? 8)}
              min={1}
              max={20}
              step={1}
              className="mt-2"
              aria-label="Retrieval top-k"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Rerank top-n</Label>
              <span className="font-mono text-[12px]">{rerankN}</span>
            </div>
            <Slider
              value={[rerankN]}
              onValueChange={([v]) => setRerankN(v ?? 4)}
              min={1}
              max={10}
              step={1}
              className="mt-2"
              aria-label="Rerank top-n"
            />
          </div>
          <div>
            <div className="flex items-baseline justify-between">
              <Label>Similarity threshold</Label>
              <span className="font-mono text-[12px]">{threshold.toFixed(2)}</span>
            </div>
            <Slider
              value={[threshold]}
              onValueChange={([v]) => setThreshold(v ?? 0.72)}
              min={0}
              max={1}
              step={0.01}
              className="mt-2"
              aria-label="Similarity threshold"
            />
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              Embedding model: text-embedding-3-small
            </p>
          </div>
          <Button onClick={() => void save()} disabled={saving} className="w-fit">
            {saving ? "Saving…" : "Save retrieval settings"}
          </Button>
        </div>
      </section>

      <section className="rounded-[14px] border border-destructive/40 p-6">
        <h3 className="font-serif text-xl font-medium text-destructive">Delete knowledge base</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This permanently removes the knowledge base, its documents, and all
          embeddings. Answers that cited it keep their text but lose their
          evidence links.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
              Delete knowledge base
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this knowledge base?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. All documents, chunks, and eval history
                for this collection will be removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => void destroy()} className="bg-destructive">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  );
}
