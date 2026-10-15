"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "../../components/Button";
import { Icon } from "../../components/Icon";

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

function Steps({ step }: { step: 1 | 2 }) {
  return (
    <span className="pm-steps" aria-hidden="true">
      <i className="pm-step-on" />
      <i className={step === 2 ? "pm-step-on" : undefined} />
    </span>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <span id={id} role="alert" className="pm-err">
      <Icon name="warning" />
      <span>{children}</span>
    </span>
  );
}

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
      <form onSubmit={onSubmitStep2} noValidate className="pm-signup">
        <span className="pm-step-label">
          <Steps step={2} />
          Step 2 of 2 · name your workspace
        </span>
        <h1>Name your workspace</h1>
        <div className="pm-field">
          <label htmlFor="signup-workspace">Workspace name</label>
          <input
            id="signup-workspace"
            name="workspace"
            type="text"
            autoComplete="organization"
            required
            className={workspaceError ? "pv-inp pm-inp-lg pm-inp-err" : "pv-inp pm-inp-lg"}
            value={workspace}
            onChange={(event) => setWorkspace(event.target.value)}
            aria-invalid={workspaceError ? true : undefined}
            aria-describedby={workspaceError ? "signup-workspace-error" : undefined}
          />
          {workspaceError ? <FieldError id="signup-workspace-error">{workspaceError}</FieldError> : null}
        </div>
        <Button type="submit" variant="primary" className="pm-btn-xl pm-btn-full" style={{ marginTop: 4 }}>
          Create workspace
          <Icon name="arrowRight" size={15} style={{ color: "currentColor" }} />
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onSubmitStep1} noValidate className="pm-signup">
      <span className="pm-step-label">
        <Steps step={1} />
        Step 1 of 2 · then name your workspace
      </span>
      <h1>Start a 14-day trial</h1>
      <Button type="button" variant="secondary" className="pm-btn-xl pm-btn-full">
        Sign up with Google
      </Button>
      <div className="pm-or" style={{ margin: "4px 0" }}>
        or
      </div>
      <div className="pm-field">
        <label htmlFor="signup-name">Your name</label>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="pv-inp pm-inp-lg"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </div>
      <div className="pm-field">
        <label htmlFor="signup-email">Work email</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={emailError ? "pv-inp pm-inp-lg pm-inp-err" : "pv-inp pm-inp-lg"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "signup-email-error" : undefined}
        />
        {emailError ? <FieldError id="signup-email-error">{emailError}</FieldError> : null}
      </div>
      <Button type="submit" variant="primary" className="pm-btn-xl pm-btn-full" style={{ marginTop: 4 }}>
        Continue
        <Icon name="arrowRight" size={15} style={{ color: "currentColor" }} />
      </Button>
      <p className="pm-small" style={{ fontSize: 12 }}>
        By continuing you agree to the <a href="#" style={{ fontWeight: 400 }}>terms</a> and{" "}
        <a href="#" style={{ fontWeight: 400 }}>
          privacy policy
        </a>
        . Your documents are never used for training.
      </p>
    </form>
  );
}
