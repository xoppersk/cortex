import type { Metadata } from "next";
import { Button } from "../../../components/Button";
import { Composer } from "../../../components/Composer";
import { LedgerRow } from "../../../components/LedgerRow";
import { Notice } from "../../../components/Notice";
import { getConversations, getKnowledge, getPlaybooks, getThread, getWorkspaceData } from "../../../lib/api";
import { formatCost, formatNumber } from "../../../lib/utils";

export const metadata: Metadata = { title: "New conversation" };

export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const isViewer = params.state === "viewer";

  const { workspace, models } = getWorkspaceData();
  const thread = getThread();
  const playbooks = getPlaybooks();
  const conversations = getConversations();
  const knowledge = getKnowledge();

  const ceiling = `$${workspace.perAnswerCeiling.toFixed(2)}`;
  const visibleCollections = knowledge.collections.slice(0, 3);
  const pickUp = conversations.conversations.filter((conversation) => conversation.pinned).slice(0, 3);
  const playbookRows = [playbooks.team[0]!, playbooks.team[1]!];

  return (
    <div className="stack-6">
      <div className="page-head">
        <h1 className="page-title">New conversation</h1>
      </div>

      <div className="doc-margin">
        <div className="doc-column stack-6">
          {isViewer ? (
            <Notice
              headline="You can read this workspace, but you can’t start conversations."
              actions={
                <>
                  <Button variant="primary" size="md">
                    Request Editor access
                  </Button>
                  <Button variant="quiet" size="md">
                    Leave a comment
                  </Button>
                </>
              }
            >
              <p>
                Your role in {workspace.name} is Viewer. You can read conversations, playbooks and
                sources, but asking questions and starting conversations needs Editor access.
              </p>
            </Notice>
          ) : null}

          <p className="config-sentence">
            Ask across{" "}
            <select className="underlined-picker" aria-label="Sources" defaultValue={thread.composer.sources} disabled={isViewer}>
              <option>{thread.composer.sources}</option>
              <option>2 collections</option>
              <option>All 5 collections</option>
              <option>Customer interviews only</option>
            </select>
            , answered by{" "}
            <select className="underlined-picker" aria-label="Model" defaultValue={workspace.defaultModel} disabled={isViewer}>
              {models.map((model) => (
                <option key={model.id}>{model.name}</option>
              ))}
            </select>
            , with{" "}
            <select className="underlined-picker" aria-label="Citation rule" defaultValue={workspace.citationRule} disabled={isViewer}>
              <option>{workspace.citationRule}</option>
              <option>Key claims cited</option>
              <option>No citations</option>
            </select>
            , and spend no more than{" "}
            <select className="underlined-picker" aria-label="Per-answer ceiling" defaultValue={ceiling} disabled={isViewer}>
              <option>$0.05</option>
              <option>{ceiling}</option>
              <option>$0.15</option>
              <option>No ceiling</option>
            </select>{" "}
            on a single answer.
          </p>

          <Composer
            sourcesLabel={thread.composer.sources}
            playbookLabel={thread.composer.playbook}
            model={workspace.defaultModel}
            costSentence={`About $0.012–$0.020 for a reply like this. Nothing is spent until you send.`}
            disabled={isViewer}
            pausedMessage={isViewer ? "Viewers can read this workspace but can’t ask questions." : undefined}
          />

          <section className="stack-3">
            <h2 className="section-label">Start from a playbook</h2>
            <div className="ledger">
              <LedgerRow
                featured
                href="/app/playbooks"
                title={playbooks.featured.name}
                description={playbooks.featured.instructions}
                value={`${formatCost(playbooks.featured.avgCost ?? 0)} avg`}
                meta={`${playbooks.featured.runs} runs · ${playbooks.featured.passRate}`}
              />
              {playbookRows.map((playbook) => (
                <LedgerRow
                  key={playbook.id}
                  href="/app/playbooks"
                  title={playbook.name}
                  description={playbook.passRate}
                  value={playbook.avgCost ? `${formatCost(playbook.avgCost)} avg` : undefined}
                  meta={`${playbook.runs} runs · Updated ${playbook.updated}`}
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
                  description={conversation.snippet}
                  value={formatCost(conversation.cost)}
                  meta={`${conversation.project} · Edited ${conversation.edited}`}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="margin-column">
          <div className="margin-box">
            <h2 className="margin-box-title">What this conversation can see</h2>
            <ul className="stack-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {visibleCollections.map((collection) => (
                <li key={collection.id} className="caption" style={{ color: "var(--ink-2)" }}>
                  <span className="ink-text" style={{ fontWeight: 500 }}>
                    {collection.name}
                  </span>
                  <br />
                  {collection.documents} documents · {formatNumber(collection.passages)} passages
                </li>
              ))}
            </ul>
            <p className="caption">
              Sources are passages from these collections, kept for {workspace.sourceFreshnessDays} days
              unless a newer version replaces them.
            </p>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Cost</h2>
            <p className="caption" style={{ color: "var(--ink-2)" }}>
              Most answers in this workspace cost $0.012–$0.020. The ceiling stops a single answer at{" "}
              {ceiling}, and ${workspace.spend} of the ${workspace.monthlyLimit} monthly limit is already
              spent.
            </p>
          </div>

          <div className="margin-box">
            <h2 className="margin-box-title">Visibility</h2>
            <p className="caption" style={{ color: "var(--ink-2)" }}>
              Conversations are visible to the {workspace.name} workspace. Editors can continue a
              conversation; Viewers can read it and leave comments.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
