import "@testing-library/jest-dom";
import { afterEach } from "vitest";
import { clearAuthSession } from "@/features/auth/auth.store";

Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

afterEach(() => {
  clearAuthSession();
  window.localStorage.clear();
});
