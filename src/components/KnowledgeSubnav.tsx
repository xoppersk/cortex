import Link from "next/link";

const items = [
  { href: "/app/knowledge", label: "Knowledge bases" },
  { href: "/app/knowledge/documents", label: "Documents" },
  { href: "/app/knowledge/ask", label: "Ask" },
];

/** Tabs across the top of the workspace panel on every Knowledge screen. */
export function KnowledgeSubnav({ current }: { current: string }) {
  return (
    <nav className="pv-subnav" aria-label="Knowledge">
      {items.map((item) => (
        <Link key={item.href} href={item.href} aria-current={current === item.href ? "page" : undefined}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
