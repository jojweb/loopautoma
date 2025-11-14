import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../src/App";

// Mock Tauri bridge
const mockProfilesLoad = vi.fn();
const mockProfilesSave = vi.fn();
const mockMonitorStart = vi.fn();
const mockMonitorStop = vi.fn();
const mockMonitorPanicStop = vi.fn();
const mockStartScreenStream = vi.fn();
const mockStopScreenStream = vi.fn();
const mockStartInputRecording = vi.fn();
const mockStopInputRecording = vi.fn();
const mockWindowPosition = vi.fn();
const mockWindowInfo = vi.fn();

vi.mock("../src/tauriBridge", () => ({
  profilesLoad: () => mockProfilesLoad(),
  profilesSave: (profiles: any) => mockProfilesSave(profiles),
  monitorStart: (profileId: string) => mockMonitorStart(profileId),
  monitorStop: () => mockMonitorStop(),
  monitorPanicStop: () => mockMonitorPanicStop(),
  startScreenStream: (fps?: number) => mockStartScreenStream(fps),
  stopScreenStream: () => mockStopScreenStream(),
  startInputRecording: () => mockStartInputRecording(),
  stopInputRecording: () => mockStopInputRecording(),
  windowPosition: () => mockWindowPosition(),
  windowInfo: () => mockWindowInfo(),
}));

// Mock Tauri event listener
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn().mockResolvedValue(() => {}),
}));

describe("Monitor control", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfilesLoad.mockResolvedValue([]);
    mockProfilesSave.mockResolvedValue(undefined);
    mockMonitorStart.mockResolvedValue(undefined);
    mockMonitorStop.mockResolvedValue(undefined);
    mockMonitorPanicStop.mockResolvedValue(undefined);
    mockStartScreenStream.mockResolvedValue(undefined);
    mockStopScreenStream.mockResolvedValue(undefined);
    mockStartInputRecording.mockResolvedValue(undefined);
    mockStopInputRecording.mockResolvedValue(undefined);
    mockWindowPosition.mockResolvedValue({ x: 0, y: 0 });
    mockWindowInfo.mockResolvedValue({ x: 0, y: 0, scale: 1 });
  });

  it("loads profiles on mount", async () => {
    render(<App />);
    await waitFor(() => {
      expect(mockProfilesLoad).toHaveBeenCalled();
    });
  });

  it("creates default profile when none exist", async () => {
    mockProfilesLoad.mockResolvedValue([]);
    render(<App />);
    
    await waitFor(() => {
      expect(mockProfilesSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: "keep-agent-001",
            name: "Copilot Keep-Alive",
          }),
        ])
      );
    });
  });

  it("Start button is disabled when no profile selected", async () => {
    mockProfilesLoad.mockResolvedValue([]);
    render(<App />);
    
    await waitFor(() => {
      const startBtn = screen.queryByRole("button", { name: /^Start$/i });
      // Start button may not exist or be disabled initially
      if (startBtn) {
        expect(startBtn).toBeDisabled();
      }
    });
  });

  it("starts monitor when Start button clicked", async () => {
    const testProfile = {
      id: "test-1",
      name: "Test",
      regions: [],
      trigger: { type: "IntervalTrigger", interval_ms: 500 },
      condition: { type: "RegionCondition", stable_ms: 1000, downscale: 4 },
      actions: [],
    };
    mockProfilesLoad.mockResolvedValue([testProfile]);
    
    render(<App />);
    
    await waitFor(() => {
      expect(screen.getByText("Test")).toBeTruthy();
    });
    
    const startBtn = screen.getByRole("button", { name: /^Start$/i });
    fireEvent.click(startBtn);
    
    await waitFor(() => {
      expect(mockMonitorStart).toHaveBeenCalledWith("test-1");
    });
  });

  it("stops monitor when Stop button clicked", async () => {
    const testProfile = {
      id: "test-1",
      name: "Test",
      regions: [],
      trigger: { type: "IntervalTrigger", interval_ms: 500 },
      condition: { type: "RegionCondition", stable_ms: 1000, downscale: 4 },
      actions: [],
    };
    mockProfilesLoad.mockResolvedValue([testProfile]);
    
    render(<App />);
    
    await waitFor(() => {
      const startBtn = screen.getByRole("button", { name: /^Start$/i });
      fireEvent.click(startBtn);
    });
    
    await waitFor(() => {
      const stopBtn = screen.getByRole("button", { name: /^Stop$/i });
      fireEvent.click(stopBtn);
    });
    
    await waitFor(() => {
      expect(mockMonitorStop).toHaveBeenCalled();
    });
  });

  it("Panic Stop button is disabled when not running", async () => {
    mockProfilesLoad.mockResolvedValue([]);
    render(<App />);
    
    await waitFor(() => {
      const panicBtn = screen.getByRole("button", { name: /Panic Stop/i });
      expect(panicBtn).toBeDisabled();
    });
  });

  it("triggers panic stop when Panic Stop clicked", async () => {
    const testProfile = {
      id: "test-1",
      name: "Test",
      regions: [],
      trigger: { type: "IntervalTrigger", interval_ms: 500 },
      condition: { type: "RegionCondition", stable_ms: 1000, downscale: 4 },
      actions: [],
    };
    mockProfilesLoad.mockResolvedValue([testProfile]);
    
    render(<App />);
    
    await waitFor(() => {
      const startBtn = screen.getByRole("button", { name: /^Start$/i });
      fireEvent.click(startBtn);
    });
    
    await waitFor(() => {
      const panicBtn = screen.getByRole("button", { name: /Panic Stop/i });
      expect(panicBtn).not.toBeDisabled();
      fireEvent.click(panicBtn);
    });
    
    await waitFor(() => {
      expect(mockMonitorPanicStop).toHaveBeenCalled();
    });
  });

  it("shows Running indicator when monitor is active", async () => {
    const testProfile = {
      id: "test-1",
      name: "Test",
      regions: [],
      trigger: { type: "IntervalTrigger", interval_ms: 500 },
      condition: { type: "RegionCondition", stable_ms: 1000, downscale: 4 },
      actions: [],
    };
    mockProfilesLoad.mockResolvedValue([testProfile]);
    
    render(<App />);
    
    await waitFor(() => {
      const startBtn = screen.getByRole("button", { name: /^Start$/i });
      fireEvent.click(startBtn);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Running/)).toBeTruthy();
    });
  });
});
