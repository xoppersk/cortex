import { getThread } from "../../../../lib/api";
import { ThreadView, type ThreadState } from "./thread-view";

export default async function ConversationPage({
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const query = await searchParams;
  const thread = getThread();

  const state: ThreadState =
    query.state === "sources-down"
      ? "sources-down"
      : query.state === "limit"
        ? "limit"
        : query.state === "viewer"
          ? "viewer"
          : "normal";

  return <ThreadView thread={thread} state={state} />;
}
