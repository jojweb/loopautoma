import { describe, it, expect } from "bun:test";

describe("hello world (bun)", () => {
  it("says hello", () => {
    expect("hello world").toContain("hello");
  });
});
