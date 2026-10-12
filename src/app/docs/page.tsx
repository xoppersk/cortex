import { redirect } from "next/navigation";

/* P-04: the designs ship one docs article; /docs lands on it. */
export default function DocsIndexPage() {
  redirect("/docs/citations");
}
