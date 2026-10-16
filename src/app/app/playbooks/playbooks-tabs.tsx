"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { ButtonLink } from "../../../components/Button";
import { getPlaybooks } from "../../../lib/api";
import type { PlaybookRow } from "../../../lib/types";
import { formatCost } from "../../../lib/utils";

type TabId = "team" | "private" | "archived";

const AVATAR_BG: Record<string, string | undefined> = {
  "Sheku Koroma": undefined,
  "Maya Jordan": "#E9E3C7",
  "Owen Clarke": "#DDE3E9",
  "Priya Shah": "#E3E9DD",
};

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");
}

function OwnerCell({ name }: { name: string }) {
  const ink = name === "Sheku Koroma";
  return (
    <span className="ws-own">
      <span
        className="av ws-av-sm"
        style={ink ? { background: "var(--ink)", color: "var(--on-ink)" } : { background: AVATAR_BG[name] }}
        aria-hidden="true"
      >
        {initialsOf(name)}
      </span>
      {name}
    </span>
  );
}

/** Instruction variables ([product], [audience]…) render as .ws-var spans. */
export function withDottedInputs(instructions: string): ReactNode {
  const parts = instructions.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={index} className="ws-var">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

function PlaybookRowLine({ playbook }: { playbook: PlaybookRow }) {
  const archived = Boolean(playbook.status);
  return (
    <Link role="row" href="#" className="ws-prow" onClick={(event) => event.preventDefault()}>
      <span role="cell" className="ws-p-title">
        <b>{playbook.name}</b>
        {playbook.description ? <span className="ws-p-desc">{playbook.description}</span> : null}
      </span>
      <span role="cell">{playbook.owner ? <OwnerCell name={playbook.owner} /> : null}</span>
      <span role="cell" className="ws-num">
        {playbook.runs}
      </span>
      <span role="cell" className="ws-num ws-num-dim">
        {archived ? playbook.status : playbook.updated}
      </span>
    </Link>
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

  const passMatch = /(\d+) of (\d+)/.exec(featured.passRate);
  const passPercent = passMatch ? Math.round((Number(passMatch[1]) / Number(passMatch[2])) * 100) : 0;

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div className="seg" role="tablist" aria-label="Filter playbooks">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls={`panel-${item.id}`}
              onClick={() => selectTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn">
          <svg
            className="ic"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path d="M5 3v10M2.5 10.5 5 13l2.5-2.5M11 13V3M8.5 5.5 11 3l2.5 2.5" />
          </svg>
          Most used
        </button>
      </div>

      {tab === "team" ? (
        <div role="tabpanel" id="panel-team" aria-labelledby="tab-team" className="table-scroll">
          <div
            role="table"
            aria-label="Team playbooks"
            className="card"
            style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 680 }}
          >
            <div role="row" className="ws-prow ws-prow-head th">
              <span role="columnheader">Playbook</span>
              <span role="columnheader">Owner</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Runs, 30 days
              </span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Edited
              </span>
            </div>

            <div role="row" className="ws-featured">
              <div className="ws-prow">
                <span role="cell" className="ws-p-title">
                  <span className="ws-featured-name">{featured.name}</span>
                  <span className="ws-featured-desc">{featured.description}</span>
                </span>
                <span role="cell">
                  {featured.owner ? <OwnerCell name={featured.owner} /> : null}
                </span>
                <span role="cell" className="ws-num" style={{ fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>
                  {featured.runs}
                </span>
                <span role="cell" className="ws-num ws-num-dim">
                  {featured.updated}
                </span>
              </div>
              <div className="ws-featured-cols">
                <figure className="ws-instructions">
                  <figcaption className="lbl">Instructions</figcaption>
                  <p>{withDottedInputs(featured.instructions)}</p>
                </figure>
                <dl className="ws-meta">
                  <dt>Inputs</dt>
                  <dd>{featured.inputs}</dd>
                  <dt>Sources</dt>
                  <dd>{featured.sources}</dd>
                  <dt>Checks</dt>
                  <dd>{featured.checks}</dd>
                  <dt>Avg. cost</dt>
                  <dd>
                    <span className="mono">{formatCost(featured.avgCost ?? 0)}</span> per run
                  </dd>
                  <dt>Pass rate</dt>
                  <dd className="ws-passbar">
                    {featured.passRate}
                    <span className="ws-progress" aria-hidden="true">
                      <i style={{ width: `${passPercent}%` }} />
                    </span>
                  </dd>
                </dl>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <ButtonLink href="/app/new" variant="primary">
                  <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" aria-hidden="true">
                    <path d="M4 2.5v11l9-5.5z" />
                  </svg>
                  Run playbook
                </ButtonLink>
                <ButtonLink href={`/app/playbooks/${featured.id}/edit`} variant="secondary">
                  Edit
                </ButtonLink>
                <button type="button" className="btn gh">
                  Duplicate
                </button>
                <button type="button" className="btn gh">
                  View runs
                </button>
              </div>
            </div>

            {playbooks.team.map((playbook) => (
              <PlaybookRowLine key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "private" ? (
        <div role="tabpanel" id="panel-private" aria-labelledby="tab-private" className="table-scroll">
          <div
            role="table"
            aria-label="Private playbooks"
            className="card"
            style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 680 }}
          >
            <div role="row" className="ws-prow ws-prow-head th">
              <span role="columnheader">Playbook</span>
              <span role="columnheader">Owner</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Runs, 30 days
              </span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Edited
              </span>
            </div>
            {playbooks.private.map((playbook) => (
              <PlaybookRowLine key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}

      {tab === "archived" ? (
        <div role="tabpanel" id="panel-archived" aria-labelledby="tab-archived" className="table-scroll">
          <div
            role="table"
            aria-label="Archived playbooks"
            className="card"
            style={{ display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 680 }}
          >
            <div role="row" className="ws-prow ws-prow-head th">
              <span role="columnheader">Playbook</span>
              <span role="columnheader">Owner</span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Runs, 30 days
              </span>
              <span role="columnheader" style={{ textAlign: "right" }}>
                Edited
              </span>
            </div>
            {playbooks.archived.map((playbook) => (
              <PlaybookRowLine key={playbook.id} playbook={playbook} />
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
