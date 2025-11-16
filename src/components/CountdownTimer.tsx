import { useEffect, useState } from "react";
import { subscribeEvent } from "../eventBridge";
import { Event } from "../types";

export function CountdownTimer() {
  const [nextCheckMs, setNextCheckMs] = useState<number | null>(null);
  const [cooldownRemainingMs, setCooldownRemainingMs] = useState<number | null>(null);
  const [conditionMet, setConditionMet] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  useEffect(() => {
    let dispose: (() => void) | undefined;
    subscribeEvent<Event>("loopautoma://event", (event) => {
      if (!event) return;
      if (event.type === "MonitorTick") {
        setNextCheckMs(event.next_check_ms);
        setCooldownRemainingMs(event.cooldown_remaining_ms);
        setConditionMet(event.condition_met);
        setLastUpdate(Date.now());
      } else if (event.type === "MonitorStateChanged") {
        if (event.state === "Stopped") {
          setNextCheckMs(null);
          setCooldownRemainingMs(null);
          setConditionMet(false);
        }
      }
    }).then((off) => (dispose = off));

    return () => {
      try {
        dispose?.();
      } catch {}
    };
  }, []);

  // Live countdown - update every 100ms
  useEffect(() => {
    if (nextCheckMs === null) return;
    const interval = setInterval(() => {
      setLastUpdate(Date.now());
    }, 100);
    return () => clearInterval(interval);
  }, [nextCheckMs]);

  if (nextCheckMs === null) {
    return null; // Monitor not running
  }

  const elapsed = Date.now() - lastUpdate;
  const nextCheckRemaining = Math.max(0, nextCheckMs - elapsed);
  const cooldownRemaining = cooldownRemainingMs ? Math.max(0, cooldownRemainingMs - elapsed) : 0;

  const formatTime = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    const decisec = Math.floor((ms % 1000) / 100);
    return `${sec}.${decisec}s`;
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        padding: "1rem",
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "8px",
        alignItems: "center",
      }}
    >
      <div
        style={{
          flex: 1,
          textAlign: "center",
          padding: "0.75rem",
          background: nextCheckRemaining === 0 ? "#28a745" : "#17a2b8",
          color: "white",
          borderRadius: "6px",
        }}
      >
        <div style={{ fontSize: "0.9em", opacity: 0.9, marginBottom: "0.25rem" }}>Next Check In</div>
        <div style={{ fontSize: "2em", fontWeight: "bold", fontFamily: "monospace" }}>
          {formatTime(nextCheckRemaining)}
        </div>
      </div>

      {cooldownRemaining > 0 && (
        <div
          style={{
            flex: 1,
            textAlign: "center",
            padding: "0.75rem",
            background: "#ffc107",
            color: "#000",
            borderRadius: "6px",
          }}
        >
          <div style={{ fontSize: "0.9em", opacity: 0.7, marginBottom: "0.25rem" }}>Cooldown</div>
          <div style={{ fontSize: "2em", fontWeight: "bold", fontFamily: "monospace" }}>
            {formatTime(cooldownRemaining)}
          </div>
        </div>
      )}

      {conditionMet && cooldownRemaining === 0 && (
        <div
          style={{
            flex: 1,
            textAlign: "center",
            padding: "0.75rem",
            background: "#dc3545",
            color: "white",
            borderRadius: "6px",
            animation: "pulse 1s ease-in-out infinite",
          }}
        >
          <div style={{ fontSize: "0.9em", opacity: 0.9, marginBottom: "0.25rem" }}>Action Ready</div>
          <div style={{ fontSize: "1.5em", fontWeight: "bold" }}>⚡ FIRING</div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
