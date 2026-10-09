import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getUser } from "@/lib/auth/get-user";
import { getActor, getActorTeam } from "@/lib/api/auth";
import { getConversation, getMessages } from "@/lib/data/conversations";
import { SignatureThread } from "@/components/cortex/signature-thread";
import { LiveThread, type LiveMessage } from "@/components/cortex/live-thread";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Conversation" };
export const instant = false;

/** Designed research-synthesis entry — the spec's empty-conversation state. */
function EmptyConversationState() {
  return (
    <div className="thread flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        Conversation 00 · Ready
      </p>
      <h1 className="mt-3 max-w-[20ch] text-center font-serif text-[32px] font-medium leading-tight tracking-[-0.02em]">
        Begin with a question worth keeping.
      </h1>
      <p className="mt-3 max-w-[55ch] text-center text-[15px] text-muted-foreground">
        Cortex works best when you name the decision, attach the evidence, and
        say what a useful answer should make clearer.
      </p>
      <div className="mt-8 grid w-full max-w-[520px] grid-cols-1 gap-2.5 sm:grid-cols-1">
        {[
          "Compare the three strongest objections in our buyer interviews.",
          "Draft a launch brief using only sources updated this week.",
          "Which claims in the positioning memo need stronger evidence?",
        ].map((p) => (
          <Button key={p} variant="outline" className="h-auto whitespace-normal py-3 text-left" asChild>
            <Link href={`/app/chat?prompt=${encodeURIComponent(p)}`}>{p}</Link>
          </Button>
        ))}
      </div>
    </div>
  );
}

/**
 * /app/chat/[id] — active conversation.
 * - "launch-narrative": the designed signature thread (verbatim spec copy).
 * - "research-synthesis": the spec's designed empty-conversation state.
 * - any other id: the live thread (existing chat API + persistence).
 */
export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

    if (id === "launch-narrative") {
      const user = await getUser();
      if (!user) redirect("/login?next=/app/chat/launch-narrative");
      return <SignatureThread />;
    }

  if (id === "research-synthesis") {
    const user = await getUser();
    if (!user) redirect("/login?next=/app/chat/research-synthesis");
    return <EmptyConversationState />;
  }

  const actor = await getActor();
  if (!actor) redirect(`/login?next=/app/chat/${id}`);
  const team = await getActorTeam(actor.userId);
  if (team.response) redirect("/app/blocked");

  const convo = await getConversation(team.actor.teamId, actor.userId, id).catch(
    () => null,
  );
  if (!convo) notFound();

  const messages = (await getMessages(id, team.actor.teamId).catch(() => [])) as LiveMessage[];

  return (
    <LiveThread
      conversationId={id}
      title={convo.title}
      initialMessages={messages}
      initialModelId={convo.modelId}
    />
  );
}
