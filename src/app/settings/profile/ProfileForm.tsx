"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { Button } from "../../../components/Button";
import { Icon } from "../../../components/Icon";
import { SettingsHeader } from "../../../components/Shells";
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

function Section({ title, note, children }: { title: string; note: ReactNode; children: ReactNode }) {
  return (
    <section className="pv-card pv-ss" aria-label={title}>
      <div className="pv-ss-body" style={{ gap: 14 }}>
        <h2 className="pv-ss-h">{title}</h2>
        {children}
      </div>
      <p className="pv-ss-note">{note}</p>
    </section>
  );
}

function GridRow({ label, htmlFor, labelId, children }: { label: string; htmlFor?: string; labelId?: string; children: ReactNode }) {
  return (
    <div className="pv-fr">
      {htmlFor ? (
        <label htmlFor={htmlFor}>{label}</label>
      ) : (
        <span className="pv-fr-lb" id={labelId}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

function notificationLabel(label: string): ReactNode {
  const suffix = " · admins only";
  if (label.endsWith(suffix)) {
    return (
      <>
        {label.slice(0, -suffix.length)}
        <span className="pv-tag pv-tag-ln">admins only</span>
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
        <b>{name.slice(0, -suffix.length)}</b>
        <span className="pv-tag pv-tag-dk">this device</span>
      </>
    );
  }
  return <b>{name}</b>;
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
      <SettingsHeader
        title="Profile and preferences"
        align="center"
        leading={
          <span className="pv-av pv-av-ink pv-av-xl" aria-hidden="true">
            {name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </span>
        }
      />

      <form className="pv-set-form" onSubmit={(event) => event.preventDefault()} aria-label="Profile and preferences">
        <Section title="Profile" note={profile.profileNote}>
          <GridRow label="Name" htmlFor="profile-name">
            <input id="profile-name" className="pv-inp" value={name} onChange={(event) => setName(event.target.value)} />
          </GridRow>
          <GridRow label="Email" htmlFor="profile-email">
            <div className="pv-fr-inline" style={{ gap: 10 }}>
              <input id="profile-email" className="pv-inp pv-inp-ro" style={{ flex: 1, minWidth: 0 }} value={email} readOnly />
              <Button variant="secondary" size="sm" onClick={() => undefined}>
                Change
              </Button>
            </div>
          </GridRow>
          <GridRow label="Team label" htmlFor="profile-team">
            <input id="profile-team" className="pv-inp" value={teamLabel} onChange={(event) => setTeamLabel(event.target.value)} />
          </GridRow>
        </Section>

        <Section title="Email me when" note={profile.notificationsNote}>
          {profile.notifications.map((notification, index) => (
            <label key={notification.label} className="pv-sck">
              <input
                type="checkbox"
                checked={notifications[index] ?? false}
                onChange={(event) =>
                  setNotifications((previous) => previous.map((value, i) => (i === index ? event.target.checked : value)))
                }
              />
              <span>{notificationLabel(notification.label)}</span>
            </label>
          ))}
        </Section>

        <Section title="Reading" note="Sources move below each answer automatically on narrow screens.">
          <GridRow label="Appearance" labelId="appearance-label">
            <div className="pv-seg" role="radiogroup" aria-labelledby="appearance-label">
              {APPEARANCE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={appearance === option}
                  tabIndex={appearance === option ? 0 : -1}
                  onClick={() => chooseAppearance(option)}
                  onKeyDown={(event) => {
                    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
                    if (!step) return;
                    event.preventDefault();
                    const index = APPEARANCE_OPTIONS.indexOf(appearance);
                    const next = APPEARANCE_OPTIONS[(index + step + APPEARANCE_OPTIONS.length) % APPEARANCE_OPTIONS.length]!;
                    chooseAppearance(next);
                    const buttons = event.currentTarget.parentElement?.querySelectorAll("button");
                    buttons?.[APPEARANCE_OPTIONS.indexOf(next)]?.focus();
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </GridRow>
          <GridRow label="Answer text size" htmlFor="profile-text-size">
            <select id="profile-text-size" className="pv-sel" style={{ width: 180 }} value={textSize} onChange={(event) => setTextSize(event.target.value)}>
              {profile.reading.textSizeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </GridRow>
          <GridRow label="Show sources" htmlFor="profile-sources">
            <select id="profile-sources" className="pv-sel" style={{ width: 220, maxWidth: "100%" }} value={placement} onChange={(event) => setPlacement(event.target.value)}>
              {profile.reading.sourcePlacementOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </GridRow>
          <p className="pv-preview" aria-label="Reading preview" style={{ fontSize: previewPx }}>
            <span className="pv-preview-label">Preview:</span>
            every claim stays attached to its source
            {sourcesBelow ? null : <span className="footnote" aria-hidden="true">1</span>}.
            {sourcesBelow ? (
              <span className="pv-preview-sources">
                <span className="footnote" aria-hidden="true">1</span> Source
              </span>
            ) : null}
          </p>
        </Section>

        <Section title="Signed in" note={profile.twoStepNote}>
          <div role="table" aria-label="Active sessions" className="pv-sessions">
            {sessions.map((session) => {
              const now = session.when === "Now";
              return (
                <div role="row" key={session.name} className="pv-sr">
                  <span role="cell" aria-hidden="true">
                    <Icon name={session.name.includes("iPhone") ? "phone" : "laptop"} style={now ? { color: "var(--ink)" } : undefined} />
                  </span>
                  <span role="cell">{sessionName(session.name)}</span>
                  <span role="cell" style={{ color: "var(--ink-2)" }}>
                    {session.place}
                  </span>
                  <span role="cell" className={now ? "pv-ok-row" : undefined} style={now ? { gap: 6 } : { color: "var(--ink-3)" }}>
                    {now ? <span className="pv-dot" aria-hidden="true" /> : null}
                    {session.when}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="pv-fr-inline" style={{ flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={() => setSessions((previous) => previous.slice(0, 1))} disabled={sessions.length < 2}>
              Sign out other devices
            </Button>
            <Button variant="quiet">Sign out</Button>
          </div>
        </Section>
      </form>
    </div>
  );
}
