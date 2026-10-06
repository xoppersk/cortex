import { describe, expect, it } from "vitest";

import { splitSections, chunkMarkdown } from "./chunking";

describe("chunking", () => {
  it("splits markdown on H2 headings", () => {
    const md = "# Title\n\n## Section A\nContent A\n\n## Section B\nContent B";
    const sections = splitSections(md);
    expect(sections.length).toBe(2);
    expect(sections[0]!.heading).toBe("Section A");
    expect(sections[1]!.heading).toBe("Section B");
  });

  it("chunks markdown", () => {
    const md = `## Long\n${"word ".repeat(100)}`;
    const chunks = chunkMarkdown(md, { targetTokens: 800, overlapTokens: 120 });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0]!.content.length).toBeGreaterThan(0);
  });

  it("keeps short docs as single chunk", () => {
    const md = "## Short\nJust a little content.";
    const chunks = chunkMarkdown(md, { targetTokens: 800, overlapTokens: 120 });
    expect(chunks.length).toBe(1);
  });
});
