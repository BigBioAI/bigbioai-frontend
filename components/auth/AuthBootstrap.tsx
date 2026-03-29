"use client";

import { useEffect } from "react";
import { authAPI } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

export function AuthBootstrap() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);
  const accessToken = useAuthStore((state) => state.accessToken);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        // localStorage에서 기존 토큰 확인
        const storedToken = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setSession(storedToken, user);
            console.log("Restored auth session from localStorage");
          } catch (e) {
            console.error("Failed to parse stored user:", e);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
          }
        }

        // 리프레시 토큰으로 새 액세스 토큰 얻기 시도
        if (!accessToken) {
          await authAPI.refreshAccessToken();
        }
      } finally {
        if (isMounted) {
          setInitialized(true);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
    };
  }, [isInitialized, setInitialized, accessToken, setSession]);

  return null;
}
