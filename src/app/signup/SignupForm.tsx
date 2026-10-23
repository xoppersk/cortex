"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "../../components/Button";
import { Field, fieldDescribedBy } from "../../components/Field";
import { IconArrowRight } from "../../components/icons";
import { signUpAction, type AuthFormState } from "../../lib/auth/actions";

const initialState: AuthFormState = {};

/*
 * S-02 Signup form, per screens/Signup.html (v2): the form itself is the
 * .sheet.lift card, "Step 1 of 2 · then name your workspace" → step 2 names
 * the workspace. Production wiring (Supabase Auth):
 *
 *  - Step 1 collects name + email + password (the design had no password
 *    field; production truth wins, styled in the same field language).
 *  - Step 2 submits everything to `signUpAction`. Email confirmation is
 *    ON in the project, so the action returns a "check-email" state and
 *    the card becomes the design's verify step; the workspace is
 *    provisioned when the confirmation link establishes the session.
 *  - The design's personal-email block is removed: in production any
 *    email can start a workspace (owner clarification, 2026-10-22).
 *  - Google sign-up button removed — no OAuth providers are configured.
 */
export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initialState);
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [step1Submitted, setStep1Submitted] = useState(false);
  const [workspaceSubmitted, setWorkspaceSubmitted] = useState(false);

  const fe = state.fieldErrors ?? {};
  const nameError = fe.name ?? (step1Submitted && !name.trim() ? "Enter your name." : undefined);
  const emailError =
    fe.email ?? (step1Submitted && !/^\S+@\S+\.\S+$/.test(email.trim()) ? "Enter a valid email address." : undefined);
  const passwordError =
    fe.password ?? (step1Submitted && password.length < 8 ? "Use at least 8 characters." : undefined);
  const workspaceError =
    fe.workspaceName ??
    (workspaceSubmitted && workspace.trim().length < 2
      ? "Name your workspace (at least 2 characters)."
      : undefined);

  // Server-side field errors for step-1 fields send the user back to step 1.
  useEffect(() => {
    if (fe.name || fe.email || fe.password) setStep(1);
  }, [fe.name, fe.email, fe.password]);

  function onSubmitStep1(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep1Submitted(true);
    if (name.trim() && /^\S+@\S+\.\S+$/.test(email.trim()) && password.length >= 8) {
      setStep(2);
    }
  }

  if (state.status === "check-email") {
    return (
      <div className="sheet lift sys-signup-form">
        <span className="sys-progress">
          <span className="sys-progress-bars" aria-hidden="true">
            <i />
            <i />
          </span>
          Almost done · confirm your email
        </span>
        <h1 className="sys-form-title">Check your email</h1>
        <p className="ui-text" style={{ fontSize: 14, lineHeight: 1.55 }}>
          We sent a confirmation link to <b>{state.email ?? email}</b>. Open it to finish setting
          up <b>{workspace || "your workspace"}</b> — your workspace is created the moment you
          confirm, and you&rsquo;ll land straight in it.
        </p>
        <p className="sys-legal-note">
          Already confirmed? <Link href="/login">Sign in</Link>. No email after a few minutes?
          Check spam, or sign up again to resend.
        </p>
      </div>
    );
  }

  if (step === 2) {
    return (
      <form action={formAction} className="sheet lift sys-signup-form">
        <span className="sys-progress">
          <span className="sys-progress-bars" aria-hidden="true">
            <i />
            <i />
          </span>
          Step 2 of 2 · name your workspace
        </span>
        <h1 className="sys-form-title">Name your workspace</h1>
        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="password" value={password} />
        {state.error ? (
          <p className="sys-set-error" role="alert">
            {state.error}
          </p>
        ) : null}
        <Field label="Workspace name" htmlFor="signup-workspace" error={workspaceError}>
          <input
            id="signup-workspace"
            name="workspaceName"
            type="text"
            autoComplete="organization"
            required
            className={workspaceError ? "inp lg sys-inp-error" : "inp lg"}
            value={workspace}
            onChange={(event) => setWorkspace(event.target.value)}
            aria-invalid={workspaceError ? true : undefined}
            aria-describedby={fieldDescribedBy("signup-workspace", { error: workspaceError })}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="sys-btn-block sys-signup-submit"
          disabled={pending}
          onClick={() => setWorkspaceSubmitted(true)}
        >
          {pending ? "Creating your account…" : "Create workspace"}
        </Button>
        <p className="sys-legal-note">
          Signing up as {email}.{" "}
          <button
            type="button"
            className="sys-inline-link"
            onClick={() => setStep(1)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              font: "inherit",
              color: "var(--ink)",
              textDecoration: "underline",
              cursor: "pointer",
            }}
          >
            Edit your details
          </button>
        </p>
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
        Step 1 of 2 · then name your workspace
      </span>
      <h1 className="sys-form-title">Start a 14-day trial</h1>
      {state.error ? (
        <p className="sys-set-error" role="alert">
          {state.error}{" "}
          {state.error.includes("already exists") ? <Link href="/login">Sign in</Link> : null}
        </p>
      ) : null}
      <Field label="Your name" htmlFor="signup-name" error={nameError}>
        <input
          id="signup-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className={nameError ? "inp lg sys-inp-error" : "inp lg"}
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={fieldDescribedBy("signup-name", { error: nameError })}
        />
      </Field>
      <Field label="Work email" htmlFor="signup-email" error={emailError}>
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
          aria-describedby={fieldDescribedBy("signup-email", { error: emailError })}
        />
      </Field>
      <Field label="Password" htmlFor="signup-password" error={passwordError} helper="At least 8 characters.">
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className={passwordError ? "inp lg sys-inp-error" : "inp lg"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={fieldDescribedBy("signup-password", {
            helper: "At least 8 characters.",
            error: passwordError,
          })}
        />
      </Field>
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

