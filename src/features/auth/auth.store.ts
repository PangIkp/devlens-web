import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SessionPayload } from "@/features/auth/auth.schemas";

type AuthState = {
  session: SessionPayload | null;
  setSession: (session: SessionPayload) => void;
  clearSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clearSession: () => set({ session: null }),
    }),
    {
      name: "devlens-auth",
      partialize: (state) => ({ session: state.session }),
    },
  ),
);

export function getAuthSession() {
  return useAuthStore.getState().session;
}

export function setAuthSession(session: SessionPayload) {
  useAuthStore.getState().setSession(session);
}

export function clearAuthSession() {
  useAuthStore.getState().clearSession();
}
