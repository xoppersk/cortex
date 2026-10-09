"use client";

import { useState } from "react";
import { Pencil, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Thread header: inline-editable title, subtitle, model/status pill, share menu. */
export function ChatHead({
  title,
  subtitle,
  status,
  editable,
  onRename,
}: {
  title: string;
  subtitle?: string;
  status: string;
  editable?: boolean;
  onRename?: (title: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);

  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5 md:px-10">
      <div className="min-w-0">
        {editing && editable ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              setEditing(false);
              onRename?.(draft);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setEditing(false);
                onRename?.(draft);
              }
            }}
            className="w-full border-b border-primary bg-transparent font-serif text-xl font-medium outline-none"
            aria-label="Conversation title"
          />
        ) : (
          <div className="flex items-center gap-2">
            <strong className="truncate font-serif text-xl font-medium">{title}</strong>
            {editable && (
              <button
                onClick={() => setEditing(true)}
                className="rounded p-1 text-muted-foreground hover:text-foreground"
                aria-label="Rename conversation"
              >
                <Pencil className="size-3.5" />
              </button>
            )}
          </div>
        )}
        {subtitle && (
          <small className="mt-1 block font-mono text-[11px] text-muted-foreground">
            {subtitle}
          </small>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-muted px-3 py-1.5 font-mono text-[11px] font-medium text-primary">
          {status}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Share or export">
              <Share2 className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Copy link</DropdownMenuItem>
            <DropdownMenuItem>Export as Markdown</DropdownMenuItem>
            <DropdownMenuItem>Export as PDF</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
