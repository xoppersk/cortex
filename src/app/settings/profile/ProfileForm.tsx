"use client";

import { useEffect, useState } from "react";
import { Button } from "../../../components/Button";
import { SettingsSection } from "../../../components/SettingsSection";
import type { AdminData } from "../../../lib/types";

type Profile = AdminData["profile"];
type NotificationKey = keyof Profile["notifications"];

const NOTIFICATION_LABELS: Record<NotificationKey, string> = {
  evaluationFailures: "Evaluation failures",
  inviteAccepted: "Invite accepted",
  mentions: "Mentions",
  weeklyUsage: "Weekly usage summary",
};

const APPEARANCE_OPTIONS = ["Light", "Dark", "Match system"] as const;
type Appearance = (typeof APPEARANCE_OPTIONS)[number];

const TEXT_SIZE_OPTIONS = ["Standard", "Large"] as const;
type TextSize = (typeof TEXT_SIZE_OPTIONS)[number];

const PLACEMENT_OPTIONS = ["Margin", "Below the answer"] as const;
type Placement = (typeof PLACEMENT_OPTIONS)[number];

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

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [name, setName] = useState(profile.name);
  const [jobTitle, setJobTitle] = useState(profile.jobTitle);
  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    ...profile.notifications,
  });
  const [appearance, setAppearance] = useState<Appearance>(
    APPEARANCE_OPTIONS.includes(profile.appearance as Appearance)
      ? (profile.appearance as Appearance)
      : "Light",
  );
  const [textSize, setTextSize] = useState<TextSize>(
    profile.textSize === "Large" ? "Large" : "Standard",
  );
  const [placement, setPlacement] = useState<Placement>(
    profile.sourcePlacement === "Below the answer" ? "Below the answer" : "Margin",
  );
  const [sessions, setSessions] = useState(profile.sessions);

  // Restore a previously saved appearance choice on this device.
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

  const previewNote = (
    <p className="caption">
      1 · Customer interviews, round 2 · Catalog 02 · Oct 2 · passage 118
    </p>
  );

  return (
    <div>
      <header className="page-head">
        <h1 className="page-title">Profile</h1>
        <p className="summary-sentence">
          These settings are yours alone. They follow you across every workspace you belong to.
        </p>
      </header>

      <SettingsSection
        title="Profile"
        margin={
          <p className="caption">
            Your name and job title appear next to your questions, comments and playbook runs.
          </p>
        }
      >
        <div className="stack-5">
          <div className="settings-grid">
            <label className="settings-grid-label" htmlFor="profile-name">
              Name
            </label>
            <input
              id="profile-name"
              className="field-control"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="settings-grid">
            <label className="settings-grid-label" htmlFor="profile-job-title">
              Job title
            </label>
            <input
              id="profile-job-title"
              className="field-control"
              value={jobTitle}
              onChange={(event) => setJobTitle(event.target.value)}
              autoComplete="organization-title"
            />
          </div>
          <div className="settings-grid">
            <span className="settings-grid-label">Email</span>
            <div className="stack-2">
              <p className="ui-text">{email}</p>
              <p className="caption">This is the address you sign in with.</p>
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Notifications"
        margin={
          <p className="caption">
            Notifications are sent to {email}. Nothing is sent for conversations you have muted.
          </p>
        }
      >
        <div className="stack-3">
          {(Object.keys(NOTIFICATION_LABELS) as NotificationKey[]).map((key) => (
            <label key={key} className="check-row">
              <input
                type="checkbox"
                checked={notifications[key]}
                onChange={(event) =>
                  setNotifications((current) => ({ ...current, [key]: event.target.checked }))
                }
              />
              <span>{NOTIFICATION_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Reading"
        margin={
          <p className="caption">
            Reading settings change only how answers look to you. Everyone else keeps their own
            settings.
          </p>
        }
      >
        <div className="stack-5">
          <div className="settings-grid">
            <span className="settings-grid-label">Appearance</span>
            <Segmented
              label="Appearance"
              options={APPEARANCE_OPTIONS}
              value={appearance}
              onChange={chooseAppearance}
            />
          </div>
          <div className="settings-grid">
            <span className="settings-grid-label">Text size</span>
            <Segmented
              label="Text size"
              options={TEXT_SIZE_OPTIONS}
              value={textSize}
              onChange={setTextSize}
            />
          </div>
          <div className="settings-grid">
            <span className="settings-grid-label">Source placement</span>
            <Segmented
              label="Source placement"
              options={PLACEMENT_OPTIONS}
              value={placement}
              onChange={setPlacement}
            />
          </div>
          <div className="fragment stack-3" aria-label="Reading preview">
            <p className="caption">Preview</p>
            {placement === "Margin" ? (
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <p
                  className="answer-text"
                  style={{ flex: "1 1 260px", fontSize: textSize === "Large" ? 20 : 18 }}
                >
                  Seven of nine teams said an answer is only forwardable if the reviewer can open the
                  document behind it.<sup className="footnote">1</sup>
                </p>
                <div style={{ flex: "1 1 180px" }}>{previewNote}</div>
              </div>
            ) : (
              <div className="stack-3">
                <p className="answer-text" style={{ fontSize: textSize === "Large" ? 20 : 18 }}>
                  Seven of nine teams said an answer is only forwardable if the reviewer can open the
                  document behind it.<sup className="footnote">1</sup>
                </p>
                {previewNote}
              </div>
            )}
          </div>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Sessions"
        margin={
          <p className="caption">
            Revoking a session signs that device out. It will need to sign in again before it can ask
            questions.
          </p>
        }
      >
        <div>
          {sessions.map((session, index) => {
            const isCurrent = session.detail.includes("Current session");
            return (
              <div
                key={session.name}
                className="row-between hairline-top"
                style={{ padding: "12px 0", borderTop: index === 0 ? 0 : undefined }}
              >
                <div className="stack-2">
                  <p className="ui-strong" style={{ fontSize: 13 }}>
                    {session.name}
                  </p>
                  <p className="caption">{session.detail}</p>
                </div>
                {isCurrent ? (
                  <span className="caption">Current session</span>
                ) : (
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() =>
                      setSessions((current) => current.filter((item) => item.name !== session.name))
                    }
                  >
                    Revoke
                  </Button>
                )}
              </div>
            );
          })}
          {sessions.length === 0 ? <p className="ui-text">No active sessions.</p> : null}
        </div>
      </SettingsSection>
    </div>
  );
}
