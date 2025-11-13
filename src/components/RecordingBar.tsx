import { useEffect, useRef, useState } from "react";
import { windowPosition } from "../tauriBridge";

export type RecordingEvent =
  | { t: "click"; button: "Left" | "Right" | "Middle"; x: number; y: number }
  | { t: "type"; text: string }
  | { t: "key"; key: string };

export function RecordingBar(props: {
  onStart?: () => void;
  onStop?: (events: RecordingEvent[]) => void;
  onSave?: (events: RecordingEvent[]) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [events, setEvents] = useState<RecordingEvent[]>([]);
  const [screenOffset, setScreenOffset] = useState<{ x: number; y: number; scale: number }>({ x: 0, y: 0, scale: 1 });
  const typeBuffer = useRef<string>("");

  useEffect(() => {
  if (!recording) return;

    let unsub = () => {};
    (async () => {
      // approximate screen coords: window top-left + client coords
      try {
        // Prefer window_info if available; fallback to windowPosition
        const info = (await (async () => {
          try {
            // dynamic import to avoid TS coupling
            const { invoke } = await import("@tauri-apps/api/core");
            return (await invoke("window_info")) as [number, number, number];
          } catch { return null as any; }
        })());
        if (info) {
          const [x, y, scale] = info as any;
          setScreenOffset({ x, y, scale });
        } else {
          const pos = await windowPosition();
          setScreenOffset({ x: pos.x, y: pos.y, scale: 1 });
        }
      } catch {}

      const onMouseDown = (e: MouseEvent) => {
        let button: "Left" | "Right" | "Middle" = "Left";
        if (e.button === 1) button = "Middle";
        else if (e.button === 2) button = "Right";
        const sx = Math.round(screenOffset.x + e.clientX * screenOffset.scale);
        const sy = Math.round(screenOffset.y + e.clientY * screenOffset.scale);
        setEvents((prev) => [...prev, { t: "click", button, x: sx, y: sy }]);
      };
      const flushType = () => {
        if (typeBuffer.current.length > 0) {
          const text = typeBuffer.current;
          typeBuffer.current = "";
          setEvents((prev) => [...prev, { t: "type", text }]);
        }
      };
      const onKeyDown = (e: KeyboardEvent) => {
        // coalesce plain character input into a single type event
        const isPlain = !e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1;
        if (isPlain) {
          typeBuffer.current += e.key;
        } else {
          flushType();
          setEvents((prev) => [...prev, { t: "key", key: e.key }]);
        }
      };
      const onBlur = () => flushType();

  window.addEventListener("mousedown", onMouseDown, { passive: true });
  window.addEventListener("keydown", onKeyDown);
  // Also attach to document to be robust in test environments (jsdom)
  document.addEventListener("mousedown", onMouseDown as any, { passive: true } as any);
  document.addEventListener("keydown", onKeyDown as any);
      window.addEventListener("blur", onBlur);
      unsub = () => {
  window.removeEventListener("mousedown", onMouseDown as any);
  window.removeEventListener("keydown", onKeyDown as any);
  document.removeEventListener("mousedown", onMouseDown as any);
  document.removeEventListener("keydown", onKeyDown as any);
        window.removeEventListener("blur", onBlur as any);
      };
    })();

    return () => {
      unsub();
      // flush any buffered type on stop
      if (typeBuffer.current.length > 0) {
        const text = typeBuffer.current;
        typeBuffer.current = "";
        setEvents((prev) => [...prev, { t: "type", text }]);
      }
    };
  }, [recording, screenOffset.x, screenOffset.y]);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <button
        onClick={() => {
          if (!recording) {
            setEvents([]);
            setRecording(true);
            props.onStart?.();
          } else {
            setRecording(false);
            props.onStop?.(events);
          }
        }}
        title={recording ? "Stop recording" : "Start recording (limited to app window)"}
      >
        {recording ? "Stop" : "Record"}
      </button>
      {recording && (
        <span className="running-chip" title="Recording in progress">Recording</span>
      )}
      <button
        onClick={() => props.onSave?.(events)}
        disabled={events.length === 0}
        title={events.length ? "Save recorded steps as an ActionSequence" : "Record some interactions to enable saving"}
      >
        Save as ActionSequence
      </button>
    </div>
  );
}

// Helper to map recording events to ActionSequence actions
export function toActions(events: RecordingEvent[]) {
  type MouseButton = "Left" | "Right" | "Middle";
  const actions: Array<
    | { type: "MoveCursor"; x: number; y: number }
    | { type: "Click"; button: MouseButton }
    | { type: "Type"; text: string }
    | { type: "Key"; key: string }
  > = [];
  for (const ev of events) {
    if (ev.t === "click") {
      actions.push({ type: "MoveCursor", x: ev.x, y: ev.y });
      actions.push({ type: "Click", button: ev.button });
    }
    else if (ev.t === "type") actions.push({ type: "Type", text: ev.text });
    else if (ev.t === "key") actions.push({ type: "Key", key: ev.key });
  }
  return actions;
}
