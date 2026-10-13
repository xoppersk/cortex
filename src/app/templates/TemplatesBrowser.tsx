"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { MouseEvent } from "react";
import { withDottedInputs } from "../app/playbooks/playbooks-tabs";
import type { TemplateItem, TemplatesData } from "../../lib/types";

/*
 * P-03 Templates: category filters + search (mirrored in the URL query),
 * the featured template expanded with its instructions, the first six rows,
 * and a "Show N more" reveal for the rest. Layout follows
 * screens/Templates.html: grid columns 1fr / 170px / 130px with "Copied"
 * right-aligned, the featured detail as document + margin side-by-side,
 * and the instructions as a tint fragment. Rows keep the design's "#"
 * href; "Copy to my workspace" goes to the PlaybookBuilder route (W-05).
 * The 17 non-designed fixture entries carry only inputs/sources, so rows
 * fall back to those fixture fields (expects ← sources, description ←
 * inputs, copied ← "—") instead of rendering blank cells.
 */
export function TemplatesBrowser({ data }: { data: TemplatesData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const categoryParam = searchParams.get("category") ?? "All";
  const category = data.categories.some((item) => item.name === categoryParam) ? categoryParam : "All";
  const query = searchParams.get("q") ?? "";

  const rest = data.templates.filter((template) => template.id !== data.featured.id);
  const matches = (template: TemplateItem) => {
    const inCategory = category === "All" || template.category === category;
    const needle = query.trim().toLowerCase();
    const inQuery =
      needle.length === 0 ||
      [template.name, template.description, template.expects, template.category, template.inputs, template.sources]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return inCategory && inQuery;
  };

  const featuredMatches = matches(data.featured);
  const filtered = rest.filter(matches);
  const visible = expanded ? filtered : filtered.slice(0, 6);
  const hiddenCount = filtered.length - visible.length;

  function updateParams(next: { category?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    const nextCategory = next.category ?? category;
    const nextQuery = next.q ?? query;
    if (nextCategory && nextCategory !== "All") params.set("category", nextCategory);
    else params.delete("category");
    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");
    const suffix = params.toString();
    router.replace(suffix ? `/templates?${suffix}` : "/templates", { scroll: false });
    setExpanded(false);
  }

  function rowHover(event: MouseEvent<HTMLAnchorElement>, on: boolean) {
    event.currentTarget.style.background = on ? "var(--paper-sunk)" : "";
  }

  const featured = data.featured;
  const grid = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) 170px 130px",
    gap: 24,
    alignItems: "baseline",
  } as const;

  return (
    <div className="stack-2">
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          paddingBottom: 10,
        }}
      >
        <div className="filter-row" role="group" aria-label="Filter templates by category">
          {data.categories.map((item) => (
            <button
              key={item.name}
              type="button"
              className="filter-button"
              style={{ fontSize: 14 }}
              aria-pressed={category === item.name}
              onClick={() => updateParams({ category: item.name })}
            >
              {item.name === "All" ? `All ${item.count}` : item.name}
            </button>
          ))}
        </div>
        <div>
          <label htmlFor="template-search" className="sr-only">
            Search templates
          </label>
          <input
            id="template-search"
            type="search"
            placeholder="Search templates"
            className="field-control"
            style={{ width: 240, minHeight: 34, fontSize: 14 }}
            value={query}
            onChange={(event) => updateParams({ q: event.target.value })}
          />
        </div>
      </div>

      <div className="table-scroll">
      <div role="table" aria-label="Templates">
        <div
          role="row"
          className="templates-row"
          style={{ ...grid, padding: "0 0 10px", fontSize: 13, color: "var(--ink-4)" }}
        >
          <span role="columnheader">Template</span>
          <span role="columnheader">Expects</span>
          <span role="columnheader" style={{ textAlign: "right" }}>
            Copied
          </span>
        </div>

        {featuredMatches ? (
          <div
            role="row"
            style={{
              borderTop: "1px solid var(--ink)",
              padding: "22px 0 28px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div style={grid} className="templates-row">
              <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <strong
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 22,
                    lineHeight: 1.2,
                    fontWeight: 600,
                    color: "var(--ink)",
                  }}
                >
                  {featured.name}
                </strong>
                <span
                  style={{
                    fontFamily: "var(--font-serif)",
                    fontSize: 16,
                    lineHeight: 1.5,
                    color: "var(--ink-2)",
                  }}
                >
                  {featured.description}
                </span>
              </span>
              <span role="cell" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                {featured.expects}
              </span>
              <span role="cell" style={{ fontSize: 14, color: "var(--ink)", textAlign: "right" }}>
                {featured.copied}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 40 }}>
              {featured.instructions ? (
                <p
                  style={{
                    flex: "1 1 460px",
                    maxWidth: 640,
                    margin: 0,
                    padding: "18px 20px",
                    background: "var(--tint)",
                    borderRadius: "var(--radius-l)",
                    fontFamily: "var(--font-serif)",
                    fontSize: 17,
                    lineHeight: 1.65,
                    color: "var(--ink-body)",
                  }}
                >
                  {withDottedInputs(featured.instructions)}
                </p>
              ) : null}
              <dl
                style={{
                  flex: "1 1 220px",
                  maxWidth: 280,
                  margin: 0,
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr)",
                  gap: "8px 16px",
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: "var(--ink-2)",
                  alignContent: "start",
                }}
              >
                <dt style={{ color: "var(--ink-4)" }}>Inputs</dt>
                <dd style={{ margin: 0 }}>{featured.inputs}</dd>
                <dt style={{ color: "var(--ink-4)" }}>Checks</dt>
                <dd style={{ margin: 0 }}>{featured.checks}</dd>
                <dt style={{ color: "var(--ink-4)" }}>Typical run</dt>
                <dd style={{ margin: 0 }}>{featured.typicalRun}</dd>
              </dl>
            </div>
            <div>
              <Link
                href={`/app/playbooks/${featured.id}/edit`}
                className="btn btn-primary btn-md"
                style={{ fontSize: 14 }}
              >
                Copy to my workspace
              </Link>
            </div>
          </div>
        ) : null}

        {visible.map((template, index) => (
          <Link
            key={template.id}
            role="row"
            className="templates-row"
            href="#"
            onMouseEnter={(event) => rowHover(event, true)}
            onMouseLeave={(event) => rowHover(event, false)}
            style={{
              ...grid,
              padding: "18px 0",
              borderTop: "1px solid var(--rule)",
              borderBottom:
                index === visible.length - 1 && hiddenCount === 0
                  ? "1px solid var(--rule)"
                  : undefined,
              textDecoration: "none",
              color: "var(--ink)",
            }}
          >
            <span role="cell" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <strong style={{ fontSize: 16, fontWeight: 500 }}>{template.name}</strong>
              <span
                style={{
                  fontFamily: "var(--font-serif)",
                  fontSize: 15,
                  lineHeight: 1.5,
                  color: "var(--ink-3)",
                }}
              >
                {template.description ?? template.inputs}
              </span>
            </span>
            <span role="cell" style={{ fontSize: 14, color: "var(--ink-2)" }}>
              {template.expects ?? template.sources}
            </span>
            <span role="cell" style={{ fontSize: 14, color: "var(--ink)", textAlign: "right" }}>
              {template.copied ?? "—"}
            </span>
          </Link>
        ))}

        {filtered.length === 0 && !featuredMatches ? (
          <p className="ui-text muted-3" style={{ padding: "18px 0", borderTop: "1px solid var(--rule)" }}>
            No templates match that search.
          </p>
        ) : null}
      </div>
      </div>

      {hiddenCount > 0 ? (
        <div style={{ marginTop: 14 }}>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            style={{
              background: "none",
              border: 0,
              padding: 0,
              fontSize: 14,
              color: "var(--ink-2)",
              cursor: "pointer",
            }}
          >
            Show {hiddenCount} more
          </button>
        </div>
      ) : null}
    </div>
  );
}
