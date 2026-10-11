import { describe, expect, it } from "vitest";
import { fixtureTotals, getKnowledge } from "./api";
import { sum } from "./utils";

describe("fixture canon", () => {
  it("spend cross-sums to $184 three ways", () => {
    expect(fixtureTotals.spendByModel).toBe(184);
    expect(fixtureTotals.spendByPerson).toBe(184);
    expect(fixtureTotals.spendByProject).toBe(184);
  });

  it("knowledge totals are 32 documents and 1,842 passages", () => {
    expect(fixtureTotals.documents).toBe(32);
    expect(fixtureTotals.passages).toBe(1842);
    const knowledge = getKnowledge();
    for (const collection of knowledge.collections) {
      const docs = knowledge.documents.filter((doc) => doc.collection === collection.name);
      expect(docs.length).toBe(collection.documents);
      expect(sum(docs.map((doc) => doc.passages))).toBe(collection.passages);
    }
  });

  it("has 24 conversations split 9 + 7 + 4 + 4 by project", () => {
    expect(fixtureTotals.conversations).toBe(24);
    expect(fixtureTotals.conversationsByProject.map((row) => row.actual)).toEqual([9, 7, 4, 4]);
    expect(fixtureTotals.conversationsByProject.map((row) => row.declared)).toEqual([9, 7, 4, 4]);
  });
});
