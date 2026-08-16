import { create } from "zustand";

export type Theme = "light" | "dark";

const STORAGE_KEY = "devlens-theme";

function readStoredTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  return window.localStorage.getItem(STORAGE_KEY) === "light" ? "light" : "dark";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readStoredTheme(),
  setTheme: (theme) => {
    window.localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
  toggleTheme: () => {
    get().setTheme(get().theme === "dark" ? "light" : "dark");
  },
}));

if (typeof window !== "undefined") {
  applyTheme(useThemeStore.getState().theme);
}
