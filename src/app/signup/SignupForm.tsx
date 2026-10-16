"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { IconArrowRight } from "../../components/icons";

/*
 * S-02 Signup form, per screens/Signup.html (v2): the form itself is the
 * .sheet.lift card. The design screen IS the personal-email error state
 * (prefilled name/email, danger border + #F6E4E0 ring, the error sentence
 * in --danger with a warning-triangle icon as the field's described-by
 * text), so the form loads in that state and re-validates on change once
 * submitted. A valid step 1 continues to step 2 — naming the workspace,
 * as the step label promises ("Step 1 of 2 · then name your workspace").
 * The design ships no step-2 UI; step 2 below follows the same card,
 * field and button pattern in the brief's words. Google sign-up is an
 * auth action button (type="button" in the design), not a link into
 * the app.
 */
const PERSONAL_DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com"];

export function SignupForm({
  signupError,
  initialErrorState = true,
  errorName = "",
  errorEmail = "",
  stepLabel = "Step 1 of 2 · then name your workspace",
}: {
  signupError: string;
  initialErrorState?: boolean;
  errorName?: string;
  errorEmail?: string;
  stepLabel?: string;
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
      <form onSubmit={onSubmitStep2} noValidate className="sheet lift sys-signup-form">
        <span className="sys-progress">
          <span className="sys-progress-bars" aria-hidden="true">
            <i />
            <i />
          </span>
          Step 2 of 2 · name your workspace
        </span>
        <h1 className="sys-form-title">Name your workspace</h1>
        <div className="field">
          <label htmlFor="signup-workspace">Workspace name</label>
          <input
            id="signup-workspace"
            name="workspace"
            type="text"
            autoComplete="organization"
            required
            className="inp lg"
            value={workspace}
            onChange={(event) => setWorkspace(event.target.value)}
            aria-invalid={workspaceError ? true : undefined}
            aria-describedby={workspaceError ? "signup-workspace-error" : undefined}
          />
          {workspaceError ? (
            <span id="signup-workspace-error" role="alert" className="sys-set-error">
              {workspaceError}
            </span>
          ) : null}
        </div>
        <Button type="submit" variant="primary" size="lg" className="sys-btn-block sys-signup-submit">
          Create workspace
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitStep1} noValidate className="sheet lift sys-signup-form">
      <span className="sys-progress">
        <span className="sys-progress-bars" aria-hidden="true">
          <i />
          <i className="off" />
        </span>
        {stepLabel}
      </span>
      <h1 className="sys-form-title">Start a 14-day trial</h1>
      <Button type="button" variant="secondary" size="lg" className="sys-btn-block">
        Sign up with Google
      </Button>
      <div className="or sys-signup-or">or</div>
      <div className="field">
        <label htmlFor="signup-name">Your name</label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="inp lg"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="signup-email">Work email</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={emailError ? "inp lg sys-inp-error" : "inp lg"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "signup-email-error" : undefined}
        />
        {emailError ? (
          <span id="signup-email-error" role="alert" className="sys-signup-error">
            <svg
              className="ic"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 2.5 14 13H2z" />
              <path d="M8 6.5v3M8 11.2v.3" />
            </svg>
            <span>{emailError}</span>
          </span>
        ) : null}
      </div>
      <Button type="submit" variant="primary" size="lg" className="sys-btn-block sys-signup-submit">
        Continue <IconArrowRight style={{ width: 15, height: 15, color: "var(--on-ink)" }} />
      </Button>
      <p className="sys-legal-note">
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
