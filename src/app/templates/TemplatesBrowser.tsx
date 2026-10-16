"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { ReactNode } from "react";
import { IconArrowRight, IconBook, IconSearch } from "../../components/icons";
import type { TemplateItem, TemplatesData } from "../../lib/types";

/*
 * P-03 Templates — Premium v2 (screens/Templates.html): category segmented
 * control + search (both mirrored in the URL query, brief §10), the featured
 * template expanded inside the table sheet, six rows, and "Show N more".
 * The 17 non-designed fixture entries carry only inputs/sources: their rows
 * take expects ← sources and copied ← "—" (no copied data exists for them
 * anywhere in the package), and render name-only — the inputs spec string is
 * not a description, so the description line is omitted rather than faked.
 */

function renderVars(text: string): ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("[") && part.endsWith("]") ? (
          <span key={index} className="pub-var">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}

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
      <div className="pub-controls">
        <div className="seg pub-seg" role="group" aria-label="Filter templates by category">
          {data.categories.map((item) => (
            <button
              key={item.name}
              type="button"
              aria-pressed={category === item.name}
              onClick={() => updateParams({ category: item.name })}
            >
              {item.name === "All" ? (
                <>
                  All <span className="pub-seg-count">{item.count}</span>
                </>
              ) : (
                item.name
              )}
            </button>
          ))}
        </div>
        <span className="pub-search">
          <IconSearch />
          <label htmlFor="ts" className="sr-only">
            Search templates
          </label>
          <input
            id="ts"
            type="search"
            className="inp"
            placeholder="Search templates"
            value={query}
            onChange={(event) => updateParams({ q: event.target.value })}
          />
        </span>
      </div>

      <div role="table" aria-label="Templates" className="sheet pub-table">
        <div role="row" className="pub-tr pub-tr-head">
          <span role="columnheader" className="th">
            Template
          </span>
          <span role="columnheader" className="th">
            Expects
          </span>
          <span role="columnheader" className="th" style={{ textAlign: "right" }}>
            Copied
          </span>
        </div>

        {featuredMatches ? (
          <div role="row" className="pub-featured">
            <div className="pub-tr">
              <span role="cell" className="pub-tn">
                <span className="ib pub-ib-dark">
                  <IconBook />
                </span>
                <span className="pub-tn-text" style={{ gap: 8 }}>
                  <b className="pub-featured-title">{featured.name}</b>
                  <span className="pub-featured-desc">{featured.description}</span>
                </span>
              </span>
              <span role="cell" className="pub-expects" style={{ paddingTop: 6 }}>
                {featured.expects}
              </span>
              <span role="cell" className="pub-cnt" style={{ paddingTop: 8 }}>
                {featured.copied}
              </span>
            </div>
            <div className="pub-feat-detail">
              {featured.instructions ? (
                <p className="pub-instructions">{renderVars(featured.instructions)}</p>
              ) : null}
              <dl className="inset pub-meta-dl">
                <dt>Inputs</dt>
                <dd className="mono">{featured.inputs}</dd>
                <dt>Checks</dt>
                <dd>{featured.checks}</dd>
                <dt>Typical run</dt>
                <dd>{featured.typicalRun}</dd>
              </dl>
            </div>
            <div className="pub-feat-actions">
              {/*
               * The design links this CTA to PlaybookBuilder.html — the
               * playbook builder. In this app the builder exists for the
               * Launch brief playbook only (the editor route 404s any other
               * id by design), so the copied template opens there; building
               * the href from the template's own id dead-ended on a 404.
               */}
              <Link href="/app/playbooks/launch-brief/edit" className="btn dk">
                Copy to my workspace <IconArrowRight />
              </Link>
            </div>
          </div>
        ) : null}

        {visible.map((template, index) => (
          <Link
            key={template.id}
            role="row"
            className="pub-tr"
            href="#"
            style={index === 0 ? { borderTop: 0 } : undefined}
          >
            <span role="cell" className="pub-tn">
              <span className="ib">
                <IconBook />
              </span>
              <span className="pub-tn-text">
                <b className="pub-tn-title">{template.name}</b>
                {template.description ? (
                  <span className="pub-tn-desc">{template.description}</span>
                ) : null}
              </span>
            </span>
            <span role="cell" className="pub-expects">
              {template.expects ?? template.sources}
            </span>
            <span role="cell" className="pub-cnt">
              {template.copied ?? "—"}
            </span>
          </Link>
        ))}

        {filtered.length === 0 && !featuredMatches ? (
          <p className="pub-no-match">No templates match that search.</p>
        ) : null}
      </div>

      {hiddenCount > 0 ? (
        <button type="button" className="btn pub-show-more" onClick={() => setExpanded(true)}>
          Show {hiddenCount} more
        </button>
      ) : null}
    </>
  );
}
