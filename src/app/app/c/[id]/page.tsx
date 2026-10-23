import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getConversation, getThread } from "../../../../lib/api";
import { ThreadView, type ThreadState } from "./thread-view";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const query = await searchParams;
  const title =
    query.state === "sources-down"
      ? "Cortex — Sources unavailable"
      : query.state === "limit"
        ? "Cortex — Spending limit reached"
        : query.state === "viewer"
          ? "Cortex — Read-only access"
          : "Cortex — Active conversation";
  return { title: { absolute: title } };
}

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const conversation = await getConversation(id);
  if (!conversation) notFound();
  const thread = await getThread(id);

  const state: ThreadState =
    query.state === "sources-down"
      ? "sources-down"
      : query.state === "limit"
        ? "limit"
        : query.state === "viewer"
          ? "viewer"
          : "normal";

  return <ThreadView thread={thread} state={state} conversationId={id} />;
}
