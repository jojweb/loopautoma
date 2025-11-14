import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ScreenPreview } from "../src/components/ScreenPreview";
import type { ScreenFrame } from "../src/types";

const mockStartScreenStream = vi.fn<(fps?: number) => Promise<void>>();
const mockStopScreenStream = vi.fn<() => Promise<void>>();
const screenFrameListeners: Array<(payload: { payload: ScreenFrame }) => void> = [];

vi.mock("../src/tauriBridge", () => ({
  startScreenStream: (fps?: number) => mockStartScreenStream(fps),
  stopScreenStream: () => mockStopScreenStream(),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockImplementation((_name, handler) => {
    screenFrameListeners.push(handler);
    return Promise.resolve(() => {});
  }),
}));

const emitScreenFrame = (frame: ScreenFrame) => {
  screenFrameListeners.forEach((cb) => cb({ payload: frame }));
};

const createFrame = (overrides: Partial<ScreenFrame> = {}): ScreenFrame => ({
  display: { id: 1, name: "Primary", x: 0, y: 0, width: 200, height: 120, scale_factor: 1, is_primary: true },
  width: 200,
  height: 120,
  stride: 800,
  bytes: Array(200 * 120 * 4).fill(120),
  timestamp_ms: Date.now(),
  ...overrides,
});

const setCanvasRect = (canvas: HTMLCanvasElement, width = 200, height = 120) => {
  Object.defineProperty(canvas, "getBoundingClientRect", {
    configurable: true,
    value: () => ({ left: 0, top: 0, width, height, right: width, bottom: height, x: 0, y: 0, toJSON: () => ({}) }),
  });
  (canvas as any).setPointerCapture = vi.fn();
  (canvas as any).releasePointerCapture = vi.fn();
  return canvas;
};

const originalGetContext = HTMLCanvasElement.prototype.getContext;
const originalImageData = globalThis.ImageData;

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    putImageData: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  if (!globalThis.ImageData) {
    (globalThis as any).ImageData = class {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }
});

afterAll(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  if (originalImageData) {
    globalThis.ImageData = originalImageData;
  } else {
    delete (globalThis as any).ImageData;
  }
});

beforeEach(() => {
  vi.clearAllMocks();
  screenFrameListeners.length = 0;
  mockStartScreenStream.mockResolvedValue(undefined);
  mockStopScreenStream.mockResolvedValue(undefined);
});

describe("ScreenPreview", () => {
  it("renders with disabled state when no profile", () => {
    render(<ScreenPreview disabled={true} />);
    const btn = screen.getByRole("button", { name: /Start preview/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(screen.getByText(/Select a profile to enable/)).toBeTruthy();
  });

  it("renders enabled state with profile", () => {
    const regions = [
      { id: "r1", rect: { x: 0, y: 0, width: 100, height: 100 }, name: "Test Region" },
    ];
    render(<ScreenPreview regions={regions} disabled={false} />);
    const btn = screen.getByRole("button", { name: /Start preview/i }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it("starts and stops preview stream", async () => {
    render(<ScreenPreview disabled={false} />);
    
    const startBtn = screen.getByRole("button", { name: /Start preview/i });
    fireEvent.click(startBtn);
    
    await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalledWith(3));
    
    const stopBtn = screen.getByRole("button", { name: /Stop preview/i });
    fireEvent.click(stopBtn);
    
    await waitFor(() => expect(mockStopScreenStream).toHaveBeenCalled());
  });

  it("surfaces start stream errors", async () => {
    mockStartScreenStream.mockRejectedValueOnce(new Error("no pipewire"));
    render(<ScreenPreview disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("no pipewire");
  });

  it("shows placeholder when no frame available", () => {
    render(<ScreenPreview disabled={false} />);
    expect(screen.getByText(/Start the preview to capture your desktop/)).toBeTruthy();
  });

  it("renders canvas element", () => {
    render(<ScreenPreview disabled={false} />);
    const canvas = document.querySelector("canvas");
    expect(canvas).toBeTruthy();
    expect(canvas?.className).toContain("screen-preview-canvas");
  });

  it("accepts empty regions array", () => {
    render(<ScreenPreview regions={[]} disabled={false} />);
    const btn = screen.getByRole("button", { name: /Start preview/i });
    expect(btn).toBeTruthy();
  });

  it("handles regions with optional names", () => {
    const regions = [
      { id: "r1", rect: { x: 0, y: 0, width: 100, height: 100 } },
      { id: "r2", rect: { x: 100, y: 100, width: 200, height: 200 }, name: "Named" },
    ];
    render(<ScreenPreview regions={regions} disabled={false} />);
    // Component should render without errors
    expect(screen.getByRole("button", { name: /Start preview/i })).toBeTruthy();
  });

  it("stops streaming when unmounted", async () => {
    const { unmount } = render(<ScreenPreview disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
    await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());
    unmount();
    await waitFor(() => expect(mockStopScreenStream).toHaveBeenCalled());
  });

  it("stops streaming when disabled prop changes", async () => {
    const { rerender } = render(<ScreenPreview disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
    await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());
    rerender(<ScreenPreview disabled={true} />);
    await waitFor(() => expect(mockStopScreenStream).toHaveBeenCalled());
  });

  it("captures drag selection and adds region", async () => {
    const onRegionAdd = vi.fn().mockResolvedValue(undefined);
  const { container } = render(<ScreenPreview disabled={false} onRegionAdd={onRegionAdd} />);

  fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
  await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());

  emitScreenFrame(createFrame());
  await screen.findByText(/scale 1\.00/);
  const canvas = setCanvasRect(container.querySelector("canvas") as HTMLCanvasElement);

    fireEvent.pointerDown(canvas, { clientX: 10, clientY: 10, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 110, clientY: 70, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    await screen.findByText(/Proposed region/);

    fireEvent.change(screen.getByLabelText(/Region ID/i), { target: { value: "region-test" } });
    fireEvent.change(screen.getByLabelText(/Friendly name/i), { target: { value: "My Region" } });
    fireEvent.click(screen.getByRole("button", { name: /Add region to profile/i }));

    await waitFor(() => expect(onRegionAdd).toHaveBeenCalledTimes(1));
    expect(onRegionAdd).toHaveBeenCalledWith({
      id: "region-test",
      name: "My Region",
      rect: { x: 10, y: 10, width: 100, height: 60 },
    });
  });

  it("shows error when region add fails", async () => {
    const onRegionAdd = vi.fn().mockRejectedValue(new Error("persist failed"));
  const { container } = render(<ScreenPreview disabled={false} onRegionAdd={onRegionAdd} />);

  fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
  await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());

  emitScreenFrame(createFrame());
  await screen.findByText(/scale 1\.00/);
  const canvas = setCanvasRect(container.querySelector("canvas") as HTMLCanvasElement);
    fireEvent.pointerDown(canvas, { clientX: 20, clientY: 20, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 80, clientY: 80, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });

    await screen.findByText(/Proposed region/);
    fireEvent.click(screen.getByRole("button", { name: /Add region to profile/i }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("persist failed");
  });

  it("allows canceling a pending region", async () => {
  const { container } = render(<ScreenPreview disabled={false} onRegionAdd={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
  await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());
  emitScreenFrame(createFrame());
  await screen.findByText(/scale 1\.00/);
  const canvas = setCanvasRect(container.querySelector("canvas") as HTMLCanvasElement);
    fireEvent.pointerDown(canvas, { clientX: 15, clientY: 15, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 50, clientY: 50, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    await screen.findByText(/Proposed region/);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    await waitFor(() => {
      expect(screen.queryByText(/Proposed region/)).toBeNull();
    });
  });

  it("ignores pointer move without drag when bounds are invalid", () => {
    const { container } = render(<ScreenPreview disabled={false} />);
    const canvas = setCanvasRect(container.querySelector("canvas") as HTMLCanvasElement, 0, 0);
    fireEvent.pointerMove(canvas, { clientX: 20, clientY: 20, pointerId: 5 });
    fireEvent.pointerUp(canvas, { pointerId: 5 });
    expect(screen.queryByText(/Proposed region/)).toBeNull();
  });

  it("falls back to intrinsic canvas bounds when DOMRect is unavailable", async () => {
    const onRegionAdd = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<ScreenPreview disabled={false} onRegionAdd={onRegionAdd} />);
    fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
    await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());
    emitScreenFrame(createFrame());
    await screen.findByText(/scale 1\.00/);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    setCanvasRect(canvas);
    delete (canvas as any).getBoundingClientRect;
    canvas.width = 200;
    canvas.height = 120;
    fireEvent.pointerDown(canvas, { clientX: 15, clientY: 15, pointerId: 6 });
    fireEvent.pointerMove(canvas, { clientX: 60, clientY: 60, pointerId: 6 });
    fireEvent.pointerUp(canvas, { pointerId: 6 });
    await screen.findByText(/Proposed region/);
  });

  it("warns when screen frames have too few bytes", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      render(<ScreenPreview disabled={false} />);
      fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
      await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());
      emitScreenFrame(createFrame({ width: 8, height: 8, bytes: Array(20).fill(1) }));
      await waitFor(() => {
        expect(warn.mock.calls.some(([msg]) => typeof msg === "string" && msg.includes("screen_frame bytes shorter"))).toBe(true);
      });
    } finally {
      warn.mockRestore();
    }
  });

  it("handles stop stream rejections", async () => {
    mockStopScreenStream.mockRejectedValueOnce(new Error("stop fail"));
    render(<ScreenPreview disabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: /Start preview/i }));
    await waitFor(() => expect(mockStartScreenStream).toHaveBeenCalled());
    emitScreenFrame(createFrame());
    const stopBtn = await screen.findByRole("button", { name: /Stop preview/i });
    fireEvent.click(stopBtn);
    await waitFor(() => expect(mockStopScreenStream).toHaveBeenCalled());
    await screen.findByRole("button", { name: /Start preview/i });
  });
});
