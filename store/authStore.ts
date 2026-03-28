import { create } from "zustand";
import type { AuthUser } from "@/types/auth";

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isInitialized: boolean;
  setSession: (accessToken: string, user: AuthUser) => void;
  setAccessToken: (accessToken: string) => void;
  clearSession: () => void;
  setInitialized: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isInitialized: false,
  setSession: (accessToken, user) =>
    set({
      accessToken,
      user,
    }),
  setAccessToken: (accessToken) =>
    set((state) => ({
      accessToken,
      user: state.user,
    })),
  clearSession: () =>
    set({
      accessToken: null,
      user: null,
    }),
  setInitialized: (value) => set({ isInitialized: value }),
}));
