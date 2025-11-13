import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

vi.mock("@tauri-apps/api/event", () => {
  return {
    listen: async (_name: string, _cb: any) => {
      return () => {};
    },
  };
});

vi.mock("@tauri-apps/api/core", () => {
  return {
    invoke: vi.fn(async () => ({})),
  };
});
