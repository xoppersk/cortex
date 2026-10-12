"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "../../../components/Button";
import { SettingsSection } from "../../../components/SettingsSection";
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

function MarginNote({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>{children}</p>;
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="settings-grid" style={{ marginBottom: "var(--space-4)" }}>
      {htmlFor ? (
        <label className="settings-grid-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="settings-grid-label">{label}</span>
      )}
      <div>{children}</div>
    </div>
  );
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

  const changedClass = (key: keyof FormValues) =>
    cx("field-control field-control-32", baseline[key] !== values[key] && "is-changed");

  const numericStyle = (width: number) => ({ width, textAlign: "right" as const });

  return (
    <form onSubmit={save}>
      <div
        className="bleed-head"
        style={{ paddingTop: 28, paddingBottom: 18, marginBottom: "var(--space-2)" }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
          <h1 className="page-title">Workspace settings</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            {totalChanges > 0 ? (
              <span role="status" style={{ fontSize: 12, color: "var(--ink-4)" }}>
                {totalChanges} unsaved {totalChanges === 1 ? "change" : "changes"}
              </span>
            ) : null}
            <Button variant="quiet" size="sm" onClick={discard}>
              Discard
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save
            </Button>
          </div>
        </div>
      </div>

      <SettingsSection title="Identity" margin={<MarginNote>{settings.identity.addressNote}</MarginNote>}>
        <Row label="Workspace name" htmlFor="ws-name">
          <input
            id="ws-name"
            className={changedClass("name")}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </Row>
        <Row label="Address" htmlFor="ws-slug">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span className="ui-text muted-3">{settings.identity.addressPrefix}</span>
            <input
              id="ws-slug"
              className={changedClass("slug")}
              value={values.slug}
              onChange={(e) => set("slug", e.target.value)}
            />
          </div>
        </Row>
      </SettingsSection>

      <SettingsSection title="Answer defaults" margin={<MarginNote>{settings.answerDefaults.note}</MarginNote>}>
        <Row label="Default model" htmlFor="ws-model">
          <select id="ws-model" className={changedClass("model")} value={values.model} onChange={(e) => set("model", e.target.value)}>
            {settings.answerDefaults.modelOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
        <Row label="Citations" htmlFor="ws-citations">
          <select
            id="ws-citations"
            className={changedClass("citationRule")}
            value={values.citationRule}
            onChange={(e) => set("citationRule", e.target.value)}
          >
            {settings.answerDefaults.citationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
        <Row label="Source freshness" htmlFor="ws-freshness">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <input
              id="ws-freshness"
              className={changedClass("freshness")}
              style={numericStyle(64)}
              type="text"
              inputMode="numeric"
              value={values.freshness}
              onChange={(e) => set("freshness", e.target.value)}
            />
            <span className="ui-text">days</span>
          </div>
        </Row>
        <Row label="Stop an answer at" htmlFor="ws-ceiling">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <input
              id="ws-ceiling"
              className={changedClass("ceiling")}
              style={numericStyle(80)}
              type="text"
              value={values.ceiling}
              onChange={(e) => set("ceiling", e.target.value)}
            />
            {values.ceiling !== baseline.ceiling ? (
              <span style={{ fontSize: 12, color: "var(--ink-3)", whiteSpace: "nowrap" }}>
                changed from {baseline.ceiling}
              </span>
            ) : null}
          </div>
        </Row>
      </SettingsSection>

      <SettingsSection title="Spending" margin={<MarginNote>{settings.spending.note}</MarginNote>}>
        <Row label="Limit per billing cycle" htmlFor="ws-limit">
          <input
            id="ws-limit"
            className={changedClass("limit")}
            style={numericStyle(100)}
            type="text"
            value={values.limit}
            onChange={(e) => set("limit", e.target.value)}
          />
        </Row>
        <Row label="Alert admins at" htmlFor="ws-alert">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <input
              id="ws-alert"
              className={changedClass("alertAt")}
              style={numericStyle(64)}
              type="text"
              inputMode="numeric"
              value={values.alertAt}
              onChange={(e) => set("alertAt", e.target.value)}
            />
            <span className="ui-text">% of the limit</span>
          </div>
        </Row>
        <label className="check-row">
          <input
            type="checkbox"
            checked={values.allowRaise}
            onChange={(e) => set("allowRaise", e.target.checked)}
          />
          <span>{settings.spending.allowEditorsLabel}</span>
        </label>
      </SettingsSection>

      <SettingsSection title="Retention" margin={<MarginNote>{settings.retention.note}</MarginNote>}>
        <Row label="Keep conversations" htmlFor="ws-keep-conversations">
          <select
            id="ws-keep-conversations"
            className={changedClass("keepConversations")}
            value={values.keepConversations}
            onChange={(e) => set("keepConversations", e.target.value)}
          >
            {settings.retention.conversationsOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
        <Row label="Keep cited passages" htmlFor="ws-keep-passages">
          <select
            id="ws-keep-passages"
            className={changedClass("keepPassages")}
            value={values.keepPassages}
            onChange={(e) => set("keepPassages", e.target.value)}
          >
            {settings.retention.passagesOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
      </SettingsSection>

      <SettingsSection title="Sign-in" margin={<MarginNote>{settings.signIn.note}</MarginNote>}>
        <div className="stack-3">
          {settings.signIn.options.map((option, index) => (
            <label key={option.label} className="check-row">
              <input
                type="checkbox"
                checked={values.signIn[index] ?? false}
                disabled={"disabled" in option && Boolean(option.disabled)}
                onChange={(e) =>
                  set(
                    "signIn",
                    values.signIn.map((value, i) => (i === index ? e.target.checked : value)),
                  )
                }
              />
              <span>
                {"labelSegments" in option && option.labelSegments
                  ? renderSegments(option.labelSegments as readonly Segment[])
                  : option.label}
              </span>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Delete workspace"
        margin={
          <MarginNote>{renderSegments(settings.deleteWorkspace.noteSegments as readonly Segment[])}</MarginNote>
        }
      >
        <p className="ui-text" style={{ marginBottom: "var(--space-4)" }}>
          {settings.deleteWorkspace.body}
        </p>
        <div style={{ display: "flex" }}>
          <Button variant="destructive" size="sm">
            {settings.deleteWorkspace.buttonLabel}
          </Button>
        </div>
      </SettingsSection>
    </form>
  );
}
