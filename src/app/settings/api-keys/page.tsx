"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { getAdminData, getWorkspaceData } from "../../../lib/api";
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

const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789";

function generateKeyMaterial(seed: number): { full: string; masked: string } {
  let state = seed;
  const next = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return KEY_CHARS[state % KEY_CHARS.length]!;
  };
  const head = Array.from({ length: 4 }, next).join("");
  const tail = Array.from({ length: 4 }, next).join("");
  const middle = Array.from({ length: 29 }, next).join("").replace(/./g, "·");
  return { full: `cx_live_${head}${middle}${tail}`, masked: `cx_live_${head}…${tail}` };
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

export default function ApiKeysPage() {
  const { apiKeys } = getAdminData();
  const { workspace } = getWorkspaceData();
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
  const [reveal, setReveal] = useState<RevealView | null>({
    heading: apiKeys.reveal.heading,
    body: apiKeys.reveal.body,
    label: apiKeys.reveal.label,
    key: apiKeys.reveal.key,
    can: apiKeys.reveal.can,
    cannot: apiKeys.reveal.cannot,
    expires: apiKeys.reveal.expires,
  });
  const [createdCount, setCreatedCount] = useState(0);

  function createKey() {
    const n = createdCount + 1;
    setCreatedCount(n);
    const material = generateKeyMaterial(Date.now() + n * 7919);
    const name = n === 1 ? "New key" : `New key ${n}`;
    setReveal({
      heading: `“${name}” is ready. Copy it now.`,
      body: apiKeys.reveal.body,
      label: apiKeys.reveal.label,
      key: material.full,
      can: apiKeys.reveal.can,
      cannot: apiKeys.reveal.cannot,
      expires: apiKeys.reveal.expires,
    });
    setRows((previous) => [
      {
        id: `new-key-${n}`,
        name,
        masked: material.masked,
        createdNote: "created just now by you",
        access: "Ask, read sources",
        lastUsed: "Never",
        cost: null,
      },
      ...previous,
    ]);
  }

  function revoke(id: string) {
    setRows((previous) => previous.filter((row) => row.id !== id));
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
        <button type="button" className="btn dk" onClick={createKey}>
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
                    <button type="button" className="btn gh sm" onClick={() => revoke(row.id)}>
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
