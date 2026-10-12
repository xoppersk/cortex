import type { Metadata } from "next";
import { getKnowledge } from "../../../../lib/api";
import { AskForm } from "./AskForm";

export const metadata: Metadata = { title: { absolute: "Cortex — Ask a knowledge base" } };

export default function AskPage() {
  const knowledge = getKnowledge();
  const { ask } = knowledge;
  const collection = knowledge.collections.find((entry) => entry.id === ask.collectionId);

  return (
    <AskForm
      ask={ask}
      collectionName={collection?.name ?? ask.collectionId}
      inspectorDocumentId={knowledge.inspector.documentId}
    />
  );
}
