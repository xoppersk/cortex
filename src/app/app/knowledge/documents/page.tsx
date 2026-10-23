import type { Metadata } from "next";
import { Suspense } from "react";
import { getKnowledge } from "../../../../lib/api";
import { DocumentsClient } from "./DocumentsClient";

export const metadata: Metadata = { title: { absolute: "Cortex — Documents" } };

export default async function DocumentsPage() {
  const knowledge = await getKnowledge();
  return (
    <Suspense fallback={null}>
      <DocumentsClient knowledge={knowledge} />
    </Suspense>
  );
}
