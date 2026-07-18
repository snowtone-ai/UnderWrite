import { afterEach, describe, expect, it } from "vitest";
import { getAiProvider, requireEnv } from "../lib/env";

describe("getAiProvider", () => {
  const original = process.env.AI_PROVIDER;
  afterEach(() => {
    process.env.AI_PROVIDER = original;
  });

  it("defaults to gemini when unset", () => {
    delete process.env.AI_PROVIDER;
    expect(getAiProvider()).toBe("gemini");
  });

  it("accepts a supported provider", () => {
    process.env.AI_PROVIDER = "claude";
    expect(getAiProvider()).toBe("claude");
  });

  it("throws on an unsupported provider", () => {
    process.env.AI_PROVIDER = "grok";
    expect(() => getAiProvider()).toThrow(/Unsupported AI_PROVIDER/);
  });
});

describe("requireEnv", () => {
  it("throws when the variable is missing", () => {
    delete process.env.__UW_TEST_MISSING__;
    expect(() => requireEnv("__UW_TEST_MISSING__")).toThrow(/Missing required/);
  });
});
