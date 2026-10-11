import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <header className="site-header">
        <div className="site-wrap site-header-inner">
          <Link href="/" className="wordmark">
            Cortex
          </Link>
        </div>
      </header>
      <main className="site-wrap" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div className="stack-5" style={{ maxWidth: 640 }}>
          <p className="caption">404 · nothing at this address</p>
          <h1 className="display-l" style={{ fontSize: 52 }}>
            We can&rsquo;t cite this page. It isn&rsquo;t in the catalog.
          </h1>
          <p className="serif-lead">
            The link may be old, or the conversation may have been deleted or never shared with
            you. If someone sent it, ask them to share it with your account.
          </p>
          <p className="code muted-3">cortex.app/sevyn-labs/c/launch-narrative-v1</p>
          <div className="stack-3">
            <p className="section-label">Did you mean</p>
            <p>
              <Link href="/app/c/launch-narrative">Launch narrative</Link>{" "}
              <span className="muted-3">conversation</span>
            </p>
            <p>
              <Link href="/app/history">All conversations</Link>{" "}
              <span className="muted-3">24</span>
            </p>
            <p>
              <Link href="/docs/citations">Docs</Link> <span className="muted-3">help</span>
            </p>
          </div>
          <p className="ui-text muted-3">
            Something broke instead? Tell us and include reference{" "}
            <span className="code">7Q2-41K</span>.
          </p>
          <p className="caption">© 2026 [Company] · Privacy · Terms · Security · Status · Help</p>
        </div>
      </main>
    </div>
  );
}
