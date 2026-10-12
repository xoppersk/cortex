"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties, ReactNode } from "react";
import { Button, ButtonLink } from "../../../components/Button";
import { LedgerRow } from "../../../components/LedgerRow";
import { getPlaybooks } from "../../../lib/api";
import type { PlaybookRow } from "../../../lib/types";
import { formatCost } from "../../../lib/utils";

type TabId = "team" | "private" | "archived";

const VAR_STYLE: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 600,
};

const DESCRIPTION_STYLE: CSSProperties = {
  fontFamily: "var(--font-serif)",
  fontSize: 14,
  lineHeight: 1.45,
  color: "var(--ink-3)",
};

export function withDottedInputs(instructions: string): ReactNode {
  const parts = instructions.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={index} className="dotted-input" style={VAR_STYLE}>
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function PlaybookLedgerRow({ playbook }: { playbook: PlaybookRow }) {
  const archived = Boolean(playbook.status);
  return (
    <LedgerRow
      title={playbook.name}
      description={playbook.description}
      value={archived ? playbook.status : undefined}
      meta={
        archived
          ? `${playbook.runs} runs`
          : playbook.owner
            ? `${playbook.owner} · ${playbook.runs} runs · ${playbook.updated}`
            : `${playbook.runs} runs · ${playbook.updated}`
      }
    />
  );
}

export function PlaybooksTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playbooks = getPlaybooks();
  const featured = playbooks.featured;

  const tab = (searchParams.get("tab") as TabId | null) ?? "team";

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "team", label: `Team · ${playbooks.team.length + 1}` },
    { id: "private", label: `Private · ${playbooks.private.length}` },
    { id: "archived", label: "Archived" },
  ];

  function selectTab(next: TabId) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "team") params.delete("tab");
    else params.set("tab", next);
    const query = params.toString();
    router.replace(query ? `/app/playbooks?${query}` : "/app/playbooks", { scroll: false });
  }

  return (
    <div className="stack-5">
      <div className="row-between">
        <div className="tabs" role="tablist" aria-label="Playbooks">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              className="tab-button"
              onClick={() => selectTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Button variant="secondary" size="sm">
          Most used
        </Button>
      </div>

      {tab === "team" ? (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team" className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Playbook</th>
                <th scope="col">Owner</th>
                <th scope="col" className="numeric">
                  Runs, 30 days
                </th>
                <th scope="col" className="numeric">
                  Edited
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="featured-row">
                <td>
                  <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>
                    {featured.name}
                  </span>
                  <br />
                  <span style={DESCRIPTION_STYLE}>{featured.description}</span>
                </td>
                <td style={{ color: "var(--ink-2)" }}>{featured.owner}</td>
                <td className="numeric">{featured.runs}</td>
                <td className="numeric" style={{ color: "var(--ink-3)" }}>
                  {featured.updated}
                </td>
              </tr>
              <tr>
                <td colSpan={4}>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 40,
                      padding: "4px 0 var(--space-4)",
                    }}
                  >
                    <figure
                      style={{
                        flex: "1 1 460px",
                        maxWidth: 620,
                        margin: 0,
                        padding: "18px 20px",
                        background: "var(--tint)",
                        borderRadius: "var(--radius-l)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <figcaption style={{ fontSize: 12, color: "var(--ink-4)" }}>
                        Instructions
                      </figcaption>
                      <p
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontSize: 16,
                          lineHeight: 1.65,
                          color: "var(--ink-body)",
                        }}
                      >
                        {withDottedInputs(featured.instructions)}
                      </p>
                    </figure>
                    <dl
                      style={{
                        flex: "1 1 220px",
                        maxWidth: 280,
                        margin: 0,
                        display: "grid",
                        gridTemplateColumns: "auto minmax(0, 1fr)",
                        gap: "10px 16px",
                        fontSize: 12,
                        lineHeight: 1.45,
                        alignContent: "start",
                      }}
                    >
                      <dt style={{ color: "var(--ink-4)" }}>Inputs</dt>
                      <dd>{featured.inputs}</dd>
                      <dt style={{ color: "var(--ink-4)" }}>Sources</dt>
                      <dd>{featured.sources}</dd>
                      <dt style={{ color: "var(--ink-4)" }}>Checks</dt>
                      <dd>{featured.checks}</dd>
                      <dt style={{ color: "var(--ink-4)" }}>Avg. cost</dt>
                      <dd>{formatCost(featured.avgCost ?? 0)} per run</dd>
                      <dt style={{ color: "var(--ink-4)" }}>Pass rate</dt>
                      <dd>{featured.passRate}</dd>
                    </dl>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <ButtonLink href="/app/new" variant="primary" size="sm">
                      Run playbook
                    </ButtonLink>
                    <ButtonLink
                      href={`/app/playbooks/${featured.id}/edit`}
                      variant="secondary"
                      size="sm"
                    >
                      Edit
                    </ButtonLink>
                    <Button variant="secondary" size="sm">
                      Duplicate
                    </Button>
                    <Button variant="secondary" size="sm">
                      View runs
                    </Button>
                  </div>
                </td>
              </tr>
              {playbooks.team.map((playbook) => (
                <tr key={playbook.id}>
                  <td>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                      {playbook.name}
                    </span>
                    <br />
                    <span style={DESCRIPTION_STYLE}>{playbook.description}</span>
                  </td>
                  <td style={{ color: "var(--ink-2)" }}>{playbook.owner}</td>
                  <td className="numeric">{playbook.runs}</td>
                  <td className="numeric" style={{ color: "var(--ink-3)" }}>
                    {playbook.updated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "private" ? (
        <div role="tabpanel" id="panel-private" aria-labelledby="tab-private">
          <div className="ledger">
            {playbooks.private.map((playbook) => (
              <PlaybookLedgerRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "archived" ? (
        <div role="tabpanel" id="panel-archived" aria-labelledby="tab-archived">
          <div className="ledger">
            {playbooks.archived.map((playbook) => (
              <PlaybookLedgerRow key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
