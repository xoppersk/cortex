"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { AdminData } from "../../../lib/types";
import { createApiKeyAction, revokeApiKeyAction } from "../actions";
import { RevealPanel, type RevealView } from "./RevealPanel";

interface KeyRow {
  id: string;
  name: string;
  masked: string;
  createdNote: string;
  access: string;
  flag?: string;
  lastUsed: string;
  expiresNote?: string;
  cost: number | null;
}


const TILE_FRESH: CSSProperties = { background: "var(--highlight)", color: "var(--ink)" };
const TILE_NORMAL: CSSProperties = { background: "var(--rail)", color: "var(--ink)" };
const TILE_TEST: CSSProperties = {
  background: "var(--paper)",
  boxShadow: "inset 0 0 0 1px var(--control)",
  color: "var(--ink-2)",
};

function KeyIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ color: "inherit" }}>
      <circle cx="5.5" cy="10.5" r="3" />
      <path d="m7.6 8.4 5.9-5.9M11 5l1.5 1.5" />
    </svg>
  );
}

export function ApiKeysClient({
  apiKeys,
  workspaceName,
}: {
  apiKeys: AdminData["apiKeys"];
  workspaceName: string;
}) {
  const workspace = { name: workspaceName };
  const [rows, setRows] = useState<KeyRow[]>(
    apiKeys.rows.map((row) => ({
      id: row.id,
      name: row.name,
      masked: row.masked,
      createdNote: row.createdNote,
      access: row.access,
      flag: "flag" in row ? row.flag : undefined,
      lastUsed: row.lastUsed,
      expiresNote: "expiresNote" in row ? row.expiresNote : undefined,
      cost: row.cost,
    })),
  );
  const [reveal, setReveal] = useState<RevealView | null>(null);
  const [createdCount, setCreatedCount] = useState(0);
  const [createError, setCreateError] = useState<string | null>(null);

  async function createKey() {
    const n = createdCount + 1;
    const name = n === 1 ? "New key" : `New key ${n}`;
    const result = await createApiKeyAction({ name, expiresInDays: 90 });
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }
    setCreateError(null);
    setCreatedCount(n);
    // Reveal-once: the plaintext exists only in this action result.
    setReveal({
      heading: `“${name}” is ready. Copy it now.`,
      body: apiKeys.reveal.body,
      label: apiKeys.reveal.label,
      key: result.plaintext,
      can: apiKeys.reveal.can,
      cannot: apiKeys.reveal.cannot,
      expires: result.expiresAt
        ? new Date(result.expiresAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "Never",
    });
    setRows((previous) => [
      {
        id: result.id,
        name,
        masked: `${result.prefix}…`,
        createdNote: "created just now by you",
        access: "Ask, read sources",
        lastUsed: "Never",
        cost: null,
      },
      ...previous,
    ]);
  }

  async function revoke(id: string) {
    const result = await revokeApiKeyAction(id);
    if (result.ok) setRows((previous) => previous.filter((row) => row.id !== id));
  }

  function tileStyle(row: KeyRow, index: number): CSSProperties {
    if (row.masked.startsWith("cx_test_")) return TILE_TEST;
    if (index === 0 && row.createdNote.includes("just now")) return TILE_FRESH;
    return TILE_NORMAL;
  }

  return (
    <>
      <header className="ph ad-ph">
        <div className="ad-ph-left">
          <span className="sub">
            {workspace.name} <span className="sep">/</span> Settings
          </span>
          <h1>API keys</h1>
          <p className="ad-lede">{apiKeys.summary}</p>
        </div>
        <button type="button" className="btn dk" onClick={() => void createKey()}>
          <svg
            viewBox="0 0 16 16"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          Create key
        </button>
      </header>

      <div className="ad-keys-wrap">
        {createError ? <p role="alert" className="field-error">{createError}</p> : null}
        {reveal ? <RevealPanel reveal={reveal} onStored={() => setReveal(null)} /> : null}

        <div className="card" style={{ overflow: "hidden" }}>
          <div className="table-scroll">
            <div role="table" aria-label="API keys">
              <div role="row" className="ad-kr ad-kr-head th">
                <span role="columnheader">Key</span>
                <span role="columnheader">Access</span>
                <span role="columnheader">Last used</span>
                <span role="columnheader">
                  <span className="sr-only">Actions</span>
                </span>
              </div>
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  role="row"
                  className="ad-kr"
                  style={
                    index === 0 && row.createdNote.includes("just now") ? { background: "#FDFBEF" } : undefined
                  }
                >
                  <span role="cell" className="ad-ki">
                    <span className="ad-key-tile" style={tileStyle(row, index)} aria-hidden="true">
                      <KeyIcon />
                    </span>
                    <span className="ad-ki-stack">
                      <span className="ad-ki-name">{row.name}</span>
                      <span className="ad-ki-code">
                        {row.masked} · {row.createdNote}
                      </span>
                    </span>
                  </span>
                  <span role="cell">
                    {row.flag ? (
                      <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
                        <span className="tag warn">{row.access}</span>
                        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{row.flag}</span>
                      </span>
                    ) : (
                      <span style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        <span className="tag">{row.access}</span>
                      </span>
                    )}
                  </span>
                  <span role="cell">
                    <span style={{ display: "flex", flexDirection: "column", gap: 4, color: "var(--ink)" }}>
                      {row.lastUsed}
                      {row.cost ? (
                        <span className="mono" style={{ fontSize: 12, color: "var(--ink-4)" }}>
                          ${row.cost} this cycle
                        </span>
                      ) : null}
                      {row.expiresNote ? (
                        <span style={{ fontSize: 12, color: "var(--warn)" }}>{row.expiresNote}</span>
                      ) : null}
                    </span>
                  </span>
                  <span role="cell" style={{ textAlign: "right" }}>
                    <button type="button" className="btn gh sm" onClick={() => void revoke(row.id)}>
                      Revoke
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="ad-keys-foot">
            {apiKeys.footerSegments.map((segment, index) =>
              "href" in segment && segment.href ? (
                <Link key={index} href={segment.href}>
                  {segment.text}
                </Link>
              ) : (
                <span key={index}>{segment.text}</span>
              ),
            )}
          </p>
        </div>
      </div>
    </>
  );
}

