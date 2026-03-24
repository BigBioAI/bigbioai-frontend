"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import { toast } from "sonner";
import { authAPI } from "@/lib/api/auth";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: "standard" | "icon";
      theme?: "outline" | "filled_blue" | "filled_black";
      size?: "small" | "medium" | "large";
      text?: "signin_with" | "signup_with" | "continue_with" | "signin";
      shape?: "rectangular" | "pill" | "circle" | "square";
      logo_alignment?: "left" | "center";
      width?: number;
    },
  ) => void;
}

interface GoogleWindow {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isScriptReady, setIsScriptReady] = useState(false);

  const renderButton = useCallback(() => {
    if (!isScriptReady || !containerRef.current || !GOOGLE_CLIENT_ID) {
      return;
    }

    const googleApi = (window as Window & GoogleWindow).google;
    if (!googleApi?.accounts?.id) {
      return;
    }

    googleApi.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          await authAPI.loginWithGoogle(response.credential);
          toast.success("로그인되었습니다.");
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "로그인에 실패했습니다.";
          toast.error(message);
        }
      },
    });

    containerRef.current.innerHTML = "";
    googleApi.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "medium",
      type: "standard",
      text: "continue_with",
      shape: "pill",
      logo_alignment: "left",
      width: 220,
    });
  }, [isScriptReady]);

  useEffect(() => {
    renderButton();
  }, [renderButton]);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <p className="px-2 text-xs text-sidebar-foreground/70">
        NEXT_PUBLIC_GOOGLE_CLIENT_ID가 설정되지 않았습니다.
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setIsScriptReady(true)}
      />
      <div ref={containerRef} />
    </>
  );
}
