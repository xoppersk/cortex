import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "../../../components/Icon";
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
  const canSee = ["positioning-research", "customer-interviews"]
    .map((id) => knowledge.collections.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
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
    <>
      <header className="pv-ph" style={{ paddingTop: 14, paddingBottom: 14 }}>
        <span className="pv-ph-sub" style={{ fontSize: 12.5 }}>
          <Link href="/app/history">Conversations</Link>
          <span className="pv-crumb-sep" aria-hidden="true">
            /
          </span>
          <span style={{ color: "var(--ink)" }}>New conversation</span>
        </span>
        <span style={{ display: "flex", gap: 8 }}>
          <span className="pv-chip">{workspace.defaultModel}</span>
          <span className="pv-chip">
            <Icon name="lock" />
            Only you
          </span>
        </span>
      </header>

      <div className="pv-split">
        <div className="pv-new-main">
          <header style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="pv-display-title">New conversation</h1>
            <ConfigSentence
              collections={pickerCollections}
              models={models.map((model) => model.name)}
              defaultModel={workspace.defaultModel}
              ceiling={ceiling}
            />
          </header>

          <QuestionForm />

          <section aria-labelledby="new-playbooks" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="pv-sources-head">
              <h2 id="new-playbooks" className="pv-lbl">
                Start from a playbook
              </h2>
              <Link href="/app/playbooks">All 7 playbooks</Link>
            </div>
            <div className="pv-pbc-grid">
              {playbookCards.map((card) => (
                <Link key={card.id} href={`/app/c/launch-narrative?playbook=${card.id}`} className="pv-pbc pv-card pv-card-hover">
                  <span className="pv-pbc-top">
                    <Icon name="book" style={{ color: "var(--ink)" }} />
                    <span>{card.value}</span>
                  </span>
                  <b className="pv-pbc-name">{card.name}</b>
                  <span className="pv-pbc-desc">{card.description}</span>
                  <span className={card.meta.endsWith("Private") ? "pv-tag pv-tag-ln" : "pv-tag"} style={{ alignSelf: "flex-start", marginTop: "auto" }}>
                    {card.meta}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="new-recent" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 id="new-recent" className="pv-lbl">
              Pick up where you left off
            </h2>
            <div className="pv-card pv-rows" style={{ overflow: "hidden" }}>
              {pickUp.map((conversation) => (
                <Link key={conversation.id} href={`/app/c/${conversation.id}`} className="pv-row pv-rec-row">
                  <b>
                    <Icon name="chat" style={{ color: "var(--ink-3)" }} />
                    {conversation.title}
                  </b>
                  <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{conversation.sources} sources</span>
                  <span className="pv-mono" style={{ fontSize: 12, color: "var(--ink-4)", textAlign: "right" }}>
                    {conversation.edited}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="pv-side" aria-label="What this conversation can see" style={{ paddingTop: 56, gap: 22 }}>
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 className="pv-lbl">What this conversation can see</h2>
            {canSee.map((collection) => (
              <div key={collection.id} className="margin-note">
                <span className="margin-note-number" style={{ background: "var(--ink)", color: "var(--on-ink)" }} aria-hidden="true">
                  ✓
                </span>
                <span>
                  <span className="margin-note-title">{collection.name}</span>
                  <br />
                  {formatNumber(collection.passages)} passages · newest {collection.newest}
                </span>
              </div>
            ))}
            {indexing ? (
              <div className="pv-card" style={{ margin: "0 -8px", padding: "12px 14px", gap: 8, color: "var(--ink-3)" }}>
                <span>
                  <b>{indexing.name}</b> is still indexing, {indexing.status.percent}% done. It joins this conversation
                  automatically when ready.
                </span>
                <span className="pv-bar" role="img" aria-label={`${indexing.status.percent}% indexed`}>
                  <i style={{ width: `${indexing.status.percent}%` }} />
                </span>
              </div>
            ) : null}
          </section>
          <section className="pv-side-sec">
            <h2 className="pv-lbl">Cost</h2>
            <span>
              Typical answer with these sources:{" "}
              <span className="pv-mono" style={{ color: "var(--ink)", whiteSpace: "nowrap" }}>
                $0.02–0.04
              </span>
              . Your limit stops any answer at <span className="pv-mono" style={{ color: "var(--ink)" }}>{ceiling}</span>.
            </span>
          </section>
          <section className="pv-side-sec">
            <h2 className="pv-lbl">Who can see it</h2>
            <span>Only you, until you share it.</span>
          </section>
        </aside>
      </div>
    </>
  );
}
