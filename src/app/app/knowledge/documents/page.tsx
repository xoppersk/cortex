import type { Metadata } from "next";
import { Suspense } from "react";
import { DocumentsClient } from "./DocumentsClient";

export const metadata: Metadata = { title: { absolute: "Cortex — Documents" } };

export default function DocumentsPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsClient />
    </Suspense>
  );
}
