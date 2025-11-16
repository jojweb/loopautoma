import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { RecordingBar, toActions } from "../src/components/RecordingBar";
import type { InputEvent } from "../src/types";
import { emitTestEvent } from "../src/eventBridge";

const tauriBridgeMocks = vi.hoisted(() => ({
  startInputRecording: vi.fn(),
  stopInputRecording: vi.fn(),
  windowPosition: vi.fn().mockResolvedValue({ x: 0, y: 0 }),
  windowInfo: vi.fn().mockResolvedValue({ x: 0, y: 0, scale: 1 }),
}));

vi.mock("../src/tauriBridge", () => tauriBridgeMocks);

const mockStartInputRecording = tauriBridgeMocks.startInputRecording;
const mockStopInputRecording = tauriBridgeMocks.stopInputRecording;

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
  mockStartInputRecording.mockReset();
  mockStopInputRecording.mockReset();
  mockStartInputRecording.mockResolvedValue(undefined);
  mockStopInputRecording.mockResolvedValue(undefined);
});

describe("RecordingBar", () => {
  it("toggles record/stop and saves click+key", async () => {
    const onSave = vi.fn();
    render(<RecordingBar onSave={onSave} />);

    const btn = screen.getByRole("button", { name: /Record/i });
    fireEvent.click(btn);

    await waitFor(() => expect(mockStartInputRecording).toHaveBeenCalled());
    await screen.findByText(/Recording/i);

    await emitMouseDown("Left", 5, 7);
    await emitKeyEvent("down", "a", "a");
    await emitKeyEvent("down", "Enter", null);

    const stopBtn = await screen.findByRole("button", { name: /Stop/i });
    fireEvent.click(stopBtn);
    await waitFor(() => expect(mockStopInputRecording).toHaveBeenCalled());

    const saveBtn = screen.getByRole("button", { name: /Save as ActionSequence/i }) as HTMLButtonElement;
    await waitFor(() => expect(saveBtn.disabled).toBe(false));
    fireEvent.click(saveBtn);

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const events = onSave.mock.calls[0][0];
    const actions = toActions(events);

    // Expect a Click at (5, 7) with Left button, plus a Type action for Enter key
    expect(actions.find(a => (a as any).type === "Click" && (a as any).x === 5 && (a as any).y === 7 && (a as any).button === "Left")).toBeTruthy();
    expect(actions.find(a => (a as any).type === "Type" && (a as any).text === "{Key:Enter}")).toBeTruthy();
  });

  it("handles timeline events, buffer flush, scroll, and clear", async () => {
    render(<RecordingBar />);
    const recordBtn = screen.getByRole("button", { name: /Record/i });
    fireEvent.click(recordBtn);
    await waitFor(() => expect(mockStartInputRecording).toHaveBeenCalled());

    await emitMouseMove();
    await emitMouseUp("Left");
    await emitScrollEvent(5, -3);
    await emitKeyEvent("down", "a", "a");
    await emitKeyEvent("up", "a", "a");

    await screen.findByText(/Left release/);
    await screen.findByText(/scroll Δ5,-3/);
    await screen.findByText(/type "a"/);

    const clearBtn = screen.getByRole("button", { name: /Clear/i }) as HTMLButtonElement;
    await waitFor(() => expect(clearBtn.disabled).toBe(false));
    fireEvent.click(clearBtn);
    expect(clearBtn.disabled).toBe(true);
    expect(screen.getByText(/No events yet\./)).toBeTruthy();
  });

  it("surfaces start errors and swallows stop errors", async () => {
    mockStartInputRecording.mockRejectedValueOnce(new Error("hook denied"));
    mockStopInputRecording.mockRejectedValueOnce(new Error("stop fail"));
    const onStop = vi.fn();
    render(<RecordingBar onStop={onStop} />);

    const recordBtn = screen.getByRole("button", { name: /Record/i });
    fireEvent.click(recordBtn);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("hook denied");
    expect(recordBtn.textContent).toMatch(/Record/i);

    fireEvent.click(recordBtn);
    await waitFor(() => expect(mockStartInputRecording).toHaveBeenCalledTimes(2));
    const stopBtn = await screen.findByRole("button", { name: /Stop/i });
    fireEvent.click(stopBtn);

    await waitFor(() => expect(mockStopInputRecording).toHaveBeenCalled());
    await waitFor(() => expect(onStop).toHaveBeenCalledTimes(1));
  });
});
