import { Suspense } from "react";
import { DocumentsClient } from "./DocumentsClient";

export default function DocumentsPage() {
  return (
    <Suspense fallback={<p className="caption">Loading documents…</p>}>
      <DocumentsClient />
    </Suspense>
  );
}
