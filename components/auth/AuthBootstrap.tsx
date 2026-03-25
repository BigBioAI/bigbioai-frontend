"use client";

import { useEffect } from "react";
import { authAPI } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

export function AuthBootstrap() {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    if (isInitialized) {
      return;
    }

    let isMounted = true;

    const initialize = async () => {
      try {
        await authAPI.refreshAccessToken();
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
  }, [isInitialized, setInitialized]);

  return null;
}
