import { createWorkspaceAction } from "./actions";

/** Workspace-name step shown by the app layout when a signed-in user has no team yet. */
export function OnboardingGate({ error }: { error?: boolean }) {
  return (
    <div className="ws-page" style={{ maxWidth: 560, margin: "48px auto", padding: "0 20px" }}>
      <section className="sheet lift" style={{ padding: "32px 36px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, margin: "0 0 8px" }}>
          Name your workspace
        </h1>
        <p style={{ color: "var(--ink-2)", lineHeight: 1.55 }}>
          Your account is ready — it just needs a workspace. Everything you create lives inside it,
          and only people you invite can see it.
        </p>
        {error ? (
          <p role="alert" className="field-error">
            Enter a workspace name (2–60 characters), or try a small change if that address is taken.
          </p>
        ) : null}
        <form action={createWorkspaceAction} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label htmlFor="ws-name" style={{ fontWeight: 600, fontSize: 14 }}>
            Workspace name
          </label>
          <input id="ws-name" name="name" className="inp" placeholder="e.g. Sevyn Labs" required minLength={2} maxLength={60} />
          <button type="submit" className="btn dk" style={{ alignSelf: "flex-start", padding: "0 18px", height: 36 }}>
            Create workspace
          </button>
        </form>
      </section>
    </div>
  );
}

export function BlockedGate() {
  return (
    <div className="ws-page" style={{ maxWidth: 560, margin: "48px auto", padding: "0 20px" }}>
      <section className="sheet lift" style={{ padding: "32px 36px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, margin: "0 0 8px" }}>
          Your membership is paused
        </h1>
        <p style={{ color: "var(--ink-2)", lineHeight: 1.55 }}>
          An admin deactivated your seat in this workspace, so its conversations and documents are
          not available. Ask a workspace admin to reactivate you.
        </p>
      </section>
    </div>
  );
}
