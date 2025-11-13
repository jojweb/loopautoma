import { describe, it, expect } from "bun:test";

describe("hello world", () => {
  it("says hello", () => {
    expect("hello world").toContain("hello");
  });

  it("basic math works", () => {
    expect(2 + 2).toBe(4);
  });
});
