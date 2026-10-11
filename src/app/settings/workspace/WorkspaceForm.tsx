"use client";

import { useState } from "react";
import { Button } from "../../../components/Button";
import { fieldDescribedBy } from "../../../components/Field";
import { SettingsSection } from "../../../components/SettingsSection";
import type { AdminData } from "../../../lib/types";

type Settings = AdminData["workspaceSettings"];

type FieldKey =
  | "name"
  | "slug"
  | "supportEmail"
  | "model"
  | "citationRule"
  | "sourceFreshnessDays"
  | "monthlyLimit"
  | "perAnswerCeiling"
  | "alertThreshold"
  | "passageYears"
  | "deletedDocumentDays";

type Values = Record<FieldKey, string>;

const CITATION_RULES = ["Every claim cited", "Key claims cited", "Citations when asked"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The one unsaved change the fixtures describe: the support email has been
 * edited away from support@sevynlabs.io, so that field starts changed.
 */
const CHANGED_SUPPORT_EMAIL = "hello@sevynlabs.io";

function valuesFromSettings(settings: Settings, supportEmail: string): Values {
  return {
    name: settings.identity.name,
    slug: settings.identity.slug,
    supportEmail,
    model: settings.answerDefaults.model,
    citationRule: settings.answerDefaults.citationRule,
    sourceFreshnessDays: String(settings.answerDefaults.sourceFreshnessDays),
    monthlyLimit: String(settings.spending.monthlyLimit),
    perAnswerCeiling: String(settings.spending.perAnswerCeiling),
    alertThreshold: String(settings.spending.alertThreshold),
    passageYears: String(settings.retention.passageYears),
    deletedDocumentDays: String(settings.retention.deletedDocumentDays),
  };
}

function validateField(key: FieldKey, value: string): string | undefined {
  const trimmed = value.trim();
  switch (key) {
    case "name":
      return trimmed ? undefined : "Enter a workspace name.";
    case "slug":
      if (!trimmed) return "Enter a slug.";
      return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)
        ? undefined
        : "Use lowercase letters, numbers and hyphens.";
    case "supportEmail":
      if (!trimmed) return "Enter a support email address.";
      return EMAIL_PATTERN.test(trimmed) ? undefined : "Enter a valid email address.";
    case "sourceFreshnessDays": {
      const days = Number(trimmed);
      return Number.isInteger(days) && days >= 0 ? undefined : "Enter a whole number of days.";
    }
    case "monthlyLimit": {
      const limit = Number(trimmed);
      return Number.isFinite(limit) && limit > 0 ? undefined : "Enter a monthly limit above $0.";
    }
    case "perAnswerCeiling": {
      const ceiling = Number(trimmed);
      return Number.isFinite(ceiling) && ceiling > 0 ? undefined : "Enter a per-answer ceiling above $0.";
    }
    case "alertThreshold": {
      const threshold = Number(trimmed);
      return Number.isFinite(threshold) && threshold >= 1 && threshold <= 100
        ? undefined
        : "Enter a percentage between 1 and 100.";
    }
    case "passageYears": {
      const years = Number(trimmed);
      return Number.isInteger(years) && years > 0 ? undefined : "Enter a whole number of years above 0.";
    }
    case "deletedDocumentDays": {
      const days = Number(trimmed);
      return Number.isInteger(days) && days >= 0 ? undefined : "Enter a whole number of days.";
    }
    default:
      return undefined;
  }
}

function GridRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="settings-grid">
      <label className="settings-grid-label" htmlFor={htmlFor}>
        {label}
      </label>
      <div>{children}</div>
    </div>
  );
}

export function WorkspaceForm({
  settings,
  models,
}: {
  settings: Settings;
  models: Array<{ id: string; name: string }>;
}) {
  const [saved, setSaved] = useState<Values>(() =>
    valuesFromSettings(settings, settings.identity.supportEmail),
  );
  const [values, setValues] = useState<Values>(() =>
    valuesFromSettings(settings, CHANGED_SUPPORT_EMAIL),
  );
  const [google, setGoogle] = useState(settings.signIn.google);
  const [savedGoogle, setSavedGoogle] = useState(settings.signIn.google);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const changedKeys = (Object.keys(values) as FieldKey[]).filter((key) => values[key] !== saved[key]);
  const unsavedChanges = changedKeys.length + (google !== savedGoogle ? 1 : 0);

  function update(key: FieldKey, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
    setSavedMessage(false);
    if (submitted) {
      setErrors((current) => ({ ...current, [key]: validateField(key, value) }));
    }
  }

  function handleDiscard() {
    setValues(saved);
    setGoogle(savedGoogle);
    setErrors({});
    setSubmitted(false);
    setSavedMessage(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    const nextErrors: Partial<Record<FieldKey, string>> = {};
    (Object.keys(values) as FieldKey[]).forEach((key) => {
      const error = validateField(key, values[key]);
      if (error) nextErrors[key] = error;
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSavedMessage(false);
      return;
    }
    setSaved(values);
    setSavedGoogle(google);
    setSavedMessage(true);
  }

  function controlProps(key: FieldKey, helper?: string) {
    const error = errors[key];
    return {
      id: `workspace-${key}`,
      className:
        values[key] !== saved[key] ? "field-control is-changed" : "field-control",
      "aria-invalid": error ? (true as const) : undefined,
      "aria-describedby": fieldDescribedBy(`workspace-${key}`, { helper, error }),
    };
  }

  function fieldNotes(key: FieldKey, helper?: string) {
    const error = errors[key];
    return (
      <>
        {values[key] !== saved[key] ? (
          <p className="changed-note">changed from {saved[key]}</p>
        ) : null}
        {helper ? (
          <p className="field-helper" id={`workspace-${key}-helper`}>
            {helper}
          </p>
        ) : null}
        {error ? (
          <p className="field-error" id={`workspace-${key}-error`} role="alert">
            {error}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <header className="page-head">
        <div className="page-head-row">
          <div className="stack-2">
            <h1 className="page-title">Workspace</h1>
            <p className="caption" role="status">
              {unsavedChanges > 0
                ? `${unsavedChanges} unsaved ${unsavedChanges === 1 ? "change" : "changes"}`
                : savedMessage
                  ? "All changes saved"
                  : "No unsaved changes"}
            </p>
          </div>
          <div className="row">
            <Button variant="secondary" size="md" onClick={handleDiscard} disabled={unsavedChanges === 0}>
              Discard
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save
            </Button>
          </div>
        </div>
      </header>

      <SettingsSection
        title="Identity"
        margin={
          <p className="caption">
            The name and slug appear in shared links and on every answer this workspace sends outside
            Cortex.
          </p>
        }
      >
        <div className="stack-5">
          <GridRow label="Workspace name" htmlFor="workspace-name">
            <input
              {...controlProps("name")}
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
            />
            {fieldNotes("name")}
          </GridRow>
          <GridRow label="Slug" htmlFor="workspace-slug">
            <input
              {...controlProps("slug", "Used in shared links.")}
              value={values.slug}
              onChange={(event) => update("slug", event.target.value)}
            />
            {fieldNotes("slug", "Used in shared links.")}
          </GridRow>
          <GridRow label="Support email" htmlFor="workspace-supportEmail">
            <input
              {...controlProps("supportEmail", "Replies to shared answers are sent to this address.")}
              type="email"
              value={values.supportEmail}
              onChange={(event) => update("supportEmail", event.target.value)}
            />
            {fieldNotes("supportEmail", "Replies to shared answers are sent to this address.")}
          </GridRow>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Answer defaults"
        margin={
          <p className="caption">
            These defaults apply to new conversations. Conversations already started keep the settings
            they began with.
          </p>
        }
      >
        <div className="stack-5">
          <GridRow label="Model" htmlFor="workspace-model">
            <select
              {...controlProps("model")}
              value={values.model}
              onChange={(event) => update("model", event.target.value)}
            >
              {models.map((model) => (
                <option key={model.id} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            {fieldNotes("model")}
          </GridRow>
          <GridRow label="Citation rule" htmlFor="workspace-citationRule">
            <select
              {...controlProps("citationRule")}
              value={values.citationRule}
              onChange={(event) => update("citationRule", event.target.value)}
            >
              {CITATION_RULES.map((rule) => (
                <option key={rule} value={rule}>
                  {rule}
                </option>
              ))}
            </select>
            {fieldNotes("citationRule")}
          </GridRow>
          <GridRow label="Source freshness, days" htmlFor="workspace-sourceFreshnessDays">
            <input
              {...controlProps("sourceFreshnessDays", "Passages older than this are marked as stale in answers.")}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={values.sourceFreshnessDays}
              onChange={(event) => update("sourceFreshnessDays", event.target.value)}
            />
            {fieldNotes("sourceFreshnessDays", "Passages older than this are marked as stale in answers.")}
          </GridRow>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Spending"
        margin={
          <p className="caption">
            When monthly spend reaches the limit, new answers stop until an admin raises the limit or
            the next cycle starts.
          </p>
        }
      >
        <div className="stack-5">
          <GridRow label="Monthly limit, $" htmlFor="workspace-monthlyLimit">
            <input
              {...controlProps("monthlyLimit")}
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={values.monthlyLimit}
              onChange={(event) => update("monthlyLimit", event.target.value)}
            />
            {fieldNotes("monthlyLimit")}
          </GridRow>
          <GridRow label="Per-answer ceiling, $" htmlFor="workspace-perAnswerCeiling">
            <input
              {...controlProps("perAnswerCeiling", "A single answer stops when its cost reaches the ceiling.")}
              type="number"
              min={0}
              step={0.01}
              inputMode="decimal"
              value={values.perAnswerCeiling}
              onChange={(event) => update("perAnswerCeiling", event.target.value)}
            />
            {fieldNotes("perAnswerCeiling", "A single answer stops when its cost reaches the ceiling.")}
          </GridRow>
          <GridRow label="Alert at, %" htmlFor="workspace-alertThreshold">
            <input
              {...controlProps("alertThreshold", "Admins are emailed when spend reaches this share of the monthly limit.")}
              type="number"
              min={1}
              max={100}
              step={1}
              inputMode="numeric"
              value={values.alertThreshold}
              onChange={(event) => update("alertThreshold", event.target.value)}
            />
            {fieldNotes("alertThreshold", "Admins are emailed when spend reaches this share of the monthly limit.")}
          </GridRow>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Retention"
        margin={
          <p className="caption">
            Passages stay available for citation after a document is deleted, until the retention period
            ends. After that they cannot be recovered.
          </p>
        }
      >
        <div className="stack-5">
          <GridRow label="Keep passages, years" htmlFor="workspace-passageYears">
            <input
              {...controlProps("passageYears")}
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={values.passageYears}
              onChange={(event) => update("passageYears", event.target.value)}
            />
            {fieldNotes("passageYears")}
          </GridRow>
          <GridRow label="Deleted documents, days" htmlFor="workspace-deletedDocumentDays">
            <input
              {...controlProps("deletedDocumentDays", "Deleted documents are removed for good after this many days.")}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={values.deletedDocumentDays}
              onChange={(event) => update("deletedDocumentDays", event.target.value)}
            />
            {fieldNotes("deletedDocumentDays", "Deleted documents are removed for good after this many days.")}
          </GridRow>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sign-in"
        margin={
          <p className="caption">
            People sign in with an address at this workspace&rsquo;s domain. Turning a method off stops
            new sign-ins with it right away.
          </p>
        }
      >
        <div className="stack-5">
          <div className="settings-grid">
            <span className="settings-grid-label" id="signin-google-label">
              Google
            </span>
            <label className="check-row">
              <input
                type="checkbox"
                checked={google}
                onChange={(event) => {
                  setGoogle(event.target.checked);
                  setSavedMessage(false);
                }}
                aria-labelledby="signin-google-label"
              />
              <span>Allow signing in with Google</span>
            </label>
          </div>
          <div className="settings-grid">
            <span className="settings-grid-label">Single sign-on (SSO)</span>
            <div className="stack-2">
              <div className="row">
                <span className="ui-text">{settings.signIn.sso.state}</span>
                <Button variant="quiet" size="sm">
                  Enterprise
                </Button>
              </div>
              <p className="caption">{settings.signIn.sso.label}</p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Delete workspace"
        margin={
          <p className="caption">
            <span className="danger-text">Deleting cannot be undone.</span> Export anything the team
            still needs before you delete.
          </p>
        }
      >
        <div className="stack-4">
          <p className="ui-text">
            Deleting this workspace removes every conversation, document and playbook for everyone in{" "}
            {settings.identity.name}. This cannot be undone.
          </p>
          <div>
            <Button variant="destructive" size="md">
              Delete workspace
            </Button>
          </div>
        </div>
      </SettingsSection>
    </form>
  );
}
