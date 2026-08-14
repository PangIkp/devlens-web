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

// jsdom doesn't implement the Pointer Events capture APIs or scrollIntoView,
// both of which Radix UI's Select uses internally — without these stubs,
// opening a Select in a test throws "hasPointerCapture is not a function".
/* eslint-disable @typescript-eslint/unbound-method */
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};
Element.prototype.scrollIntoView ??= () => {};
/* eslint-enable @typescript-eslint/unbound-method */

afterEach(() => {
  clearAuthSession();
  window.localStorage.clear();
});
