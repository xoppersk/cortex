import Link from "next/link";
import { ButtonLink } from "../components/Button";
import { SiteFooter, SiteHeader } from "../components/SiteHeader";

export default function NotFound() {
  return (
    <div>
      <SiteHeader />
      <main className="site-wrap" style={{ paddingTop: 96, paddingBottom: 120 }}>
        <div className="stack-5" style={{ maxWidth: 640 }}>
          <p className="caption">404 · Reference CTX-404-06</p>
          <h1 className="display-l" style={{ fontSize: 52 }}>
            We can’t cite this page. It isn’t in the catalog.
          </h1>
          <p className="serif-lead">
            The page may have moved, or the link may point to a document your workspace has not added.
          </p>
          <div className="stack-3">
            <p className="section-label">Try instead</p>
            <p>
              <Link href="/app/new">Start a new conversation</Link>
            </p>
            <p>
              <Link href="/docs/citations">Read how citations work</Link>
            </p>
            <p>
              <Link href="/">Go to the Cortex home page</Link>
            </p>
          </div>
          <div>
            <ButtonLink href="/" variant="primary" size="lg">
              Go home
            </ButtonLink>
          </div>
          <p className="caption">Reference code: CTX-404-06</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
