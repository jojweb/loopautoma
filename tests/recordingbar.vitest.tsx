import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecordingBar, toActions } from "../src/components/RecordingBar";
import type { InputEvent } from "../src/types";
import { emitTestEvent } from "../src/eventBridge";

const tauriBridgeMocks = vi.hoisted(() => ({
  actionRecorderShow: vi.fn(),
  windowPosition: vi.fn().mockResolvedValue({ x: 0, y: 0 }),
  windowInfo: vi.fn().mockResolvedValue({ x: 0, y: 0, scale: 1 }),
}));

vi.mock("../src/tauriBridge", () => tauriBridgeMocks);

const mockActionRecorderShow = tauriBridgeMocks.actionRecorderShow;

const nextTick = () => new Promise((resolve) => setTimeout(resolve, 0));

const emitInputEvent = async (event: InputEvent) => {
  await nextTick();
  emitTestEvent("loopautoma://input_event", event);
};

const baseModifiers = { shift: false, control: false, alt: false, meta: false };

const emitMouseDown = async (button: "Left" | "Right" | "Middle", x: number, y: number) => {
  await emitInputEvent({
    kind: "mouse",
    mouse: {
      event_type: { button_down: button },
      x,
      y,
      modifiers: baseModifiers,
      timestamp_ms: Date.now(),
    },
  });
};

const emitMouseUp = async (button: "Left" | "Right" | "Middle") => {
  await emitInputEvent({
    kind: "mouse",
    mouse: {
      event_type: { button_up: button },
      x: 0,
      y: 0,
      modifiers: baseModifiers,
      timestamp_ms: Date.now(),
    },
  });
};

const emitMouseMove = async () => {
  await emitInputEvent({
    kind: "mouse",
    mouse: {
      event_type: "move",
      x: 1,
      y: 1,
      modifiers: baseModifiers,
      timestamp_ms: Date.now(),
    },
  });
};

const emitKeyEvent = async (state: "down" | "up", key: string, text?: string | null) => {
  await emitInputEvent({
    kind: "keyboard",
    keyboard: {
      state,
      key,
      code: key === "Enter" ? 13 : 0,
      text,
      modifiers: baseModifiers,
      timestamp_ms: Date.now(),
    },
  });
};

const emitScrollEvent = async (deltaX: number, deltaY: number) => {
  await emitInputEvent({
    kind: "scroll",
    scroll: {
      delta_x: deltaX,
      delta_y: deltaY,
      modifiers: baseModifiers,
      timestamp_ms: Date.now(),
    },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockActionRecorderShow.mockReset();
  mockActionRecorderShow.mockResolvedValue(undefined);
});

describe("RecordingBar", () => {
  it("opens action recorder window when clicked", async () => {
    render(<RecordingBar />);

    const btn = screen.getByRole("button", { name: /Record Actions/i });
    fireEvent.click(btn);

    await waitFor(() => expect(mockActionRecorderShow).toHaveBeenCalled());
  });

  it("shows error when action recorder fails to open", async () => {
    mockActionRecorderShow.mockRejectedValueOnce(new Error("Failed to open recorder"));
    render(<RecordingBar />);

    const btn = screen.getByRole("button", { name: /Record Actions/i });
    fireEvent.click(btn);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Failed to open recorder");
  });
});
