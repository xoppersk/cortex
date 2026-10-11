"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "../../../components/Button";
import { Field } from "../../../components/Field";
import type { AdminData } from "../../../lib/types";

type Profile = AdminData["profile"];

const APPEARANCE_OPTIONS = ["Light", "Dark", "Match system"] as const;
type Appearance = (typeof APPEARANCE_OPTIONS)[number];

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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="stack-4 hairline-top" style={{ paddingTop: "var(--space-6)" }}>
      <h2 className="section-label" style={{ fontSize: 15 }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [name, setName] = useState(profile.name);
  const [teamLabel, setTeamLabel] = useState(profile.teamLabel);
  const [notifications, setNotifications] = useState(profile.notifications.map((n) => n.checked));
  const [appearance, setAppearance] = useState<Appearance>(
    APPEARANCE_OPTIONS.includes(profile.reading.appearance as Appearance)
      ? (profile.reading.appearance as Appearance)
      : "Light",
  );
  const [textSize, setTextSize] = useState(profile.reading.textSize);
  const [placement, setPlacement] = useState(profile.reading.sourcePlacement);
  const [sessions, setSessions] = useState(profile.sessions);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("cortex-theme");
      if (stored === "dark") setAppearance("Dark");
      else if (stored === "light") setAppearance("Light");
      else if (stored === "system") setAppearance("Match system");
    } catch {
      // Keep the fixture default when storage is unavailable.
    }
  }, []);

  function chooseAppearance(next: Appearance) {
    setAppearance(next);
    applyAppearance(next);
  }

  return (
    <div className="stack-6" style={{ maxWidth: "var(--column-doc)" }}>
      <header className="page-head">
        <h1 className="page-title">Profile and preferences</h1>
        {status ? (
          <p className="caption" role="status">
            {status}
          </p>
        ) : null}
      </header>

      <Section title="Profile">
        <Field label="Name" htmlFor="profile-name">
          <input
            id="profile-name"
            className="field-control"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <div className="row" style={{ alignItems: "center" }}>
            <input id="profile-email" className="field-control" value={email} readOnly />
            <Button variant="quiet" size="sm">
              Change
            </Button>
          </div>
        </Field>
        <Field label="Team label" htmlFor="profile-team" helper={profile.profileNote}>
          <input
            id="profile-team"
            className="field-control"
            value={teamLabel}
            onChange={(event) => setTeamLabel(event.target.value)}
          />
        </Field>
      </Section>

      <Section title="Email me when">
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
              <span>{notification.label}</span>
            </label>
          ))}
        </div>
        <p className="caption">{profile.notificationsNote}</p>
      </Section>

      <Section title="Reading">
        <div className="stack-2">
          <span className="field-label" id="appearance-label">
            Appearance
          </span>
          <div className="segmented" role="group" aria-labelledby="appearance-label">
            {APPEARANCE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={appearance === option}
                onClick={() => chooseAppearance(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <Field label="Answer text size" htmlFor="profile-text-size">
          <select
            id="profile-text-size"
            className="field-control"
            value={textSize}
            onChange={(event) => setTextSize(event.target.value)}
          >
            {profile.reading.textSizeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <Field label="Show sources" htmlFor="profile-sources">
          <select
            id="profile-sources"
            className="field-control"
            value={placement}
            onChange={(event) => setPlacement(event.target.value)}
          >
            {profile.reading.sourcePlacementOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </Field>
        <p className="caption">
          Preview: every claim stays attached to its source <sup>1</sup>.
        </p>
        <p className="caption">Sources move below each answer automatically on narrow screens.</p>
      </Section>

      <Section title="Signed in">
        <div className="ledger">
          {sessions.map((session) => (
            <div key={session.name} className="ledger-row" style={{ gridTemplateColumns: "1fr auto" }}>
              <div>
                <p className="ui-strong" style={{ fontSize: 13 }}>
                  {session.name}
                </p>
                <p className="caption">{session.place}</p>
              </div>
              <span className="caption">{session.when}</span>
            </div>
          ))}
        </div>
        <div className="row">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setSessions((previous) => previous.slice(0, 1));
              setStatus("Signed out of other devices.");
            }}
          >
            Sign out other devices
          </Button>
          <Button variant="quiet" size="md">
            Sign out
          </Button>
        </div>
        <p className="caption">{profile.twoStepNote}</p>
      </Section>
    </div>
  );
}
