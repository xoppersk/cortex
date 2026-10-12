import { describe, expect, it } from "vitest";
import {
  fixtureTotals,
  getAdminData,
  getConversations,
  getEvaluations,
  getKnowledge,
  getThread,
  getUsage,
} from "./api";
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
      expect(sum(docs.map((doc) => doc.passages ?? 0))).toBe(collection.passages);
    }
  });

  it("has 24 conversations split 9 + 7 + 4 + 4 by project", () => {
    expect(fixtureTotals.conversations).toBe(24);
    expect(fixtureTotals.conversationsByProject.map((row) => row.actual)).toEqual([9, 7, 4, 4]);
    expect(fixtureTotals.conversationsByProject.map((row) => row.declared)).toEqual([9, 7, 4, 4]);
  });

  it("usage chart series matches the designed points with a 209 projection", () => {
    const usage = getUsage();
    expect(usage.series.map((point) => point.value)).toEqual([0, 38, 72, 126, 184]);
    expect(usage.projection.value).toBe(209);
  });

  it("spending-alert notification is checked in the profile fixture", () => {
    const { profile } = getAdminData();
    const alertNotification = profile.notifications[2];
    expect(alertNotification?.label).toContain("alert level");
    expect(alertNotification?.checked).toBe(true);
  });

  it("history searchText is consistent with the visible title and snippet", () => {
    for (const conversation of getConversations().conversations) {
      expect(conversation.searchText).toContain(conversation.title);
      expect(conversation.searchText).toContain(conversation.snippet);
      const visible = `${conversation.title} ${conversation.snippet}`.toLowerCase();
      if (visible.includes("interview")) {
        expect(conversation.searchText.toLowerCase()).toContain("interview");
      }
    }
  });

  it("thread note 3 marks exactly the designed phrase inside curly quotes", () => {
    const note = getThread().notes.find((item) => item.id === "note-3");
    expect(note).toBeDefined();
    const segments = note?.excerpt ?? [];
    const marked = segments.filter((segment) => segment.mark).map((segment) => segment.text);
    expect(marked).toEqual(["see the document behind an answer"]);
    const joined = segments.map((segment) => segment.text).join("");
    expect(joined.startsWith("“")).toBe(true);
    expect(joined.endsWith("”")).toBe(true);
    expect(note?.passageHref).toBe("/app/knowledge/documents/customer-interview-synthesis");
  });

  it("evaluation set latest strings carry no separator dot", () => {
    for (const set of getEvaluations().otherSets) {
      expect(set.latest).toMatch(/^\d+ passed Oct \d+$/);
      expect(set.latest).not.toContain("·");
    }
  });
});
