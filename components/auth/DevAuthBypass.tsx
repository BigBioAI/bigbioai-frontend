"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export function DevAuthBypass() {
  const setSession = useAuthStore((state) => state.setSession);
  const setInitialized = useAuthStore((state) => state.setInitialized);

  const enableDevMode = () => {
    // 개발용 모의 사용자 및 토큰
    const mockUser = {
      id: "dev-user-123",
      email: "test@bigbioai.com",
      name: "개발 테스트 사용자",
      picture: "https://ui-avatars.com/api/?name=Test+User&background=0D8ABC&color=fff",
    };

    const mockToken = "dev-token-" + Date.now();

    // 세션 설정
    setSession(mockToken, mockUser);
    setInitialized(true);

    // localStorage에 저장
    localStorage.setItem("accessToken", mockToken);
    localStorage.setItem("user", JSON.stringify(mockUser));

    console.log("개발 모드 인증 우회 활성화됨");
  };

  // 개발 모드 자동 활성화 (선택사항)
  useEffect(() => {
    if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      const autoLogin = localStorage.getItem("dev_auto_login");
      if (autoLogin === "true") {
        enableDevMode();
      }
    }
  }, []);

  // 프로덕션에서는 표시하지 않음
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 p-4 bg-yellow-50 border-yellow-300 max-w-sm z-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900">개발 모드</h3>
          <p className="text-sm text-yellow-700 mt-1">
            OAuth 인증 없이 테스트하려면 아래 버튼을 클릭하세요.
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={enableDevMode}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 border-yellow-400"
            >
              인증 우회하기
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                localStorage.setItem("dev_auto_login", "true");
                enableDevMode();
              }}
              className="text-yellow-700 hover:bg-yellow-100"
            >
              자동 로그인 설정
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}