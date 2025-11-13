import { describe, it, expect } from "bun:test";
import { dragToScreenRect } from "../src/utils/region";
import type { ScreenFrame } from "../src/types";

const baseFrame: ScreenFrame = {
  display: {
    id: 1,
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    name: "Primary",
    scale_factor: 1,
    is_primary: true,
  },
  width: 1920,
  height: 1080,
  stride: 1920 * 4,
  bytes: [],
  timestamp_ms: 0,
};

describe("dragToScreenRect", () => {
  it("scales drag coordinates to screen pixels", () => {
    const rect = dragToScreenRect(
      { start: { x: 100, y: 50 }, current: { x: 200, y: 150 } },
      baseFrame,
      { width: 960, height: 540 },
    );
    expect(rect).toEqual({ x: 200, y: 100, width: 200, height: 200 });
  });

  it("returns null for zero-area drags", () => {
    const rect = dragToScreenRect(
      { start: { x: 10, y: 10 }, current: { x: 10, y: 10 } },
      baseFrame,
      { width: 960, height: 540 },
    );
    expect(rect).toBeNull();
  });

  it("handles displays with offsets", () => {
    const frame: ScreenFrame = {
      ...baseFrame,
      display: { ...baseFrame.display, x: -1920, y: 0 },
    };
    const rect = dragToScreenRect(
      { start: { x: 0, y: 0 }, current: { x: 100, y: 100 } },
      frame,
      { width: 960, height: 540 },
    );
    expect(rect).toEqual({ x: -1920, y: 0, width: 200, height: 200 });
  });
});
