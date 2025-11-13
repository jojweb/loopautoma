import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventLog } from "../src/components/EventLog";

describe("EventLog", () => {
  it("renders various events", () => {
    render(
      <EventLog
        events={[
          { type: "TriggerFired" },
          { type: "ConditionEvaluated", result: true },
          { type: "ActionStarted", action: "Click" },
          { type: "ActionCompleted", action: "Click", success: true },
          { type: "MonitorStateChanged", state: "Running" },
          { type: "WatchdogTripped", reason: "max_runtime" },
          { type: "Error", message: "oops" },
        ]}
      />
    );
    expect(screen.getByText(/TriggerFired/)).toBeTruthy();
    expect(screen.getByText(/ConditionEvaluated: true/)).toBeTruthy();
    expect(screen.getByText(/ActionStarted: Click/)).toBeTruthy();
    expect(screen.getByText(/ActionCompleted: Click/)).toBeTruthy();
    expect(screen.getByText(/MonitorStateChanged: Running/)).toBeTruthy();
    expect(screen.getByText(/WatchdogTripped: max_runtime/)).toBeTruthy();
    expect(screen.getByText(/Error: oops/)).toBeTruthy();
  });
});
