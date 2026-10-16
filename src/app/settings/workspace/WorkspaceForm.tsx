"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { AdminData } from "../../../lib/types";
import { cx } from "../../../lib/utils";

type Settings = AdminData["workspaceSettings"];

interface FormValues {
  name: string;
  slug: string;
  model: string;
  citationRule: string;
  freshness: string;
  ceiling: string;
  limit: string;
  alertAt: string;
  allowRaise: boolean;
  keepConversations: string;
  keepPassages: string;
  signIn: boolean[];
}

type Segment = { text: string; href?: string };

function renderSegments(segments: readonly Segment[]): ReactNode {
  return segments.map((segment, index) =>
    segment.href ? (
      <Link key={index} href={segment.href}>
        {segment.text}
      </Link>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}

function Section({
  title,
  note,
  featured = false,
  danger = false,
  labelledBy,
  children,
}: {
  title: string;
  note: ReactNode;
  featured?: boolean;
  danger?: boolean;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cx("card-sec ad-sec", featured && "card-sec-featured", danger && "ad-sec-danger")}
      aria-labelledby={labelledBy}
    >
      <div className="card-sec-body">
        <h2 id={labelledBy}>{title}</h2>
        {children}
      </div>
      <p className="card-sec-note">{note}</p>
    </section>
  );
}

export function WorkspaceForm({ settings }: { settings: Settings }) {
  // Saved ceiling is carried by the fixture's "changed from $0.10" note — derive it, don't hardcode.
  const savedCeiling = settings.answerDefaults.perAnswerNote.replace(/^changed from\s*/, "");

  const initialBaseline: FormValues = {
    name: settings.identity.name,
    slug: settings.identity.slug,
    model: settings.answerDefaults.model,
    citationRule: settings.answerDefaults.citationRule,
    freshness: String(settings.answerDefaults.sourceFreshnessDays),
    ceiling: savedCeiling,
    limit: settings.spending.monthlyLimit,
    alertAt: settings.spending.alertThreshold,
    allowRaise: settings.spending.allowEditorsRaise,
    keepConversations: settings.retention.conversations,
    keepPassages: settings.retention.passages,
    signIn: settings.signIn.options.map((o) => o.checked),
  };

  const [baseline, setBaseline] = useState<FormValues>(initialBaseline);
  const [values, setValues] = useState<FormValues>({
    ...initialBaseline,
    ceiling: settings.answerDefaults.perAnswerCeiling,
  });

  // Count field-level changes: scalar fields individually + each flipped sign-in option.
  const scalarChanges = (Object.keys(baseline) as Array<keyof FormValues>).filter(
    (key) => key !== "signIn" && baseline[key] !== values[key],
  ).length;
  const signInChanges = values.signIn.filter((checked, i) => checked !== baseline.signIn[i]).length;
  const totalChanges = scalarChanges + signInChanges;

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function discard() {
    setValues(baseline);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBaseline(values);
  }

  const ceilingChanged = values.ceiling !== baseline.ceiling;
  // The spending note bolds the amount spent so far, as the screen shows it.
  const spendingNoteParts = settings.spending.note.split("$184");

  return (
    <form onSubmit={save}>
      <header className="ph ad-ph">
        <div className="ad-ph-left ad-ph-left-tight">
          <span className="sub">
            {settings.identity.name} <span className="sep">/</span> Settings
          </span>
          <h1>Workspace settings</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {totalChanges > 0 ? (
            <span className="tag tag-highlight" role="status">
              {totalChanges} unsaved {totalChanges === 1 ? "change" : "changes"}
            </span>
          ) : null}
          <button type="button" className="btn gh" onClick={discard}>
            Discard
          </button>
          <button type="submit" className="btn dk">
            Save
          </button>
        </div>
      </header>

      <div className="ad-formwrap">
        <Section title="Identity" labelledBy="ws-identity-h" note={settings.identity.addressNote}>
          <div className="fr">
            <label htmlFor="ws-name">Workspace name</label>
            <input
              id="ws-name"
              className="inp"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div className="fr">
            <label htmlFor="ws-slug">Address</label>
            <div className="ad-addr">
              <span className="ad-addr-prefix">{settings.identity.addressPrefix}</span>
              <input
                id="ws-slug"
                className="inp mono ad-addr-input"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
              />
            </div>
          </div>
        </Section>

        <Section title="Answer defaults" labelledBy="ws-answers-h" featured note={settings.answerDefaults.note}>
          <div className="fr">
            <label htmlFor="ws-model">Default model</label>
            <select
              id="ws-model"
              className="sel ad-sel"
              value={values.model}
              onChange={(e) => set("model", e.target.value)}
            >
              {settings.answerDefaults.modelOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="fr">
            <label htmlFor="ws-citations">Citations</label>
            <select
              id="ws-citations"
              className="sel ad-sel"
              value={values.citationRule}
              onChange={(e) => set("citationRule", e.target.value)}
            >
              {settings.answerDefaults.citationOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="fr">
            <label htmlFor="ws-freshness">Source freshness</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="ws-freshness"
                className="inp mono"
                style={{ width: 64, textAlign: "right" }}
                type="text"
                inputMode="numeric"
                value={values.freshness}
                onChange={(e) => set("freshness", e.target.value)}
              />
              <span style={{ color: "var(--ink-2)" }}>days</span>
            </div>
          </div>
          <div className="fr">
            <label htmlFor="ws-ceiling">Stop an answer at</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <input
                id="ws-ceiling"
                className={cx("inp", "mono", ceilingChanged && "ad-changed")}
                style={{ width: 84, textAlign: "right" }}
                type="text"
                value={values.ceiling}
                onChange={(e) => set("ceiling", e.target.value)}
                aria-describedby={ceilingChanged ? "ws-ceiling-changed" : undefined}
              />
              {ceilingChanged ? (
                <span id="ws-ceiling-changed" style={{ fontSize: 12, color: "var(--ink-3)" }}>
                  changed from <span className="mono">{baseline.ceiling}</span>
                </span>
              ) : null}
            </div>
          </div>
        </Section>

        <Section
          title="Spending"
          labelledBy="ws-spending-h"
          note={
            <>
              {spendingNoteParts[0]}
              <b style={{ color: "var(--ink)", fontWeight: 600 }}>$184</b>
              {spendingNoteParts.slice(1).join("$184")}
            </>
          }
        >
          <div className="fr">
            <label htmlFor="ws-limit">Limit per billing cycle</label>
            <input
              id="ws-limit"
              className="inp mono"
              style={{ width: 100, textAlign: "right" }}
              type="text"
              value={values.limit}
              onChange={(e) => set("limit", e.target.value)}
            />
          </div>
          <div className="fr">
            <label htmlFor="ws-alert">Alert admins at</label>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                id="ws-alert"
                className="inp mono"
                style={{ width: 64, textAlign: "right" }}
                type="text"
                inputMode="numeric"
                value={values.alertAt}
                onChange={(e) => set("alertAt", e.target.value)}
              />
              <span style={{ color: "var(--ink-2)" }}>% of the limit</span>
            </div>
          </div>
          <label className="ad-ck">
            <input
              type="checkbox"
              checked={values.allowRaise}
              onChange={(e) => set("allowRaise", e.target.checked)}
            />
            <span>{settings.spending.allowEditorsLabel}</span>
          </label>
        </Section>

        <Section title="Retention" labelledBy="ws-retention-h" note={settings.retention.note}>
          <div className="fr">
            <label htmlFor="ws-keep-conversations">Keep conversations</label>
            <select
              id="ws-keep-conversations"
              className="sel ad-sel"
              value={values.keepConversations}
              onChange={(e) => set("keepConversations", e.target.value)}
            >
              {settings.retention.conversationsOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="fr">
            <label htmlFor="ws-keep-passages">Keep cited passages</label>
            <select
              id="ws-keep-passages"
              className="sel ad-sel"
              value={values.keepPassages}
              onChange={(e) => set("keepPassages", e.target.value)}
            >
              {settings.retention.passagesOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </Section>

        <Section title="Sign-in" labelledBy="ws-signin-h" note={settings.signIn.note}>
          {settings.signIn.options.map((option, index) => {
            const disabled = "disabled" in option && Boolean(option.disabled);
            const content = (
              <>
                <input
                  type="checkbox"
                  checked={values.signIn[index] ?? false}
                  disabled={disabled}
                  aria-label={disabled ? "Single sign-on, available on Enterprise" : undefined}
                  onChange={(e) =>
                    set(
                      "signIn",
                      values.signIn.map((value, i) => (i === index ? e.target.checked : value)),
                    )
                  }
                />
                <span>
                  {"labelSegments" in option && option.labelSegments
                    ? (option.labelSegments as readonly Segment[]).map((segment, segmentIndex) =>
                        segment.href ? (
                          <Link key={segmentIndex} href={segment.href} className="tag ln" style={{ textDecoration: "none" }}>
                            {segment.text}
                          </Link>
                        ) : (
                          <span key={segmentIndex}>{segment.text}</span>
                        ),
                      )
                    : option.label}
                </span>
              </>
            );
            return disabled ? (
              <div key={option.label} className="ad-ck" style={{ color: "var(--ink-3)" }}>
                {content}
              </div>
            ) : (
              <label key={option.label} className="ad-ck">
                {content}
              </label>
            );
          })}
        </Section>

        <Section
          title="Delete workspace"
          labelledBy="ws-delete-h"
          danger
          note={renderSegments(settings.deleteWorkspace.noteSegments as readonly Segment[])}
        >
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>
            {settings.deleteWorkspace.body}
          </p>
          <div>
            <button
              type="button"
              className="btn btn-destructive"
              style={{ alignSelf: "flex-start" }}
            >
              {settings.deleteWorkspace.buttonLabel}
            </button>
          </div>
        </Section>
      </div>
    </form>
  );
}
