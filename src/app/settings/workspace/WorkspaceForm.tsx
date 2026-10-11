"use client";

import { useState, type ReactNode } from "react";
import { Button } from "../../../components/Button";
import type { AdminData } from "../../../lib/types";
import { cx } from "../../../lib/utils";

type Settings = AdminData["workspaceSettings"];

function Section({
  title,
  children,
  note,
}: {
  title: string;
  children: ReactNode;
  note?: string;
}) {
  return (
    <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
      <h2 className="section-label" style={{ fontSize: 15 }}>
        {title}
      </h2>
      {children}
      {note ? <p className="caption">{note}</p> : null}
    </section>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="settings-grid">
      {htmlFor ? (
        <label className="settings-grid-label" htmlFor={htmlFor}>
          {label}
        </label>
      ) : (
        <span className="settings-grid-label">{label}</span>
      )}
      <div className="stack-2">{children}</div>
    </div>
  );
}

export function WorkspaceForm({ settings }: { settings: Settings }) {
  const savedCeiling = "$0.10";
  const [name, setName] = useState(settings.identity.name);
  const [slug, setSlug] = useState(settings.identity.slug);
  const [model, setModel] = useState(settings.answerDefaults.model);
  const [citationRule, setCitationRule] = useState(settings.answerDefaults.citationRule);
  const [freshness, setFreshness] = useState(String(settings.answerDefaults.sourceFreshnessDays));
  const [ceiling, setCeiling] = useState(settings.answerDefaults.perAnswerCeiling);
  const [limit, setLimit] = useState(settings.spending.monthlyLimit);
  const [alertAt, setAlertAt] = useState(settings.spending.alertThreshold);
  const [allowRaise, setAllowRaise] = useState(settings.spending.allowEditorsRaise);
  const [keepConversations, setKeepConversations] = useState(settings.retention.conversations);
  const [keepPassages, setKeepPassages] = useState(settings.retention.passages);
  const [signInOptions, setSignInOptions] = useState(settings.signIn.options.map((o) => o.checked));
  const [savedMessage, setSavedMessage] = useState(false);

  const savedValues = {
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
  };
  const currentValues = {
    name, slug, model, citationRule, freshness, ceiling, limit, alertAt,
    allowRaise, keepConversations, keepPassages,
  };
  const changedCount =
    (Object.keys(savedValues) as Array<keyof typeof savedValues>).filter(
      (key) => savedValues[key] !== currentValues[key],
    ).length +
    signInOptions.filter((checked, i) => checked !== settings.signIn.options[i]!.checked).length;

  function discard() {
    setName(savedValues.name);
    setSlug(savedValues.slug);
    setModel(savedValues.model);
    setCitationRule(savedValues.citationRule);
    setFreshness(savedValues.freshness);
    setCeiling(savedValues.ceiling);
    setLimit(savedValues.limit);
    setAlertAt(savedValues.alertAt);
    setAllowRaise(savedValues.allowRaise);
    setKeepConversations(savedValues.keepConversations);
    setKeepPassages(savedValues.keepPassages);
    setSignInOptions(settings.signIn.options.map((o) => o.checked));
    setSavedMessage(false);
  }

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavedMessage(true);
  }

  const changedClass = (key: keyof typeof savedValues) =>
    cx("field-control", savedValues[key] !== currentValues[key] && "is-changed");

  return (
    <form onSubmit={save} className="stack-6" style={{ maxWidth: "var(--column-doc)" }}>
      <header className="page-head">
        <div className="page-head-row">
          <div className="stack-2">
            <h1 className="page-title">Workspace settings</h1>
            <p className="caption" role="status">
              {changedCount > 0
                ? `${changedCount} unsaved ${changedCount === 1 ? "change" : "changes"}`
                : savedMessage
                  ? "All changes saved"
                  : "No unsaved changes"}
            </p>
          </div>
          <div className="row">
            <Button variant="secondary" size="md" onClick={discard} disabled={changedCount === 0}>
              Discard
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save
            </Button>
          </div>
        </div>
      </header>

      <Section title="Identity">
        <Row label="Workspace name" htmlFor="ws-name">
          <input
            id="ws-name"
            className={changedClass("name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Row>
        <Row label="Address" htmlFor="ws-slug">
          <div className="row" style={{ alignItems: "center" }}>
            <span className="ui-text muted-3">{settings.identity.addressPrefix}</span>
            <input
              id="ws-slug"
              className={changedClass("slug")}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </div>
          <p className="field-helper">{settings.identity.addressNote}</p>
        </Row>
      </Section>

      <Section title="Answer defaults" note={settings.answerDefaults.note}>
        <Row label="Default model" htmlFor="ws-model">
          <select
            id="ws-model"
            className={changedClass("model")}
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {settings.answerDefaults.modelOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
        <Row label="Citations" htmlFor="ws-citations">
          <select
            id="ws-citations"
            className={changedClass("citationRule")}
            value={citationRule}
            onChange={(e) => setCitationRule(e.target.value)}
          >
            {settings.answerDefaults.citationOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
        <Row label="Source freshness" htmlFor="ws-freshness">
          <div className="row" style={{ alignItems: "center" }}>
            <input
              id="ws-freshness"
              className={changedClass("freshness")}
              style={{ width: 84 }}
              type="number"
              value={freshness}
              onChange={(e) => setFreshness(e.target.value)}
            />
            <span className="ui-text">days</span>
          </div>
        </Row>
        <Row label="Stop an answer at" htmlFor="ws-ceiling">
          <input
            id="ws-ceiling"
            className={changedClass("ceiling")}
            style={{ width: 120 }}
            value={ceiling}
            onChange={(e) => setCeiling(e.target.value)}
          />
          {ceiling !== savedCeiling ? (
            <p className="changed-note">changed from {savedCeiling}</p>
          ) : null}
        </Row>
      </Section>

      <Section title="Spending" note={settings.spending.note}>
        <Row label="Limit per billing cycle" htmlFor="ws-limit">
          <input
            id="ws-limit"
            className={changedClass("limit")}
            style={{ width: 120 }}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </Row>
        <Row label="Alert admins at" htmlFor="ws-alert">
          <div className="row" style={{ alignItems: "center" }}>
            <input
              id="ws-alert"
              className={changedClass("alertAt")}
              style={{ width: 84 }}
              type="number"
              value={alertAt}
              onChange={(e) => setAlertAt(e.target.value)}
            />
            <span className="ui-text">% of the limit</span>
          </div>
        </Row>
        <Row label="">
          <label className="check-row">
            <input
              type="checkbox"
              checked={allowRaise}
              onChange={(e) => setAllowRaise(e.target.checked)}
            />
            <span>{settings.spending.allowEditorsLabel}</span>
          </label>
        </Row>
      </Section>

      <Section title="Retention" note={settings.retention.note}>
        <Row label="Keep conversations" htmlFor="ws-keep-conversations">
          <select
            id="ws-keep-conversations"
            className={changedClass("keepConversations")}
            value={keepConversations}
            onChange={(e) => setKeepConversations(e.target.value)}
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
            value={keepPassages}
            onChange={(e) => setKeepPassages(e.target.value)}
          >
            {settings.retention.passagesOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Row>
      </Section>

      <Section title="Sign-in" note={settings.signIn.note}>
        <div className="stack-3">
          {settings.signIn.options.map((option, index) => (
            <label key={option.label} className="check-row">
              <input
                type="checkbox"
                checked={signInOptions[index] ?? false}
                disabled={"disabled" in option && Boolean(option.disabled)}
                onChange={(e) =>
                  setSignInOptions((previous) =>
                    previous.map((value, i) => (i === index ? e.target.checked : value)),
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </Section>

      <Section title="Delete workspace">
        <p className="ui-text">{settings.deleteWorkspace.body}</p>
        <div>
          <Button variant="destructive" size="md">
            {settings.deleteWorkspace.buttonLabel}
          </Button>
        </div>
        <p className="caption">{settings.deleteWorkspace.note}</p>
      </Section>
    </form>
  );
}
