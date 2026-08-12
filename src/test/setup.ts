import "@testing-library/jest-dom";

Object.defineProperty(window, "scrollTo", {
  value: vi.fn(),
  writable: true,
});
