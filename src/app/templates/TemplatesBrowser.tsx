"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "../../components/Button";
import type { TemplatesData } from "../../lib/types";

/*
 * P-03 interactive part: category filters + search, with state mirrored in
 * the URL query (?category=&q=), the featured template expanded, the first
 * six rows, and a "Show N more" reveal for the rest.
 */
export function TemplatesBrowser({ data }: { data: TemplatesData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expanded, setExpanded] = useState(false);

  const categoryParam = searchParams.get("category") ?? "All";
  const category = data.categories.some((item) => item.name === categoryParam) ? categoryParam : "All";
  const query = searchParams.get("q") ?? "";

  // The featured template also appears in the full list; count it once.
  const rest = data.templates.filter((template) => template.id !== data.featured.id);
  const matches = (template: (typeof rest)[number]) => {
    const inCategory = category === "All" || template.category === category;
    const needle = query.trim().toLowerCase();
    const inQuery =
      needle.length === 0 ||
      [template.name, template.inputs, template.sources, template.category]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    return inCategory && inQuery;
  };

  const featuredMatches =
    (category === "All" || data.featured.category === category) &&
    (query.trim().length === 0 ||
      [data.featured.name, data.featured.inputs, data.featured.sources, data.featured.category]
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase()));

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

  const featured = data.featured;

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
            style={{ width: 240, minHeight: 34 }}
            value={query}
            onChange={(event) => updateParams({ q: event.target.value })}
          />
        </div>
      </div>

      <div role="table" aria-label="Templates">
        <div
          role="row"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) 170px 170px",
            gap: 24,
            padding: "0 0 10px",
            fontSize: 13,
            color: "var(--ink-4)",
          }}
        >
          <span role="columnheader">Template</span>
          <span role="columnheader">Inputs</span>
          <span role="columnheader">Sources</span>
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 170px 170px",
                gap: 24,
                alignItems: "baseline",
              }}
            >
              <span role="cell" className="stack-2">
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
                  Audience, promise, proof and risks for a launch.
                </span>
              </span>
              <span role="cell" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                {featured.inputs}
              </span>
              <span role="cell" style={{ fontSize: 14, color: "var(--ink-2)" }}>
                {featured.sources}
              </span>
            </div>
            <dl className="definition-grid" style={{ maxWidth: 640 }}>
              <dt>Inputs</dt>
              <dd>{featured.inputs}</dd>
              <dt>Sources</dt>
              <dd>{featured.sources}</dd>
              {featured.checks ? (
                <>
                  <dt>Checks</dt>
                  <dd>{featured.checks}</dd>
                </>
              ) : null}
              {featured.runs ? (
                <>
                  <dt>Runs</dt>
                  <dd>{featured.runs}</dd>
                </>
              ) : null}
            </dl>
            <div>
              <Link href="/app/playbooks" className="btn btn-primary btn-md">
                Copy to my workspace
              </Link>
            </div>
          </div>
        ) : null}

        {visible.map((template, index) => (
          <Link
            key={template.id}
            role="row"
            href="/app/playbooks"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr) 170px 170px",
              gap: 24,
              alignItems: "baseline",
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
                {template.category}
              </span>
            </span>
            <span role="cell" style={{ fontSize: 14, color: "var(--ink-2)" }}>
              {template.inputs}
            </span>
            <span role="cell" style={{ fontSize: 14, color: "var(--ink-2)" }}>
              {template.sources}
            </span>
          </Link>
        ))}

        {filtered.length === 0 && !featuredMatches ? (
          <p className="ui-text muted-3" style={{ padding: "18px 0", borderTop: "1px solid var(--rule)" }}>
            No templates match that search.
          </p>
        ) : null}
      </div>

      {hiddenCount > 0 ? (
        <div style={{ marginTop: 14 }}>
          <Button variant="quiet" onClick={() => setExpanded(true)}>
            Show {hiddenCount} more
          </Button>
        </div>
      ) : null}
    </div>
  );
}
