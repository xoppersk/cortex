"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "../../../components/Button";
import { SettingsSection } from "../../../components/SettingsSection";
import type { AdminData } from "../../../lib/types";

type Profile = AdminData["profile"];

const APPEARANCE_OPTIONS = ["Light", "Dark", "Match system"] as const;
type Appearance = (typeof APPEARANCE_OPTIONS)[number];

const TEXT_SIZE_PX: Record<string, number> = {
  "Comfortable · 18": 18,
  "Compact · 16": 16,
  "Large · 20": 20,
};

function applyAppearance(appearance: Appearance) {
  const stored = appearance === "Match system" ? "system" : appearance.toLowerCase();
  try {
    window.localStorage.setItem("cortex-theme", stored);
  } catch {
    // Storage can be unavailable; the theme still applies for this session.
  }
  const effective =
    appearance === "Match system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : appearance.toLowerCase();
  document.documentElement.dataset.theme = effective;
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

function getStoredTheme(): string | null {
  try {
    return window.localStorage.getItem("cortex-theme");
  } catch {
    return null;
  }
}

function MarginNote({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12, lineHeight: 1.5, color: "var(--ink-2)" }}>{children}</p>;
}

function GridRow({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="settings-grid" style={{ alignItems: "center", marginBottom: "var(--space-4)" }}>
      {htmlFor ? (
        <label className="settings-grid-label" htmlFor={htmlFor} style={{ paddingTop: 0 }}>
          {label}
        </label>
      ) : (
        <span className="settings-grid-label" style={{ paddingTop: 0 }}>
          {label}
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}

function notificationLabel(label: string): ReactNode {
  const suffix = " · admins only";
  if (label.endsWith(suffix)) {
    return (
      <>
        {label.slice(0, -suffix.length)}
        <span style={{ color: "var(--ink-3)" }}>{suffix}</span>
      </>
    );
  }
  return label;
}

function sessionName(name: string): ReactNode {
  const suffix = " · this device";
  if (name.endsWith(suffix)) {
    return (
      <>
        <span style={{ fontWeight: 500, color: "var(--ink)" }}>{name.slice(0, -suffix.length)}</span>
        {suffix}
      </>
    );
  }
  return <span style={{ fontWeight: 500, color: "var(--ink)" }}>{name}</span>;
}

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [name, setName] = useState(profile.name);
  const [teamLabel, setTeamLabel] = useState(profile.teamLabel);
  const [notifications, setNotifications] = useState(profile.notifications.map((n) => n.checked));
  const fixtureAppearance: Appearance = APPEARANCE_OPTIONS.includes(
    profile.reading.appearance as Appearance,
  )
    ? (profile.reading.appearance as Appearance)
    : "Light";
  const storedTheme = useSyncExternalStore(subscribeToStorage, getStoredTheme, () => null);
  const storedAppearance: Appearance | null =
    storedTheme === "dark"
      ? "Dark"
      : storedTheme === "light"
        ? "Light"
        : storedTheme === "system"
          ? "Match system"
          : null;
  const [chosenAppearance, setChosenAppearance] = useState<Appearance | null>(null);
  const appearance = chosenAppearance ?? storedAppearance ?? fixtureAppearance;
  const [textSize, setTextSize] = useState(profile.reading.textSize);
  const [placement, setPlacement] = useState(profile.reading.sourcePlacement);
  const [sessions, setSessions] = useState(profile.sessions);

  function chooseAppearance(next: Appearance) {
    setChosenAppearance(next);
    applyAppearance(next);
  }

  const previewPx = TEXT_SIZE_PX[textSize] ?? 18;
  const sourcesBelow = placement === "Below each answer";

  return (
    <div>
      <div
        style={{
          margin: "-40px -40px 0",
          padding: "28px 40px 18px",
          borderBottom: "1px solid var(--rule)",
          marginBottom: "var(--space-2)",
        }}
      >
        <h1 className="page-title">Profile and preferences</h1>
      </div>

      <SettingsSection title="Profile" margin={<MarginNote>{profile.profileNote}</MarginNote>}>
        <GridRow label="Name" htmlFor="profile-name">
          <input
            id="profile-name"
            className="field-control field-control-32"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </GridRow>
        <GridRow label="Email" htmlFor="profile-email">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
            <input id="profile-email" className="field-control field-control-32" value={email} readOnly />
            <a href="#" onClick={(event) => event.preventDefault()} style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              Change
            </a>
          </div>
        </GridRow>
        <GridRow label="Team label" htmlFor="profile-team">
          <input
            id="profile-team"
            className="field-control field-control-32"
            value={teamLabel}
            onChange={(event) => setTeamLabel(event.target.value)}
          />
        </GridRow>
      </SettingsSection>

      <SettingsSection title="Email me when" margin={<MarginNote>{profile.notificationsNote}</MarginNote>}>
        <div className="stack-3">
          {profile.notifications.map((notification, index) => (
            <label key={notification.label} className="check-row">
              <input
                type="checkbox"
                checked={notifications[index] ?? false}
                onChange={(event) =>
                  setNotifications((previous) =>
                    previous.map((value, i) => (i === index ? event.target.checked : value)),
                  )
                }
              />
              <span>{notificationLabel(notification.label)}</span>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Reading"
        margin={<MarginNote>Sources move below each answer automatically on narrow screens.</MarginNote>}
      >
        <GridRow label="Appearance">
          <div className="segmented" role="radiogroup" aria-label="Appearance">
            {APPEARANCE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={appearance === option}
                onClick={() => chooseAppearance(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </GridRow>
        <GridRow label="Answer text size" htmlFor="profile-text-size">
          <select
            id="profile-text-size"
            className="field-control field-control-32"
            style={{ width: 160 }}
            value={textSize}
            onChange={(event) => setTextSize(event.target.value)}
          >
            {profile.reading.textSizeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </GridRow>
        <GridRow label="Show sources" htmlFor="profile-sources">
          <select
            id="profile-sources"
            className="field-control field-control-32"
            style={{ width: 220 }}
            value={placement}
            onChange={(event) => setPlacement(event.target.value)}
          >
            {profile.reading.sourcePlacementOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </GridRow>
        <div className="tint-box" aria-label="Reading preview">
          <p
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: previewPx,
              lineHeight: 1.6,
              color: "var(--ink-body)",
            }}
          >
            Preview: every claim stays attached to its source
            {sourcesBelow ? null : <sup style={{ fontSize: 10, fontWeight: 600 }}>1</sup>}
          </p>
          {sourcesBelow ? (
            <p style={{ fontSize: 12, color: "var(--ink-3)", marginTop: "var(--space-2)" }}>
              <sup style={{ fontSize: 10, fontWeight: 600 }}>1</sup> Source
            </p>
          ) : null}
        </div>
      </SettingsSection>

      <SettingsSection title="Signed in" margin={<MarginNote>{profile.twoStepNote}</MarginNote>}>
        <div>
          {sessions.map((session) => (
            <div
              key={session.name}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr) 140px 90px",
                gap: "var(--space-4)",
                alignItems: "baseline",
                padding: "10px 0",
                borderTop: "1px solid var(--rule)",
                fontSize: 13,
              }}
            >
              <span style={{ color: "var(--ink-body)" }}>{sessionName(session.name)}</span>
              <span style={{ color: "var(--ink-2)" }}>{session.place}</span>
              <span style={{ color: "var(--ink-3)" }}>{session.when}</span>
            </div>
          ))}
        </div>
        <div className="row" style={{ marginTop: "var(--space-4)" }}>
          <Button variant="secondary" size="sm" onClick={() => setSessions((previous) => previous.slice(0, 1))}>
            Sign out other devices
          </Button>
          <Button variant="quiet" size="sm">
            Sign out
          </Button>
        </div>
      </SettingsSection>
    </div>
  );
}
