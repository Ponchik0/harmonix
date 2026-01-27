import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock window.electronAPI for tests
Object.defineProperty(window, "electronAPI", {
  value: {
    minimize: () => Promise.resolve(),
    maximize: () => Promise.resolve(),
    close: () => Promise.resolve(),
  },
  writable: true,
});

// Mock Howler for tests
vi.mock("howler", () => ({
  Howl: vi.fn().mockImplementation(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn().mockReturnValue(0),
    duration: vi.fn().mockReturnValue(180),
    playing: vi.fn().mockReturnValue(false),
    unload: vi.fn(),
    volume: vi.fn(),
    once: vi.fn(),
  })),
  Howler: {
    volume: vi.fn().mockReturnValue(0.7),
  },
}));
