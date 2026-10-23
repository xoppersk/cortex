import type { Metadata } from "next";
import Link from "next/link";
import { IconBook, IconChat } from "../../../components/icons";
import { getConversations, getKnowledge, getPlaybooks, getWorkspaceData } from "../../../lib/api";
import { formatNumber } from "../../../lib/utils";
import { ConfigSentence, QuestionForm } from "./new-chat-form";

export const metadata: Metadata = { title: { absolute: "Cortex — New chat" } };

export default async function NewConversationPage() {
  const { workspace, models } = await getWorkspaceData();
  const playbooks = await getPlaybooks();
  const conversations = await getConversations();
  const knowledge = await getKnowledge();

  const ceiling = `$${workspace.perAnswerCeiling.toFixed(2)}`;
  const canSee = knowledge.collections.slice(0, 2);
  const indexing = knowledge.collections.find((c) => c.status.type === "indexing");
  const pickerCollections = [
    ...canSee,
    ...knowledge.collections.filter((c) => !canSee.some((seen) => seen.id === c.id)),
  ].map((collection) => collection.name);
  const pickUp = conversations.conversations.slice(0, 3);

  const playbookCards = [
    ...(playbooks.featured.id
      ? [{
          id: playbooks.featured.id,
          name: playbooks.featured.name,
          description: playbooks.featured.description ?? "",
          meta: `${playbooks.featured.inputs} · Team`,
          outline: false,
          value: playbooks.featured.updated,
        }]
      : []),
    ...(playbooks.team[0]
      ? [{
          id: playbooks.team[0].id,
          name: playbooks.team[0].name,
          description: playbooks.team[0].description ?? "",
          meta: `${playbooks.team[0].inputsLabel ?? ""} · Team`,
          outline: false,
          value: playbooks.team[0].updated,
        }]
      : []),
    ...(playbooks.private[0]
      ? [{
          id: playbooks.private[0].id,
          name: playbooks.private[0].name,
          description: playbooks.private[0].description ?? "",
          meta: `${playbooks.private[0].inputsLabel ?? ""} · Private`,
          outline: true,
          value: playbooks.private[0].updated,
        }]
      : []),
  ];

  return (
    <>
      <header className="ph ws-ph-tight">
        <span className="ws-crumb">
          <Link href="/app/history">Conversations</Link>
          <span className="sep">/</span>
          <span className="here">New conversation</span>
        </span>
        <span className="ws-ph-actions">
          <span className="chip">{workspace.defaultModel}</span>
          <span className="chip">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
              style={{ width: 13, height: 13 }}
            >
              <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
            </svg>
            Only you
          </span>
        </span>
      </header>

      <div className="ws-split">
        <div className="ws-doc-new">
          <header style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <h1 className="ws-new-h1">New conversation</h1>
            <ConfigSentence
              collections={pickerCollections}
              models={models.map((model) => model.name)}
              defaultModel={workspace.defaultModel}
              ceiling={ceiling}
            />
          </header>

          <QuestionForm />

          <section aria-labelledby="pb" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="ws-section-head">
              <h2 id="pb" className="lbl">
                Start from a playbook
              </h2>
              <Link href="/app/playbooks">All playbooks</Link>
            </div>
            <div className="ws-pbc-grid">
              {playbookCards.map((card) => (
                <Link key={card.id} href={`/app/playbooks/${card.id}/edit`} className="ws-pbc">
                  <span className="ws-pbc-top">
                    <IconBook />
                    <span>{card.value}</span>
                  </span>
                  <b>{card.name}</b>
                  <span className="ws-pbc-desc">{card.description}</span>
                  <span className={card.outline ? "tag ln" : "tag"}>{card.meta}</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="rc" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 id="rc" className="lbl">
              Pick up where you left off
            </h2>
            <div className="card" style={{ overflow: "hidden" }}>
              {pickUp.map((conversation) => (
                <Link key={conversation.id} href={`/app/c/${conversation.id}`} className="ws-nrow">
                  <b>
                    <IconChat />
                    {conversation.title}
                  </b>
                  <span className="srcs">{conversation.sources} sources</span>
                  <span className="when">{conversation.edited}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <aside className="ws-aside ws-aside-new" aria-label="What this conversation can see">
          <section className="ws-aside-section">
            <h2 className="lbl">What this conversation can see</h2>
            {canSee.map((collection) => (
              <div key={collection.id} className="src">
                <span className="n ws-check-n">✓</span>
                <span>
                  <b>{collection.name}</b>
                  <br />
                  {formatNumber(collection.passages)} passages · newest {collection.newest}
                </span>
              </div>
            ))}
            {indexing ? (
              <div className="ws-index-card">
                <span>
                  <b>{indexing.name}</b> is still indexing, {indexing.status.percent}% done. It
                  joins this conversation automatically when ready.
                </span>
                <span className="ws-progress" aria-hidden="true">
                  <i style={{ width: `${indexing.status.percent}%` }} />
                </span>
              </div>
            ) : null}
          </section>

          <section className="ws-aside-section" style={{ gap: 8 }}>
            <h2 className="lbl">Cost</h2>
            <span>
              Typical answer with these sources:{" "}
              <span className="mono" style={{ color: "var(--ink)", whiteSpace: "nowrap" }}>
                $0.02–0.04
              </span>
              . Your limit stops any answer at{" "}
              <span className="mono" style={{ color: "var(--ink)" }}>
                {ceiling}
              </span>
              .
            </span>
          </section>

          <section className="ws-aside-section" style={{ gap: 8 }}>
            <h2 className="lbl">Who can see it</h2>
            <span>Only you, until you share it.</span>
          </section>
        </aside>
      </div>
    </>
  );
}
