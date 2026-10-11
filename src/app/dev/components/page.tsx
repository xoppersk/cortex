import { Button, ButtonLink } from "../../../components/Button";
import { Composer } from "../../../components/Composer";
import { CopyButton } from "../../../components/CopyButton";
import { Field } from "../../../components/Field";
import { MarginNote, RichSegments } from "../../../components/Footnote";
import { LedgerRow } from "../../../components/LedgerRow";
import { Meter } from "../../../components/Meter";
import { NavItem } from "../../../components/NavItem";
import { Notice } from "../../../components/Notice";
import { PassageTrace } from "../../../components/PassageTrace";
import { SettingsSection } from "../../../components/SettingsSection";
import { SiteFooter, SiteHeader } from "../../../components/SiteHeader";
import { getKnowledge, getThread } from "../../../lib/api";

export default function ComponentsPage() {
  const thread = getThread();
  const knowledge = getKnowledge();
  const firstNote = thread.notes[0]!;

  return (
    <main style={{ padding: "40px 16px", maxWidth: 1160, margin: "0 auto" }} className="stack-7">
      <div className="stack-3">
        <p className="caption">Development only</p>
        <h1 className="page-title">Cortex components</h1>
        <p className="summary-sentence">
          Every component from the design system, in its documented states, built only from the tokens.
        </p>
      </div>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">Button</h2>
        <div className="row">
          <Button variant="primary" size="sm">Primary 30</Button>
          <Button variant="secondary" size="md">Secondary 36</Button>
          <Button variant="quiet" size="sm">Quiet</Button>
          <Button variant="destructive" size="md">Destructive</Button>
          <ButtonLink href="/dev/components" variant="primary" size="lg">Primary 44</ButtonLink>
          <Button variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">Footnote + MarginNote</h2>
        <div className="doc-margin">
          <div className="doc-column">
            <p className="answer-text">
              <RichSegments
                segments={[
                  { text: "Seven of nine teams said an answer is only forwardable if the reviewer can open the document behind it" },
                  { text: "", footnote: 1 },
                  { text: ". A broken source is struck through" },
                  { text: "", footnote: 2 },
                  { text: "." },
                ]}
              />
            </p>
          </div>
          <div className="margin-column">
            <MarginNote note={firstNote} />
            <MarginNote
              note={{
                id: "note-2",
                n: 2,
                paragraphId: "dev",
                documentTitle: "Removed source",
                catalog: "Catalog 02",
                meta: "Catalog 02 · Sep 12 · passage 4",
                excerpt: [{ text: "This source was removed from the catalog." }],
                broken: true,
              }}
            />
          </div>
        </div>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">PassageTrace</h2>
        <PassageTrace rows={knowledge.ask.trace.slice(0, 5)} />
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">LedgerRow</h2>
        <div className="ledger">
          <LedgerRow
            featured
            title="Launch brief"
            description="Write a launch brief for Cortex aimed at legal and security reviewers."
            value="$0.030 avg"
            meta="41 runs · 39 passed checks"
          />
          <LedgerRow title="Research synthesis" description="A one-line serif description." value="$0.026 avg" meta="34 runs" />
        </div>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">Notice</h2>
        <Notice headline="The catalog can’t be reached." actions={<Button variant="primary">Try again</Button>}>
          <p>Answers in this conversation are not verified until the catalog returns.</p>
        </Notice>
        <Notice variant="warning" headline="Card expiring" lead="Warning">
          <p>The card on file expires this month.</p>
        </Notice>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">Field</h2>
        <div className="stack-5" style={{ maxWidth: 420 }}>
          <Field label="Workspace name" htmlFor="dev-name" helper="Shown in the sidebar and on shared answers.">
            <input id="dev-name" className="field-control" defaultValue="Sevyn Labs" />
          </Field>
          <Field label="Support email" htmlFor="dev-email" error="Enter an email address at sevynlabs.io.">
            <input id="dev-email" className="field-control" defaultValue="support@" aria-invalid="true" aria-describedby="dev-email-error" />
          </Field>
          <Field label="Monthly limit" htmlFor="dev-limit" changedFrom="$200">
            <input id="dev-limit" className="field-control is-changed" defaultValue="$250" />
          </Field>
        </div>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">Meter</h2>
        <Meter
          sentence={<><strong>$184</strong> of the $200 limit is spent with three days left.</>}
          value={184}
          max={200}
          caption="At this pace the workspace reaches the limit around October 8."
          label="$184 of $200 spent"
        />
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">NavItem</h2>
        <div style={{ maxWidth: 240, background: "var(--rail)", padding: 12 }}>
          <NavItem href="/dev/components" active count={24}>History</NavItem>
          <NavItem href="/app/playbooks" count={7}>Playbooks</NavItem>
        </div>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">Composer</h2>
        <Composer costSentence="About $0.012–$0.020 for a reply like this." />
        <CopyButton text="ctx_live_example" label="Copy key" />
      </section>

      <section style={{ marginTop: 48 }}>
        <SettingsSection title="SettingsSection" margin={<p className="caption">The margin holds the consequence of the setting, written as a sentence.</p>}>
          <div className="settings-grid">
            <span className="settings-grid-label">Monthly limit</span>
            <input className="field-control" defaultValue="$200" aria-label="Monthly limit" />
          </div>
        </SettingsSection>
      </section>

      <section className="stack-4" style={{ marginTop: 48 }}>
        <h2 className="section-label">SiteHeader / SiteFooter</h2>
        <div style={{ border: "1px solid var(--rule)" }}>
          <SiteHeader current="/" />
          <SiteFooter />
        </div>
      </section>
    </main>
  );
}
