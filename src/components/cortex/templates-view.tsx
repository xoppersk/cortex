"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/cortex/states";
import { TemplateCard } from "@/components/cortex/prompt-kit";
import { SCREEN_COPY, TRUTH_SETS } from "@/lib/cortex/truth";

export interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  variables: string[];
  visibility: "personal" | "team";
  featured: boolean;
  runCount: number;
  author: string;
}

const CATEGORIES = ["All", "Marketing", "Sales", "Engineering", "Ops", "Custom"];

/**
 * /app/templates — playbook library.
 * Tabs (Mine / Team / Featured) + category sidebar + search + card grid.
 * Live list, with truth-set rows merged where the team has none.
 */
export function TemplatesView({ templates }: { templates: TemplateSummary[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const truthRows: TemplateSummary[] = TRUTH_SETS.playbooks.map(([name, vars, visibility], i) => ({
    id: `truth-${i}`,
    name: name ?? "Seeded playbook",
    description: "Seeded demo playbook — replace with your team's own.",
    category: ["Marketing", "Engineering", "Ops"][i % 3] ?? "Marketing",
    variables: Array.from({ length: parseInt(vars ?? "3", 10) || 3 }, (_, n) => `variable_${n + 1}`),
    visibility: visibility === "Team" ? "team" : "personal",
    featured: i === 0,
    runCount: 0,
    author: "Maya Jordan",
  }));

  const mine = [...templates.filter((t) => t.author === "me"), ...truthRows.slice(1, 2)];
  const team = [...templates.filter((t) => t.visibility === "team"), ...truthRows.filter((t) => t.visibility === "team")];
  const featured = [...templates.filter((t) => t.featured), ...truthRows.filter((t) => t.featured)];

  function grid(items: TemplateSummary[], tab: string) {
    const filtered = items.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (t.name + t.description).toLowerCase().includes(query.toLowerCase()),
    );
    if (filtered.length === 0) {
      return (
        <EmptyState headline="No playbooks yet" actionLabel="Create your first template" actionHref="/app/templates/new">
          {tab === "team"
            ? "Team templates appear here once shared. Browse Featured for a starting point."
            : "Save one from a chat, or build one from scratch."}
        </EmptyState>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <TemplateCard
            key={t.id}
            name={t.name}
            description={t.description}
            variables={t.variables}
            runs={t.runCount}
            author={t.author}
            featured={t.featured}
            href={`/app/templates/${t.id}`}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <PageHeader
        kicker="Cortex / Workspace"
        title="Playbook library"
        lede={SCREEN_COPY["Playbooks"]}
        actions={
          <Button asChild>
            <Link href="/app/templates/new">New template</Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search playbooks…"
          className="h-11 min-w-[220px] flex-1 rounded-[10px]"
          aria-label="Search playbooks"
        />
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={
                category === c
                  ? "rounded-full bg-primary-muted px-3 py-1.5 font-mono text-[11px] text-primary"
                  : "rounded-full border border-border px-3 py-1.5 font-mono text-[11px] text-muted-foreground hover:text-foreground"
              }
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="mine">Mine</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="featured">Featured</TabsTrigger>
        </TabsList>
        <TabsContent value="mine" className="mt-6">{grid(mine, "mine")}</TabsContent>
        <TabsContent value="team" className="mt-6">{grid(team, "team")}</TabsContent>
        <TabsContent value="featured" className="mt-6">{grid(featured, "featured")}</TabsContent>
      </Tabs>
    </>
  );
}
