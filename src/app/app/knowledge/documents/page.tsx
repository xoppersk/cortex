import type { Metadata } from "next";
import { DocumentsClient } from "./DocumentsClient";

export const metadata: Metadata = { title: { absolute: "Cortex — Documents" } };

export default function DocumentsPage() {
  return <DocumentsClient />;
}
