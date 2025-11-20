import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CountdownTimer } from "../src/components/CountdownTimer";
import * as eventBridge from "../src/eventBridge";

vi.mock("../src/eventBridge", () => ({
    subscribeEvent: vi.fn(),
}));

describe("CountdownTimer", () => {
    let mockUnsubscribe: () => void;
    let eventCallback: (event: any) => void;

    beforeEach(() => {
        mockUnsubscribe = vi.fn();
        eventCallback = () => { };

        vi.mocked(eventBridge.subscribeEvent).mockImplementation((_channel: string, callback: any) => {
            eventCallback = callback;
            return Promise.resolve(mockUnsubscribe);
        });
    });

    it("renders nothing when monitor is not running", () => {
        const { container } = render(<CountdownTimer />);
        expect(container.firstChild).toBeNull();
    });

    it("displays next check countdown after MonitorTick event", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 5000,
            cooldown_remaining_ms: 0,
            condition_met: false,
        });

        await waitFor(() => {
            expect(screen.getByText("Next Check In")).toBeTruthy();
            expect(screen.getByText(/\d\.\ds/)).toBeTruthy(); // Matches 5.0s, 4.9s, etc.
        });
    });

    it("displays cooldown when present", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 2000,
            cooldown_remaining_ms: 8000,
            condition_met: false,
        });

        await waitFor(() => {
            expect(screen.getByText("Cooldown")).toBeTruthy();
            expect(screen.getByText(/8\.\ds/)).toBeTruthy();
        });
    });

    it("displays action ready indicator when condition met and no cooldown", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 1000,
            cooldown_remaining_ms: 0,
            condition_met: true,
        });

        await waitFor(() => {
            expect(screen.getByText("Action Ready")).toBeTruthy();
            expect(screen.getByText("⚡ FIRING")).toBeTruthy();
        });
    });

    it("hides timer when monitor stops", async () => {
        render(<CountdownTimer />);

        // Start monitor
        eventCallback({
            type: "MonitorTick",
            next_check_ms: 3000,
            cooldown_remaining_ms: 0,
            condition_met: false,
        });

        await waitFor(() => expect(screen.getByText("Next Check In")).toBeTruthy());

        // Stop monitor
        eventCallback({
            type: "MonitorStateChanged",
            state: "Stopped",
        });

        await waitFor(() => expect(screen.queryByText("Next Check In")).toBeNull());
    });

    it("cleans up subscription on unmount", async () => {
        const { unmount } = render(<CountdownTimer />);
        await waitFor(() => expect(eventBridge.subscribeEvent).toHaveBeenCalled());
        unmount();
        expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it("handles next check reaching zero", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 0,
            cooldown_remaining_ms: 0,
            condition_met: false,
        });

        await waitFor(() => {
            expect(screen.getByText("Next Check In")).toBeTruthy();
            expect(screen.getByText("0.0s")).toBeTruthy();
        });
    });

    it("handles null/undefined event gracefully", async () => {
        render(<CountdownTimer />);

        // Call with null event
        eventCallback(null);

        // Component should still render nothing
        expect(screen.queryByText("Next Check In")).toBeNull();
    });

    it("handles event without type field", async () => {
        render(<CountdownTimer />);

        // Call with invalid event
        eventCallback({});

        // Should not crash
        expect(screen.queryByText("Next Check In")).toBeNull();
    });

    it("does not show cooldown when it is zero", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 3000,
            cooldown_remaining_ms: 0,
            condition_met: false,
        });

        await waitFor(() => {
            expect(screen.getByText("Next Check In")).toBeTruthy();
            expect(screen.queryByText("Cooldown")).toBeNull();
        });
    });

    it("does not show action ready when condition not met", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 1000,
            cooldown_remaining_ms: 0,
            condition_met: false,
        });

        await waitFor(() => {
            expect(screen.getByText("Next Check In")).toBeTruthy();
            expect(screen.queryByText("Action Ready")).toBeNull();
        });
    });

    it("does not show action ready when cooldown is active", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorTick",
            next_check_ms: 1000,
            cooldown_remaining_ms: 2000,
            condition_met: true,
        });

        await waitFor(() => {
            expect(screen.getByText("Cooldown")).toBeTruthy();
            expect(screen.queryByText("Action Ready")).toBeNull();
        });
    });

    it("handles MonitorStateChanged with Running state", async () => {
        render(<CountdownTimer />);

        eventCallback({
            type: "MonitorStateChanged",
            state: "Running",
        });

        // Should not affect timer state when no tick has been received
        expect(screen.queryByText("Next Check In")).toBeNull();
    });

    it("handles dispose function throwing error", async () => {
        const throwingUnsubscribe = vi.fn(() => {
            throw new Error("Unsubscribe error");
        });

        vi.mocked(eventBridge.subscribeEvent).mockImplementation((_channel: string, callback: any) => {
            eventCallback = callback;
            return Promise.resolve(throwingUnsubscribe);
        });

        const { unmount } = render(<CountdownTimer />);
        await waitFor(() => expect(eventBridge.subscribeEvent).toHaveBeenCalled());

        // Should not crash when unmounting
        expect(() => unmount()).not.toThrow();
    });
});
