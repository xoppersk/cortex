"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { Button } from "../../../components/Button";
import { SettingsHeader } from "../../../components/Shells";
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

function Section({
  title,
  note,
  changed = false,
  danger = false,
  children,
}: {
  title: string;
  note: ReactNode;
  changed?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cx("pv-card pv-ss", changed && "pv-ss-changed", danger && "pv-ss-danger")} aria-label={title}>
      <div className="pv-ss-body">
        <h2 className="pv-ss-h">{title}</h2>
        {children}
      </div>
      <p className="pv-ss-note">{note}</p>
    </section>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="pv-fr">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span className="pv-fr-lb">{label}</span>}
      {children}
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

/* Bold the money figure in a margin note ("$184 is spent so far"). */
function boldMoney(text: string): ReactNode {
  const parts = text.split(/(\$\d[\d,.]*)/);
  return parts.map((part, index) => (/^\$\d/.test(part) ? <b key={index}>{part}</b> : <span key={index}>{part}</span>));
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
  const isChanged = (key: Exclude<keyof FormValues, "signIn">) => baseline[key] !== values[key];
  const scalarChanges = (Object.keys(baseline) as Array<keyof FormValues>).filter(
    (key) => key !== "signIn" && baseline[key] !== values[key],
  ).length;
  const signInChanges = values.signIn.filter((checked, i) => checked !== baseline.signIn[i]).length;
  const totalChanges = scalarChanges + signInChanges;
  const anyChanged = (...keys: Array<Exclude<keyof FormValues, "signIn">>) => keys.some(isChanged);

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

  const control = (base: string, key: Exclude<keyof FormValues, "signIn">) => cx(base, isChanged(key) && "pv-inp-changed");

  return (
    <form onSubmit={save} aria-label="Workspace settings">
      <SettingsHeader
        title="Workspace settings"
        actions={
          <>
            {totalChanges > 0 ? (
              <span role="status" className="pv-tag pv-tag-hl">
                {totalChanges} unsaved {totalChanges === 1 ? "change" : "changes"}
              </span>
            ) : (
              <span role="status" className="sr-only">
                All changes saved
              </span>
            )}
            <Button variant="quiet" onClick={discard} disabled={totalChanges === 0}>
              Discard
            </Button>
            <Button variant="primary" type="submit">
              Save
            </Button>
          </>
        }
      />

      <div className="pv-set-form">
        <Section title="Identity" note={settings.identity.addressNote} changed={anyChanged("name", "slug")}>
          <Row label="Workspace name" htmlFor="ws-name">
            <input id="ws-name" className={control("pv-inp", "name")} value={values.name} onChange={(e) => set("name", e.target.value)} />
          </Row>
          <Row label="Address" htmlFor="ws-slug">
            <div className="pv-affix">
              <span aria-hidden="true">{settings.identity.addressPrefix}</span>
              <input
                id="ws-slug"
                className={control("pv-inp pv-mono", "slug")}
                value={values.slug}
                onChange={(e) => set("slug", e.target.value)}
                aria-describedby="ws-slug-prefix"
              />
              <span id="ws-slug-prefix" className="sr-only">
                Full address {settings.identity.addressPrefix}
                {values.slug}
              </span>
            </div>
          </Row>
        </Section>

        <Section
          title="Answer defaults"
          note={settings.answerDefaults.note}
          changed={anyChanged("model", "citationRule", "freshness", "ceiling")}
        >
          <Row label="Default model" htmlFor="ws-model">
            <select id="ws-model" className={control("pv-sel", "model")} value={values.model} onChange={(e) => set("model", e.target.value)}>
              {settings.answerDefaults.modelOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Row>
          <Row label="Citations" htmlFor="ws-citations">
            <select
              id="ws-citations"
              className={control("pv-sel", "citationRule")}
              value={values.citationRule}
              onChange={(e) => set("citationRule", e.target.value)}
            >
              {settings.answerDefaults.citationOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Row>
          <Row label="Source freshness" htmlFor="ws-freshness">
            <div className="pv-fr-inline">
              <input
                id="ws-freshness"
                className={control("pv-inp pv-mono pv-inp-num", "freshness")}
                style={{ width: 64 }}
                type="text"
                inputMode="numeric"
                value={values.freshness}
                onChange={(e) => set("freshness", e.target.value)}
              />
              <span>days</span>
            </div>
          </Row>
          <Row label="Stop an answer at" htmlFor="ws-ceiling">
            <div className="pv-fr-inline" style={{ gap: 10 }}>
              <input
                id="ws-ceiling"
                className={control("pv-inp pv-mono pv-inp-num", "ceiling")}
                style={{ width: 84 }}
                type="text"
                value={values.ceiling}
                onChange={(e) => set("ceiling", e.target.value)}
              />
              {isChanged("ceiling") ? (
                <span className="pv-changed-from">
                  changed from <span className="pv-mono">{baseline.ceiling}</span>
                </span>
              ) : null}
            </div>
          </Row>
        </Section>

        <Section title="Spending" note={boldMoney(settings.spending.note)} changed={anyChanged("limit", "alertAt", "allowRaise")}>
          <Row label="Limit per billing cycle" htmlFor="ws-limit">
            <input
              id="ws-limit"
              className={control("pv-inp pv-mono pv-inp-num", "limit")}
              style={{ width: 100 }}
              type="text"
              value={values.limit}
              onChange={(e) => set("limit", e.target.value)}
            />
          </Row>
          <Row label="Alert admins at" htmlFor="ws-alert">
            <div className="pv-fr-inline">
              <input
                id="ws-alert"
                className={control("pv-inp pv-mono pv-inp-num", "alertAt")}
                style={{ width: 64 }}
                type="text"
                inputMode="numeric"
                value={values.alertAt}
                onChange={(e) => set("alertAt", e.target.value)}
              />
              <span>% of the limit</span>
            </div>
          </Row>
          <label className="pv-sck">
            <input type="checkbox" checked={values.allowRaise} onChange={(e) => set("allowRaise", e.target.checked)} />
            <span>{settings.spending.allowEditorsLabel}</span>
          </label>
        </Section>

        <Section title="Retention" note={settings.retention.note} changed={anyChanged("keepConversations", "keepPassages")}>
          <Row label="Keep conversations" htmlFor="ws-keep-conversations">
            <select
              id="ws-keep-conversations"
              className={control("pv-sel", "keepConversations")}
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
              className={control("pv-sel", "keepPassages")}
              value={values.keepPassages}
              onChange={(e) => set("keepPassages", e.target.value)}
            >
              {settings.retention.passagesOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </Row>
        </Section>

        <Section title="Sign-in" note={settings.signIn.note} changed={signInChanges > 0}>
          {settings.signIn.options.map((option, index) => {
            const disabled = "disabled" in option && Boolean(option.disabled);
            const segments = "labelSegments" in option && option.labelSegments ? (option.labelSegments as readonly Segment[]) : null;
            const checkbox = (
              <input
                type="checkbox"
                checked={values.signIn[index] ?? false}
                disabled={disabled}
                aria-label={disabled ? `${option.label.split(" · ")[0]}, available on the Enterprise plan` : undefined}
                onChange={(e) =>
                  set(
                    "signIn",
                    values.signIn.map((value, i) => (i === index ? e.target.checked : value)),
                  )
                }
              />
            );
            if (disabled && segments) {
              const link = segments.find((segment) => segment.href);
              const text = segments
                .filter((segment) => !segment.href)
                .map((segment) => segment.text)
                .join("");
              return (
                <div key={option.label} className="pv-sck pv-sck-off">
                  {checkbox}
                  <span>
                    {text}
                    {link ? (
                      <Link href={link.href!} className="pv-tag pv-tag-ln pv-tag-ln-link">
                        {link.text}
                      </Link>
                    ) : null}
                  </span>
                </div>
              );
            }
            return (
              <label key={option.label} className="pv-sck">
                {checkbox}
                <span>{segments ? renderSegments(segments) : option.label}</span>
              </label>
            );
          })}
        </Section>

        <Section title="Delete workspace" danger note={renderSegments(settings.deleteWorkspace.noteSegments as readonly Segment[])}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: "var(--ink-2)" }}>{settings.deleteWorkspace.body}</p>
          <Button variant="secondary" className="pv-btn-danger">
            {settings.deleteWorkspace.buttonLabel}
          </Button>
        </Section>
      </div>
    </form>
  );
}
