"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { ONBOARDING_STEPS, SUGGESTION_CARDS } from "@/lib/cortex/truth";

/** SuggestionCard — 2×2 empty-state prompt cards with icon + label. */
export function SuggestionCard({
  label,
  hint,
  onPick,
}: {
  label: string;
  hint: string;
  onPick: (label: string) => void;
}) {
  return (
    <button
      onClick={() => onPick(label)}
      className="group rounded-[14px] border border-border bg-card p-5 text-left transition-colors hover:border-primary/50"
    >
      <p className="text-[14px] font-medium leading-snug">{label}</p>
      <p className="mt-2 font-mono text-[11px] text-muted-foreground group-hover:text-primary">
        {hint}
      </p>
    </button>
  );
}

export function SuggestionGrid({ onPick }: { onPick: (label: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SUGGESTION_CARDS.map((c) => (
        <SuggestionCard key={c.label} label={c.label} hint={c.hint} onPick={onPick} />
      ))}
    </div>
  );
}

/** OnboardingChecklist — first-run card; checkmarks fill as steps complete. */
export function OnboardingChecklist({ done }: { done: boolean[] }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        Getting started
      </p>
      <ul className="mt-3 flex flex-col gap-2.5">
        {ONBOARDING_STEPS.map((step, i) => (
          <li key={step} className="flex items-center gap-3 text-[14px]">
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full border",
                done[i] ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
              aria-hidden="true"
            >
              {done[i] && <Check className="size-3" />}
            </span>
            <span className={cn(done[i] && "text-muted-foreground line-through")}>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** VariablePill — {{name}} pill rendering for playbook variables. */
export function VariablePill({ name }: { name: string }) {
  return (
    <code className="rounded-full border border-primary/40 bg-primary-muted px-2.5 py-1 font-mono text-[11px] text-primary">
      {`{{${name}}}`}
    </code>
  );
}

/** TemplateCard — name, description, variable chips, runs, author avatar, menu. */
export function TemplateCard({
  name,
  description,
  variables,
  runs,
  author,
  featured,
  href,
}: {
  name: string;
  description: string;
  variables: string[];
  runs: number;
  author: string;
  featured?: boolean;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex flex-col rounded-[14px] border border-border bg-card p-5 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{name}</h3>
        {featured && (
          <span className="rounded-full bg-primary-muted px-2 py-0.5 font-mono text-[10px] text-primary">
            Featured
          </span>
        )}
      </div>
      <p className="mt-1.5 flex-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {variables.map((v) => (
          <VariablePill key={v} name={v} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
        <span
          className="flex size-6 items-center justify-center rounded-full bg-muted font-mono text-[10px]"
          aria-hidden="true"
        >
          {author.slice(0, 1).toUpperCase()}
        </span>
        <span className="text-[12px] text-muted-foreground">{author}</span>
        <span className="ml-auto font-mono text-[11px] text-muted-foreground">
          {runs} run{runs === 1 ? "" : "s"} this month
        </span>
      </div>
    </a>
  );
}
