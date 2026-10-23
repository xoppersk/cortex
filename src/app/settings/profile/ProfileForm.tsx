"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import type { AdminData } from "../../../lib/types";
import { updateProfileAction } from "../actions";

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

function Section({
  title,
  note,
  labelledBy,
  children,
}: {
  title: string;
  note: ReactNode;
  labelledBy: string;
  children: ReactNode;
}) {
  return (
    <section className="card-sec ad-sec" aria-labelledby={labelledBy}>
      <div className="card-sec-body">
        <h2 id={labelledBy}>{title}</h2>
        {children}
      </div>
      <p className="card-sec-note">{note}</p>
    </section>
  );
}

function MonitorIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ color: "var(--ink)" }}>
      <rect x="2" y="3" width="12" height="8" rx="1" />
      <path d="M1 13.5h14" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" style={{ color: "var(--ink)" }}>
      <rect x="4.5" y="1.5" width="7" height="13" rx="1.5" />
      <path d="M7 12.5h2" />
    </svg>
  );
}

export function ProfileForm({
  profile,
  email,
  workspaceName,
}: {
  profile: Profile;
  email: string;
  workspaceName: string;
}) {
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

  const initials = profile.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("");

  return (
    <div>
      <header className="ph ad-ph ad-ph-center">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="av ad-ph-avatar" aria-hidden="true">
            {initials}
          </span>
          <div className="ad-ph-left ad-ph-left-tight">
            <span className="sub">
              {workspaceName} <span className="sep">/</span> Settings
            </span>
            <h1>Profile and preferences</h1>
          </div>
        </div>
      </header>

      <form
        className="ad-formwrap"
        onSubmit={(event) => {
          event.preventDefault();
          // Persist the profile name (profiles.display_name). Notification
          // and reading preferences are local UI preferences in this phase.
          void updateProfileAction({ displayName: name });
        }}
      >
        <Section title="Profile" labelledBy="pf-profile-h" note={profile.profileNote}>
          <div className="fr">
            <label htmlFor="profile-name">Name</label>
            <input
              id="profile-name"
              className="inp"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <div className="fr">
            <label htmlFor="profile-email">Email</label>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                id="profile-email"
                className="inp"
                value={email}
                readOnly
                style={{ flex: 1, minWidth: 0, background: "var(--tint)", color: "var(--ink-2)" }}
              />
              {/* Canvas placeholder (href="#"); no change-email screen exists in this phase. */}
              <a href="#" onClick={(event) => event.preventDefault()} className="btn sm">
                Change
              </a>
            </div>
          </div>
          <div className="fr">
            <label htmlFor="profile-team">Team label</label>
            <input
              id="profile-team"
              className="inp"
              value={teamLabel}
              onChange={(event) => setTeamLabel(event.target.value)}
            />
          </div>
        </Section>

        <Section title="Email me when" labelledBy="pf-email-h" note={profile.notificationsNote}>
          {profile.notifications.map((notification, index) => {
            const suffix = " · admins only";
            const hasSuffix = notification.label.endsWith(suffix);
            return (
              <label key={notification.label} className="ad-ck">
                <input
                  type="checkbox"
                  checked={notifications[index] ?? false}
                  onChange={(event) =>
                    setNotifications((previous) =>
                      previous.map((value, i) => (i === index ? event.target.checked : value)),
                    )
                  }
                />
                <span>
                  {hasSuffix ? (
                    <>
                      {notification.label.slice(0, -suffix.length)}{" "}
                      <span className="tag ln" style={{ marginLeft: 4 }}>
                        admins only
                      </span>
                    </>
                  ) : (
                    notification.label
                  )}
                </span>
              </label>
            );
          })}
        </Section>

        <Section
          title="Reading"
          labelledBy="pf-reading-h"
          note="Sources move below each answer automatically on narrow screens."
        >
          <div className="fr">
            <span id="profile-appearance">Appearance</span>
            <div role="radiogroup" aria-labelledby="profile-appearance" className="seg" style={{ justifySelf: "start" }}>
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
          </div>
          <div className="fr">
            <label htmlFor="profile-text-size">Answer text size</label>
            <select
              id="profile-text-size"
              className="sel ad-sel"
              style={{ width: 180 }}
              value={textSize}
              onChange={(event) => setTextSize(event.target.value)}
            >
              {profile.reading.textSizeOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div className="fr">
            <label htmlFor="profile-sources">Show sources</label>
            <select
              id="profile-sources"
              className="sel ad-sel"
              style={{ width: 220 }}
              value={placement}
              onChange={(event) => setPlacement(event.target.value)}
            >
              {profile.reading.sourcePlacementOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <p className="ad-preview" style={{ fontSize: previewPx }} aria-label="Reading preview">
            <span className="ad-preview-label">Preview:</span>
            every claim stays attached to its source
            {sourcesBelow ? null : (
              <>
                <span className="cite">1</span>.
              </>
            )}
            {sourcesBelow ? (
              <span
                style={{
                  display: "block",
                  marginTop: "var(--space-2)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  color: "var(--ink-3)",
                }}
              >
                <span className="cite">1</span> Source
              </span>
            ) : null}
          </p>
        </Section>

        <Section title="Signed in" labelledBy="pf-signedin-h" note={profile.twoStepNote}>
          <div className="ad-sessions" role="table" aria-label="Active sessions">
            {sessions.map((session, index) => {
              const suffix = " · this device";
              const isThisDevice = session.name.endsWith(suffix);
              const displayName = isThisDevice ? session.name.slice(0, -suffix.length) : session.name;
              const isPhone = displayName.includes("iPhone");
              return (
                <div key={session.name} role="row" className="ad-sr2" style={index === 0 ? { borderTop: 0 } : undefined}>
                  <span role="cell" aria-hidden="true">
                    {isPhone ? <PhoneIcon /> : <MonitorIcon />}
                  </span>
                  <span role="cell">
                    <b style={{ fontWeight: 600, color: "var(--ink)" }}>{displayName}</b>
                    {isThisDevice ? (
                      <span className="tag dk" style={{ marginLeft: 8 }}>
                        this device
                      </span>
                    ) : null}
                  </span>
                  <span role="cell" className="ad-sr2-place" style={{ color: "var(--ink-2)" }}>
                    {session.place}
                  </span>
                  <span role="cell">
                    {session.when === "Now" ? (
                      <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ink)" }}>
                        <span className="ad-dot" aria-hidden="true" />
                        Now
                      </span>
                    ) : (
                      <span style={{ color: "var(--ink-3)" }}>{session.when}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button type="button" className="btn" onClick={() => setSessions((previous) => previous.slice(0, 1))}>
              Sign out other devices
            </button>
            <button type="button" className="btn gh">
              Sign out
            </button>
          </div>
        </Section>
      </form>
    </div>
  );
}

