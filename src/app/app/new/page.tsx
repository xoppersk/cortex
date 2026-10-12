import type { Metadata } from "next";
import Link from "next/link";
import { LedgerRow } from "../../../components/LedgerRow";
import { getConversations, getKnowledge, getPlaybooks, getThread, getWorkspaceData } from "../../../lib/api";
import { formatNumber } from "../../../lib/utils";
import { BlockedView } from "../c/[id]/thread-view";
import { ConfigSentence, QuestionForm } from "./new-chat-form";

export const metadata: Metadata = { title: { absolute: "Cortex — New chat" } };

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  if (params.state === "viewer") {
    return <BlockedView thread={getThread()} />;
  }

  const { workspace, models } = getWorkspaceData();
  const playbooks = getPlaybooks();
  const conversations = getConversations();
  const knowledge = getKnowledge();

  const ceiling = `$${workspace.perAnswerCeiling.toFixed(2)}`;
  const canSee = knowledge.collections.filter((c) =>
    ["positioning-research", "customer-interviews"].includes(c.id),
  );
  const indexing = knowledge.collections.find((c) => c.status.type === "indexing");
  const pickerCollections = [
    ...canSee,
    ...knowledge.collections.filter((c) => !canSee.some((seen) => seen.id === c.id)),
  ].map((collection) => collection.name);
  const pickUp = conversations.conversations.slice(0, 3);

  const playbookCards = [
    {
      id: playbooks.featured.id,
      name: playbooks.featured.name,
      description: "Audience, promise, proof and risks for a launch, cited.",
      meta: "6 inputs · Team",
      value: "Used today",
    },
    {
      id: playbooks.team[0]!.id,
      name: playbooks.team[0]!.name,
      description: playbooks.team[0]!.description ?? "",
      meta: `${playbooks.team[0]!.inputsLabel ?? ""} · Team`,
      value: playbooks.team[0]!.updated,
    },
    {
      id: playbooks.private[0]!.id,
      name: playbooks.private[0]!.name,
      description: playbooks.private[0]!.description ?? "",
      meta: `${playbooks.private[0]!.inputsLabel ?? ""} · Private`,
      value: playbooks.private[0]!.updated,
    },
  ];

  return (
    <div style={{ paddingTop: 32 }}>
      <div className="doc-margin">
        <div
          className="doc-column"
          style={{ display: "flex", flexDirection: "column", gap: 40 }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h1 className="page-title" style={{ fontSize: 34, margin: 0 }}>
              New conversation
            </h1>
            <ConfigSentence
              collections={pickerCollections}
              models={models.map((model) => model.name)}
              defaultModel={workspace.defaultModel}
              ceiling={ceiling}
            />
          </div>

          <QuestionForm />

          <section className="stack-3">
            <div className="page-head-row">
              <h2 className="section-label">Start from a playbook</h2>
              <Link href="/app/playbooks" style={{ fontSize: 12, color: "var(--ink-2)" }}>
                All 7 playbooks
              </Link>
            </div>
            <div className="ledger">
              {playbookCards.map((card) => (
                <LedgerRow
                  key={card.id}
                  href={`/app/c/launch-narrative?playbook=${card.id}`}
                  title={card.name}
                  description={card.description}
                  value={card.value}
                  meta={card.meta}
                />
              ))}
            </div>
          </section>

          <section className="stack-3">
            <h2 className="section-label">Pick up where you left off</h2>
            <div className="ledger">
              {pickUp.map((conversation) => (
                <LedgerRow
                  key={conversation.id}
                  href={`/app/c/${conversation.id}`}
                  title={conversation.title}
                  meta={`${conversation.sources} sources`}
                  value={conversation.edited}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">What this conversation can see</h2>
            <ul className="stack-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {canSee.map((collection) => (
                <li key={collection.id} className="caption" style={{ color: "var(--ink-2)" }}>
                  <span className="ink-text" style={{ fontWeight: 500 }}>
                    {collection.name}
                  </span>
                  <br />
                  {formatNumber(collection.passages)} passages · newest {collection.newest}
                </li>
              ))}
            </ul>
            {indexing ? (
              <p className="caption">
                <span style={{ fontWeight: 500 }}>{indexing.name}</span> is still indexing,{" "}
                {indexing.status.percent}% done. It joins this conversation automatically when
                ready.
              </p>
            ) : null}
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Cost</h2>
            <p className="caption" style={{ color: "var(--ink-2)" }}>
              Typical answer with these sources: $0.02–0.04. Your limit stops any answer at {ceiling}.
            </p>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Who can see it</h2>
            <p className="caption" style={{ color: "var(--ink-2)" }}>
              Only you, until you share it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
