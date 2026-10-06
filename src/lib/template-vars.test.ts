import { describe, expect, it } from "vitest";

import {
  extractVariables,
  escapeVariableValue,
  substituteVariables,
  validateTemplateVariables,
} from "./template-vars";

describe("template-vars", () => {
  it("extracts {{variables}}", () => {
    expect(extractVariables("Hello {{name}}, you are {{age}} years old")).toEqual([
      "name",
      "age",
    ]);
    expect(extractVariables("No variables here")).toEqual([]);
    expect(extractVariables("{{dup}} and {{dup}}")).toEqual(["dup"]);
  });

  it("escapes variable values", () => {
    const escaped = escapeVariableValue("Hello {{name}}");
    expect(escaped).not.toContain("{{");
    expect(escaped).toContain("&#123;");
  });

  it("substitutes variables", () => {
    const vars = [{ name: "name", required: true }];
    const result = substituteVariables("Hello {{name}}!", vars, { name: "Alice" });
    expect(result.text).toBe("Hello Alice!");
  });

  it("tracks missing variables", () => {
    const vars = [{ name: "name", required: true }];
    const result = substituteVariables("Hello {{name}}!", vars, {});
    expect(result.missing).toContain("name");
  });

  it("validates required variables", () => {
    const vars = [{ name: "a", required: true }, { name: "b", required: true }];
    const errors = validateTemplateVariables("Hi {{a}}", vars);
    // b is defined but not used in body
    expect(errors.length).toBeGreaterThan(0);
  });

  it("validates all present", () => {
    const vars = [{ name: "a", required: true }];
    const errors = validateTemplateVariables("Hi {{a}}", vars);
    expect(errors).toHaveLength(0);
  });
});
