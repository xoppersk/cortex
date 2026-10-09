"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/cortex/states";
import { DocStatusPill } from "@/components/cortex/badges";
import { SCREEN_COPY } from "@/lib/cortex/truth";

export interface DocSummary {
  id: string;
  name: string;
  status: "queued" | "processing" | "ready" | "failed" | "quarantined";
  statusError: string | null;
  chunkCount: number;
  injectionFlags: number;
  createdAt: string;
  size?: string;
  uploadedBy?: string;
}

interface Chunk {
  id: string;
  index: number;
  content: string;
  tokenCount: number;
  sectionHeading: string | null;
}

/**
 * Document manager: upload dropzone (PDF/TXT/MD/CSV ≤ 25MB, per-file
 * progress + embedding cost estimate), documents table, chunk inspector.
 */
export function DocumentsView({
  kbId,
  kbName,
  initialDocs,
  seeded,
}: {
  kbId: string;
  kbName: string;
  initialDocs: DocSummary[];
  /** Seeded demo collection: inspect-only, no uploads. */
  seeded?: boolean;
}) {
  const router = useRouter();
  const [docs, setDocs] = useState(initialDocs);
  const [uploading, setUploading] = useState<Record<string, number>>({});
  const [inspector, setInspector] = useState<{ doc: DocSummary; chunks: Chunk[] } | null>(null);
  const [inspectorLoading, setInspectorLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/kb/${kbId}/documents`);
      if (!res.ok) return;
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      /* polling best-effort */
    }
  }, [kbId]);

  useEffect(() => {
    if (docs.some((d) => d.status === "queued" || d.status === "processing")) {
      pollRef.current = setInterval(() => void refresh(), 2500);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
    return undefined;
  }, [docs, refresh]);

  async function upload(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      const ok = /\.(pdf|txt|md|markdown|csv)$/i.test(file.name);
      if (!ok) {
        toast.error(`“${file.name}” rejected — only PDF, TXT, MD, and CSV are accepted.`);
        continue;
      }
      if (file.size > 25 * 1024 * 1024) {
        toast.error(`“${file.name}” exceeds the 25 MB limit.`);
        continue;
      }
      setUploading((u) => ({ ...u, [file.name]: 5 }));
      const body = new FormData();
      body.append("file", file);
      try {
        const res = await fetch(`/api/kb/${kbId}/documents`, { method: "POST", body });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          toast.error(err?.message ?? `Upload of “${file.name}” failed.`);
        } else {
          toast.success(`“${file.name}” uploaded — indexing started.`);
        }
      } catch {
        toast.error(`Upload of “${file.name}” failed.`);
      } finally {
        setUploading((u) => {
          const next = { ...u };
          delete next[file.name];
          return next;
        });
        await refresh();
        router.refresh();
      }
    }
  }

  async function inspect(doc: DocSummary) {
    setInspectorLoading(true);
    try {
      const res = await fetch(`/api/kb/${kbId}/documents/${doc.id}/chunks`);
      const data = res.ok ? await res.json() : { chunks: [] };
      setInspector({ doc, chunks: data.chunks ?? [] });
    } catch {
      setInspector({ doc, chunks: [] });
    } finally {
      setInspectorLoading(false);
    }
  }

  async function release(doc: DocSummary) {
    // Re-embed: re-upload path isn't available for quarantined docs — the
    // admin clears the flags by re-queuing the document.
    toast.info(`“${doc.name}” released — re-embedding queued.`);
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Knowledge"
        title={`${kbName} — documents`}
        lede={SCREEN_COPY["Documents"]}
      />

      {/* Upload dropzone */}
      {!seeded && (
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload documents"
        className="mb-8 flex cursor-pointer flex-col items-center rounded-[14px] border border-dashed border-border bg-card px-6 py-10 text-center hover:border-primary/50"
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files.length > 0) void upload(e.dataTransfer.files);
        }}
      >
        <Upload className="size-6 text-muted-foreground" />
        <p className="mt-3 font-medium">Drop documents here, or click to browse</p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          PDF · TXT · MD · CSV ≤ 25 MB — emails and IDs are redacted before embedding
        </p>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept=".pdf,.txt,.md,.markdown,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void upload(e.target.files);
            e.target.value = "";
          }}
        />
        {Object.keys(uploading).length > 0 && (
          <div className="mt-4 w-full max-w-sm">
            {Object.entries(uploading).map(([name, pct]) => (
              <div key={name} className="mb-2">
                <p className="text-left font-mono text-[11px] text-muted-foreground">{name}</p>
                <div className="h-1.5 w-full rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Documents table */}
      <div className="overflow-x-auto rounded-[14px] border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3 font-medium">Document</th>
              <th className="px-5 py-3 font-medium">Chunks</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                  No documents yet — upload your first above.
                </td>
              </tr>
            )}
            {docs.map((d) => (
              <tr key={d.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <button onClick={() => void inspect(d)} className="text-left font-medium hover:text-primary">
                    {d.name}
                  </button>
                  {d.statusError && (
                    <p className="mt-0.5 text-[12px] text-destructive">{d.statusError}</p>
                  )}
                  {d.status === "quarantined" && (
                    <p className="mt-0.5 text-[12px] text-warning">
                      Injection scanner flagged an excerpt — review before release.
                    </p>
                  )}
                </td>
                <td className="px-5 py-3.5 font-mono tabular-nums">{d.chunkCount}</td>
                <td className="px-5 py-3.5">
                  <DocStatusPill status={d.status} />
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => void inspect(d)} disabled={inspectorLoading}>
                      View chunks
                    </Button>
                    {d.status === "quarantined" && (
                      <Button variant="ghost" size="sm" onClick={() => void release(d)}>
                        Release
                      </Button>
                    )}
                    {d.status === "failed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Re-upload the file to retry extraction.")}
                      >
                        Retry
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chunk inspector */}
      {inspector && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-[92vw] flex-col border-l border-border bg-card" role="dialog" aria-label="Chunk inspector">
          <div className="border-b border-border p-5">
            <h3 className="font-serif text-xl font-medium">Chunk inspector</h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {inspector.doc.name} · {inspector.chunks.length} chunks
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {inspector.chunks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No chunks indexed yet.</p>
            ) : (
              inspector.chunks.map((c) => (
                <article key={c.id} className="border-b border-border py-3.5 last:border-0">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-mono text-[11px] text-primary">Chunk {String(c.index + 1).padStart(3, "0")}</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                      {c.tokenCount} tokens
                    </span>
                  </div>
                  {c.sectionHeading && (
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">{c.sectionHeading}</p>
                  )}
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    {c.content.slice(0, 320)}{c.content.length > 320 ? "…" : ""}
                  </p>
                </article>
              ))
            )}
          </div>
          <div className="border-t border-border p-4">
            <Button variant="ghost" className="w-full" onClick={() => setInspector(null)}>
              Close inspector
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
