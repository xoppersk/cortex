import { getConversation, getThread } from "../../../../lib/api";
import { ThreadView, type ThreadState } from "./thread-view";

export default async function ConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const query = await searchParams;

  const thread = getThread();
  const conversation = getConversation(id);

  const state: ThreadState =
    query.state === "sources-down" ? "sources-down" : query.state === "limit" ? "limit" : "normal";

  return (
    <ThreadView
      thread={thread}
      title={conversation?.title ?? thread.header.title}
      meta={thread.header.meta}
      state={state}
    />
  );
}
