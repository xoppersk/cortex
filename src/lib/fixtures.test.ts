import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import adminJson from "../../data/admin.json";
import conversationsJson from "../../data/conversations.json";
import evaluationsJson from "../../data/evaluations.json";
import knowledgeJson from "../../data/knowledge.json";
import membersJson from "../../data/members.json";
import playbooksJson from "../../data/playbooks.json";
import templatesJson from "../../data/templates.json";
import threadJson from "../../data/thread.json";
import usageJson from "../../data/usage.json";
import workspaceJson from "../../data/workspace.json";
import { generateReply, scoreChunks } from "./respond";
import { sum } from "./utils";

/**
 * UPDATED for production (W2): the sync fixture API is gone — production
 * code reads Supabase. This suite now guards the SEED MAPPING instead:
 * data/*.json is the input to scripts/seed-owner.mjs, so its canonical
 * numbers are asserted here (they are what the seed must reproduce in the
 * owner workspace), plus unit coverage for the deterministic reply engine
 * (src/lib/respond.ts) that replaced the fixture thread answers.
 */
describe("fixture canon (seed source)", () => {
  it("spend cross-sums to $184 three ways", () => {
    expect(sum(usageJson.byModel.map((row) => row.amount))).toBe(184);
    expect(sum(usageJson.byPerson.map((row) => row.amount))).toBe(184);
    expect(sum(usageJson.byProject.map((row) => row.amount))).toBe(184);
  });

  it("usage series deltas also total $184 (the usage_daily seed)", () => {
    const deltas = usageJson.series.map(
      (point, index) => point.value - (usageJson.series[index - 1]?.value ?? 0),
    );
    expect(sum(deltas)).toBe(184);
    expect(usageJson.projection.value).toBe(209);
  });

  it("knowledge totals are 32 documents and 1,842 passages", () => {
    expect(sum(knowledgeJson.collections.map((row) => row.documents))).toBe(32);
    expect(sum(knowledgeJson.collections.map((row) => row.passages))).toBe(1842);
    for (const collection of knowledgeJson.collections) {
      const docs = knowledgeJson.documents.filter((doc) => doc.collection === collection.name);
      expect(docs.length).toBe(collection.documents);
      expect(sum(docs.map((doc) => doc.passages ?? 0))).toBe(collection.passages);
    }
  });

  it("has 24 conversations split 9 + 7 + 4 + 4 by project", () => {
    expect(conversationsJson.conversations.length).toBe(24);
    for (const project of conversationsJson.projects) {
      const actual = conversationsJson.conversations.filter(
        (item) => item.project === project.name,
      ).length;
      expect(actual).toBe(project.count);
    }
    expect(conversationsJson.projects.map((row) => row.count)).toEqual([9, 7, 4, 4]);
  });

  it("thread turns and notes line up for the seeded launch conversation", () => {
    expect(threadJson.id).toBe(conversationsJson.conversations[0]?.id);
    const footnotes = new Set<number>();
    for (const turn of threadJson.turns) {
      for (const block of turn.answer.blocks) {
        for (const segment of block.segments ?? []) {
          if (segment.footnote) footnotes.add(segment.footnote);
        }
      }
    }
    for (const n of footnotes) {
      expect(threadJson.notes.some((note) => note.n === n)).toBe(true);
    }
  });

  it("seed people are complete: workspace owner + five members + one invite", () => {
    expect(workspaceJson.currentUser.email).toContain("@");
    expect(membersJson.members.length).toBe(5);
    expect(membersJson.pendingInvite.email).toContain("@");
    const emails = new Set(membersJson.members.map((member) => member.email));
    expect(emails.size).toBe(5);
  });

  it("playbooks + templates seed counts are stable", () => {
    const playbookCount =
      1 + playbooksJson.team.length + playbooksJson.private.length + playbooksJson.archived.length;
    expect(playbookCount).toBe(9);
    expect(templatesJson.templates.length + 1).toBe(24);
    expect(templatesJson.featured.id).toBe("vendor-security-questionnaire");
    expect(adminJson.apiKeys.rows.length).toBe(4);
    expect(sum(adminJson.audit.groups.map((group) => group.entries.length))).toBe(9);
    expect(evaluationsJson.set.questions).toBe(50);
    expect(evaluationsJson.runs[0]?.passed).toBe(47);
  });

  it("evaluation set latest strings carry no separator dot", () => {
    for (const set of evaluationsJson.otherSets) {
      expect(set.latest).toMatch(/^\d+ passed Oct \d+$/);
      expect(set.latest).not.toContain("\u00b7");
    }
  });
});

describe("respond.ts retrieval replies", () => {
  const chunks = [
    { id: "c1", document_id: "d1", content: "Evidence retention is seven years, approved by legal review.", token_count: 40 },
    { id: "c2", document_id: "d2", content: "The onboarding pilot ends on November 15.", token_count: 30 },
    { id: "c3", document_id: "d3", content: "Lunch menus and office plants.", token_count: 12 },
  ];

  it("scores the retention passage highest for a retention question", () => {
    const ranked = scoreChunks("What retention period did legal approve?", chunks);
    expect(ranked[0]?.chunk.id).toBe("c1");
    expect(ranked.every((row) => row.chunk.id !== "c3")).toBe(true);
  });

  it("generates a cited reply and a no-guess reply when nothing matches", () => {
    const names = new Map([
      ["d1", "Legal review: evidence retention"],
      ["d2", "Launch readiness memo"],
    ]);
    const hit = generateReply("What retention period did legal approve?", chunks, names);
    expect(hit.citations.length).toBeGreaterThan(0);
    expect(hit.citations[0]?.label).toBe("Legal review: evidence retention");
    expect(hit.content).toContain("seven years");

    const miss = generateReply("quantum chromodynamics lattice results", chunks, names);
    expect(miss.citations).toEqual([]);
    expect(miss.content).toContain("could not find a passage");
  });
});
