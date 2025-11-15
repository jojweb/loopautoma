import { listen } from "@tauri-apps/api/event";

const isTauri = typeof window !== "undefined" && (window as any).__TAURI_IPC__;
const isTestHarness = typeof window !== "undefined" && (window as any).__LOOPAUTOMA_TEST__;

type Handler<T> = (payload: T) => void;

export async function subscribeEvent<T = unknown>(channel: string, handler: Handler<T>) {
  // If we have a test harness, always use DOM events for predictable testing
  if (isTauri && !isTestHarness) {
    const unlisten = await listen<T>(channel, (event) => {
      handler(event.payload as T);
    });
    return () => {
      try {
        unlisten();
      } catch {
        // ignore
      }
    };
  }

  if (typeof window !== "undefined") {
    const domHandler = ((evt: Event) => {
      const detail = (evt as CustomEvent).detail;
      const payload = detail?.payload ?? detail;
      handler(payload as T);
    }) as EventListener;
    window.addEventListener(channel, domHandler);
    return () => {
      try {
        window.removeEventListener(channel, domHandler);
      } catch {
        // ignore
      }
    };
  }

  return () => {};
}

export function emitTestEvent<T = unknown>(channel: string, payload: T) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent(channel, { detail: { payload } });
  window.dispatchEvent(event);
}
