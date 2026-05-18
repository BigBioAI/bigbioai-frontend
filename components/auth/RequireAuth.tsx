"use client";

import type { ReactNode } from "react";
import { Loader2, LockKeyhole } from "lucide-react";
import { Card } from "@/components/ui/card";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useAuthStore } from "@/store/authStore";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const accessToken = useAuthStore((state) => state.accessToken);

  if (isInitialized && accessToken) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
            {isInitialized ? (
              <LockKeyhole className="size-6 text-muted-foreground" />
            ) : (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-semibold">로그인이 필요합니다</h1>
            <p className="text-sm text-muted-foreground">
              BigBioAI 분석 기능은 로그인 후 사용할 수 있습니다.
            </p>
          </div>
          {isInitialized && (
            <div className="flex justify-center">
              <GoogleSignInButton />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
