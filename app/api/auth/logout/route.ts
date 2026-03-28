import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const authorizationHeader = request.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers:
        cookieHeader || authorizationHeader
          ? {
              ...(cookieHeader ? { cookie: cookieHeader } : {}),
              ...(authorizationHeader
                ? { Authorization: authorizationHeader }
                : {}),
            }
          : undefined,
    });

    const nextResponse = new NextResponse(null, {
      status: response.status,
    });

    const responseHeaders = response.headers as Headers & {
      getSetCookie?: () => string[];
    };
    const setCookieHeaders =
      typeof responseHeaders.getSetCookie === "function"
        ? responseHeaders.getSetCookie()
        : [];

    if (setCookieHeaders.length > 0) {
      for (const cookie of setCookieHeaders) {
        nextResponse.headers.append("set-cookie", cookie);
      }
    } else {
      const setCookieHeader = response.headers.get("set-cookie");
      if (setCookieHeader) {
        nextResponse.headers.append("set-cookie", setCookieHeader);
      }
    }

    return nextResponse;
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "auth_proxy_error",
          message: "로그아웃 처리 중 서버 연결 오류가 발생했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
