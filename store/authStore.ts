import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      isInitialized: false,
      setSession: (accessToken, user) => {
        set({
          accessToken,
          user,
        });
        // localStorage에 저장
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("user", JSON.stringify(user));
        }
      },
      setAccessToken: (accessToken) => {
        set((state) => ({
          accessToken,
          user: state.user,
        }));
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
        }
      },
      clearSession: () => {
        set({
          accessToken: null,
          user: null,
        });
        // localStorage에서 제거
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      },
      setInitialized: (value) => set({ isInitialized: value }),
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);
