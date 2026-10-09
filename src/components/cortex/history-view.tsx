"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderInput, Pin, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, PageHeader } from "@/components/cortex/states";
import { SCREEN_COPY } from "@/lib/cortex/truth";

export interface HistoryConversation {
  id: string;
  title: string;
  modelId: string;
  folder: string | null;
  pinned: boolean;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
}

interface Hit {
  conversationId: string;
  title: string;
  snippet: string;
  lastMessageAt: string | null;
}

/** /app/history — searchable archive. Live list + debounced search API. */
export function HistoryView({ initial }: { initial: HistoryConversation[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = res.ok ? await res.json() : { hits: [] };
        setHits(data.hits ?? []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  function onQueryChange(value: string) {
    setQuery(value);
    if (value.trim()) {
      setLoading(true);
    } else {
      setHits(null);
      setLoading(false);
    }
  }

  const pinned = useMemo(() => initial.filter((c) => c.pinned), [initial]);
  const rest = useMemo(() => initial.filter((c) => !c.pinned), [initial]);

  async function bulk(action: "pin" | "delete" | "folder") {
    for (const id of selected) {
      try {
        if (action === "delete") {
          await fetch(`/api/conversations/${id}`, { method: "DELETE" });
        } else {
          await fetch(`/api/conversations/${id}`, {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(
              action === "pin" ? { pinned: true } : { folder: "Q4 Launch" },
            ),
          });
        }
      } catch {
        /* per-item failures surface on refresh */
      }
    }
    setSelected([]);
    router.refresh();
  }

  function row(c: HistoryConversation) {
    const checked = selected.includes(c.id);
    return (
      <article
        key={c.id}
        className="flex items-center gap-3 border-b border-border py-3.5 last:border-0"
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={() =>
            setSelected((s) => (checked ? s.filter((x) => x !== c.id) : [...s, c.id]))
          }
          aria-label={`Select ${c.title}`}
          className="size-4 accent-[#6D5CFF]"
        />
        <div className="min-w-0 flex-1">
          <Link href={`/app/chat/${c.id}`} className="truncate font-medium hover:text-primary">
            {c.title}
          </Link>
          <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
            {c.messageCount} messages
            {c.lastMessageAt ? ` · ${new Date(c.lastMessageAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}
            {c.folder ? ` · ${c.folder}` : ""}
          </p>
        </div>
        {c.pinned && <Pin className="size-3.5 shrink-0 text-primary" aria-label="Pinned" />}
      </article>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Workspace"
        title="History"
        lede={SCREEN_COPY["History"]}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search conversations…"
            className="h-11 rounded-[10px] pl-9"
            aria-label="Search conversations"
          />
        </div>
        <Button variant="outline" asChild>
          <Link href="/app/chat">New conversation</Link>
        </Button>
      </div>

      {query.trim() ? (
        <section aria-label="Search results">
          {loading ? (
            <p className="font-mono text-[12px] text-muted-foreground">Searching…</p>
          ) : hits && hits.length > 0 ? (
            hits.map((h) => (
              <article key={h.conversationId} className="border-b border-border py-3.5">
                <Link href={`/app/chat/${h.conversationId}`} className="font-medium hover:text-primary">
                  {h.title}
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{h.snippet}</p>
              </article>
            ))
          ) : (
            <EmptyState
              headline={`No results for “${query}”`}
              actionLabel="Start a new conversation"
              actionHref="/app/chat"
            >
              Try a shorter query, or check the spelling.
            </EmptyState>
          )}
        </section>
      ) : initial.length === 0 ? (
        <EmptyState headline="No conversations yet" actionLabel="Start your first chat" actionHref="/app/chat">
          Tips: start your first chat, or import a playbook from the library.
        </EmptyState>
      ) : (
        <section>
          {pinned.length > 0 && (
            <>
              <p className="cortex-nav-label !px-0">Pinned</p>
              <div>{pinned.map(row)}</div>
            </>
          )}
          <p className="cortex-nav-label mt-4 !px-0">All conversations</p>
          <div>{rest.map(row)}</div>
        </section>
      )}

      {selected.length > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-[0_8px_30px_rgb(0_0_0/0.25)]">
          <span className="font-mono text-[12px] text-muted-foreground">
            {selected.length} selected
          </span>
          <Button size="sm" variant="ghost" onClick={() => bulk("pin")}>
            <Pin className="size-3.5" /> Pin
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulk("folder")}>
            <FolderInput className="size-3.5" /> Move to folder
          </Button>
          <Button size="sm" variant="ghost" onClick={() => bulk("delete")}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      )}
    </>
  );
}
