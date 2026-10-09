"use client";

import { Sparkline } from "./kpi";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

/** MemberDrawer — member summary, recent conversations, top models, trend. */
export function MemberDrawer({
  member,
  onOpenChange,
}: {
  member: {
    name: string;
    role: string;
    conversations: string[];
    models: string[];
    spark: number[];
    tokens: string;
  } | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={!!member} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] p-0" aria-label="Member detail">
        {member && (
          <>
            <SheetHeader className="border-b border-border p-5 text-left">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted font-mono text-sm">
                  {member.name.split(" ").map((w) => w[0]).join("")}
                </span>
                <div>
                  <SheetTitle className="font-serif text-xl font-medium">{member.name}</SheetTitle>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                </div>
              </div>
            </SheetHeader>
            <div className="flex flex-col gap-5 p-5">
              <div>
                <p className="cortex-nav-label !px-0">Usage trend</p>
                <Sparkline data={member.spark} className="h-10 w-full" />
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{member.tokens} tokens this month</p>
              </div>
              <div>
                <p className="cortex-nav-label !px-0">Recent conversations</p>
                <ul className="mt-1 flex flex-col gap-2 text-sm">
                  {member.conversations.map((t) => (
                    <li key={t} className="rounded-lg border border-border px-3 py-2">{t}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="cortex-nav-label !px-0">Top models</p>
                <p className="font-mono text-[12px] text-muted-foreground">{member.models.join(" · ")}</p>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
