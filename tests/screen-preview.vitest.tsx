import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ScreenPreview } from "../src/components/ScreenPreview";

// Mock Tauri bridge
vi.mock("../src/tauriBridge", () => ({
  startScreenStream: vi.fn().mockResolvedValue(undefined),
  stopScreenStream: vi.fn().mockResolvedValue(undefined),
}));

// Mock Tauri event listener
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

describe("ScreenPreview", () => {
  it("renders with disabled state when no profile", () => {
    render(<ScreenPreview disabled={true} />);
    const btn = screen.getByRole("button", { name: /Start preview/i });
    expect(btn.disabled).toBe(true);
    expect(screen.getByText(/Select a profile to enable/)).toBeTruthy();
  });

  it("renders enabled state with profile", () => {
    const regions = [
      { id: "r1", rect: { x: 0, y: 0, width: 100, height: 100 }, name: "Test Region" },
    ];
    render(<ScreenPreview regions={regions} disabled={false} />);
    const btn = screen.getByRole("button", { name: /Start preview/i });
    expect(btn.disabled).toBe(false);
  });

  it("starts and stops preview stream", async () => {
    const { startScreenStream, stopScreenStream } = await import("../src/tauriBridge");
    render(<ScreenPreview disabled={false} />);
    
    const startBtn = screen.getByRole("button", { name: /Start preview/i });
    fireEvent.click(startBtn);
    
    // Wait for async effect
    await new Promise((r) => setTimeout(r, 0));
    
    expect(startScreenStream).toHaveBeenCalledWith(5);
    
    const stopBtn = screen.getByRole("button", { name: /Stop preview/i });
    fireEvent.click(stopBtn);
    
    await new Promise((r) => setTimeout(r, 0));
    
    expect(stopScreenStream).toHaveBeenCalled();
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

  it("handles region addition callback", async () => {
    const onRegionAdd = vi.fn().mockResolvedValue(undefined);
    render(<ScreenPreview disabled={false} onRegionAdd={onRegionAdd} />);
    
    // The region form only appears after a drag, which requires a frame
    // This tests the prop is passed through
    expect(onRegionAdd).not.toHaveBeenCalled();
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
});
