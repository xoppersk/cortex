import { describe, expect, it } from "vitest";

import { redactPii } from "./pii";

describe("pii", () => {
  it("redacts email addresses", () => {
    const { text, total } = redactPii("Contact alice@example.com for help");
    expect(total).toBeGreaterThan(0);
    expect(text).not.toContain("alice@example.com");
    expect(text).toContain("[REDACTED");
  });

  it("redacts phone numbers", () => {
    const { text, total } = redactPii("Call 555-123-4567");
    expect(total).toBeGreaterThan(0);
    expect(text).not.toContain("555-123-4567");
  });

  it("redacts SSNs", () => {
    const { text } = redactPii("SSN: 123-45-6789");
    expect(text).not.toContain("123-45-6789");
  });

  it("leaves clean text untouched", () => {
    const { text, total } = redactPii("Hello world, no PII here.");
    expect(total).toBe(0);
    expect(text).toBe("Hello world, no PII here.");
  });
});
