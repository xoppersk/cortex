"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "../../components/Icon";
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

  const featured = data.featured;

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div className="pv-seg pm-seg-ground" role="group" aria-label="Filter templates by category">
          {data.categories.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={category === item.name}
              onClick={() => updateParams({ category: item.name })}
            >
              {item.name}
              {item.name === "All" ? (
                <span className="pv-mono" style={{ fontSize: 11.5, color: "var(--ink-4)" }}>
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </div>
        <span className="pm-search">
          <label htmlFor="template-search" className="sr-only">
            Search templates
          </label>
          <Icon name="search" />
          <input
            id="template-search"
            type="search"
            placeholder="Search templates"
            className="pv-inp"
            value={query}
            onChange={(event) => updateParams({ q: event.target.value })}
          />
        </span>
      </div>

      <div role="table" aria-label="Templates" className="pm-sheet" style={{ overflow: "hidden" }}>
        <div role="row" className="pm-tr pm-tr-head pv-th">
          <span role="columnheader">Template</span>
          <span role="columnheader">Expects</span>
          <span role="columnheader" style={{ textAlign: "right" }}>
            Copied
          </span>
        </div>

        {featuredMatches ? (
          <div role="row" className="pm-tr-featured">
            <div className="pm-tr" style={{ padding: 0, border: 0, alignItems: "start" }}>
              <span role="cell" className="pm-tn">
                <span className="pm-ib" style={{ background: "var(--ink)" }} aria-hidden="true">
                  <Icon name="book" style={{ color: "var(--on-ink)" }} />
                </span>
                <span style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <b className="pm-tn-title-lg">{featured.name}</b>
                  <span className="pm-tn-desc-lg">{featured.description}</span>
                </span>
              </span>
              <span role="cell" className="pm-tr-expects" style={{ paddingTop: 6 }}>
                {featured.expects}
              </span>
              <span role="cell" className="pm-cnt" style={{ paddingTop: 8 }}>
                {featured.copied}
              </span>
            </div>
            <div className="pm-tr-detail">
              {featured.instructions ? <p className="pm-instructions">{withPicks(featured.instructions)}</p> : null}
              <dl className="pm-tr-meta">
                <dt>Inputs</dt>
                <dd className="pv-mono">{featured.inputs}</dd>
                <dt>Checks</dt>
                <dd>{featured.checks}</dd>
                <dt>Typical run</dt>
                <dd>{featured.typicalRun}</dd>
              </dl>
            </div>
            <div className="pm-tr-detail" style={{ gap: 8 }}>
              <Link href={`/app/playbooks/${featured.id}/edit`} className="btn btn-primary btn-md" style={{ minHeight: 38, padding: "0 16px" }}>
                Copy to my workspace
                <Icon name="arrowRight" size={15} />
              </Link>
            </div>
          </div>
        ) : null}

        {visible.map((template) => (
          <Link key={template.id} role="row" className="pm-tr" href="#">
            <span role="cell" className="pm-tn">
              <span className="pm-ib" aria-hidden="true">
                <Icon name="book" />
              </span>
              <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <b className="pm-tn-title">{template.name}</b>
                <span className="pm-tn-desc">{template.description ?? template.inputs}</span>
              </span>
            </span>
            <span role="cell" className="pm-tr-expects">
              {template.expects ?? template.sources}
            </span>
            <span role="cell" className="pm-cnt">
              {template.copied ?? "—"}
            </span>
          </Link>
        ))}

        {filtered.length === 0 && !featuredMatches ? (
          <p role="row" style={{ margin: 0, padding: "18px 28px", fontSize: 14, color: "var(--ink-3)" }}>
            <span role="cell">No templates match that search.</span>
          </p>
        ) : null}
      </div>

      {hiddenCount > 0 ? (
        <button type="button" className="btn btn-secondary btn-md" style={{ alignSelf: "center", marginTop: 8 }} onClick={() => setExpanded(true)}>
          Show {hiddenCount} more
        </button>
      ) : null}
    </>
  );
}

/* "[product]" placeholders in template instructions → underlined picks. */
function withPicks(instructions: string): ReactNode {
  return instructions.split(/(\[[^\]]+\])/g).map((part, index) =>
    part.startsWith("[") && part.endsWith("]") ? (
      <span key={index} className="pm-pick">
        {part.slice(1, -1)}
      </span>
    ) : (
      <span key={index}>{part}</span>
    ),
  );
}
