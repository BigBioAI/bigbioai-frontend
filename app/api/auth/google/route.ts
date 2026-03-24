import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const response = await fetch(`${BACKEND_URL}/api/auth/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const responseText = await response.text();
    const nextResponse = new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
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
          message: "로그인 처리 중 서버 연결 오류가 발생했습니다.",
        },
      },
      { status: 500 },
    );
  }
}
