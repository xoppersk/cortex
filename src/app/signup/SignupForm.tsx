"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";

/*
 * S-02 Signup form, per screens/Signup.html. The design screen IS the
 * personal-email error state (prefilled name/email, danger border, the
 * error sentence shown once in --danger as the field's described-by
 * text), so the form loads in that state and re-validates on change.
 * A valid step 1 continues to step 2 — naming the workspace, as the
 * eyebrow promises ("Step 1 of 2 · then name your workspace"). The
 * design ships no step-2 UI; step 2 below follows the same field/button
 * pattern in the brief's words. Google sign-up is an auth action button
 * (type="button" in the design), not a link into the app.
 */
const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

const labelStyle = { fontSize: 13, color: "var(--ink)" } as const;
const fieldWrap = { display: "flex", flexDirection: "column", gap: 6 } as const;

export function SignupForm({
  signupError,
  initialErrorState = true,
  errorName = "",
  errorEmail = "",
}: {
  signupError: string;
  initialErrorState?: boolean;
  errorName?: string;
  errorEmail?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(initialErrorState ? errorName : "");
  const [email, setEmail] = useState(initialErrorState ? errorEmail : "");
  const [workspace, setWorkspace] = useState("");
  const [submitted, setSubmitted] = useState(initialErrorState);
  const [workspaceSubmitted, setWorkspaceSubmitted] = useState(false);

  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const emailError = submitted && PERSONAL_DOMAINS.includes(domain) ? signupError : undefined;
  const workspaceError =
    workspaceSubmitted && workspace.trim().length === 0 ? "Name your workspace to continue." : undefined;

  function onSubmitStep1(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
    if (!PERSONAL_DOMAINS.includes(domain) && name.trim() && email.trim()) {
      setStep(2);
    }
  }

  function onSubmitStep2(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWorkspaceSubmitted(true);
    if (workspace.trim()) {
      router.push("/app/new");
    }
  }

  if (step === 2) {
    return (
      <form
        onSubmit={onSubmitStep2}
        noValidate
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Step 2 of 2 · name your workspace</span>
        <h1
          style={{
            margin: "0 0 4px",
            fontFamily: "var(--font-serif)",
            fontSize: 36,
            lineHeight: 1.1,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          Name your workspace
        </h1>
        <div style={fieldWrap}>
          <label htmlFor="signup-workspace" style={labelStyle}>
            Workspace name
          </label>
          <input
            id="signup-workspace"
            name="workspace"
            type="text"
            autoComplete="organization"
            required
            className="field-control field-control-44"
            style={workspaceError ? { borderColor: "var(--danger)" } : undefined}
            value={workspace}
            onChange={(event) => setWorkspace(event.target.value)}
            aria-invalid={workspaceError ? true : undefined}
            aria-describedby={workspaceError ? "signup-workspace-error" : undefined}
          />
          {workspaceError ? (
            <span
              id="signup-workspace-error"
              role="alert"
              style={{ fontSize: 13, lineHeight: 1.45, color: "var(--danger)" }}
            >
              {workspaceError}
            </span>
          ) : null}
        </div>
        <Button type="submit" variant="primary" size="lg" className="btn-block">
          Create workspace
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={onSubmitStep1}
      noValidate
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <span style={{ fontSize: 13, color: "var(--ink-3)" }}>Step 1 of 2 · then name your workspace</span>
      <h1
        style={{
          margin: "0 0 4px",
          fontFamily: "var(--font-serif)",
          fontSize: 36,
          lineHeight: 1.1,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        Start a 14-day trial
      </h1>
      <Button type="button" variant="secondary" size="lg" className="btn-block">
        Sign up with Google
      </Button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontSize: 13,
          color: "var(--ink-4)",
        }}
      >
        <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
        or
        <span style={{ flex: 1, height: 1, background: "var(--rule)" }} />
      </div>
      <div style={fieldWrap}>
        <label htmlFor="signup-name" style={labelStyle}>
          Your name
        </label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="field-control field-control-44"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div style={fieldWrap}>
        <label htmlFor="signup-email" style={labelStyle}>
          Work email
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field-control field-control-44"
          style={emailError ? { borderColor: "var(--danger)" } : undefined}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "signup-email-error" : undefined}
        />
        {emailError ? (
          <span
            id="signup-email-error"
            role="alert"
            style={{ fontSize: 13, lineHeight: 1.45, color: "var(--danger)" }}
          >
            {emailError}
          </span>
        ) : null}
      </div>
      <Button type="submit" variant="primary" size="lg" className="btn-block">
        Continue
      </Button>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: "var(--ink-3)" }}>
        By continuing you agree to the{" "}
        <a href="#" style={{ color: "var(--ink)" }}>
          terms
        </a>{" "}
        and{" "}
        <a href="#" style={{ color: "var(--ink)" }}>
          privacy policy
        </a>
        . Your documents are never used for training.
      </p>
    </form>
  );
}
