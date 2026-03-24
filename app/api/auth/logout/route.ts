import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
      method: "POST",
      headers: cookieHeader
        ? {
            cookie: cookieHeader,
          }
        : undefined,
    });

    const nextResponse = new NextResponse(null, {
      status: response.status,
    });

    const setCookieHeader = response.headers.get("set-cookie");
    if (setCookieHeader) {
      nextResponse.headers.set("set-cookie", setCookieHeader);
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
