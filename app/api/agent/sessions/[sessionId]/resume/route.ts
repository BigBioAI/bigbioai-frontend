import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

interface ResumeRequest {
  approved: boolean;
  feedback?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body: ResumeRequest = await request.json();
    const authorizationHeader = request.headers.get("authorization");

    console.log("=== Resume API 디버깅 ===");
    console.log("1. sessionId:", sessionId);
    console.log("2. typeof sessionId:", typeof sessionId);
    console.log("3. body:", body);
    console.log("4. authorizationHeader:", authorizationHeader ? "Present" : "Missing");

    const backendUrl = `${BACKEND_URL}/api/agent/sessions/${sessionId}/resume`;
    console.log("6. 백엔드 URL:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorizationHeader
          ? { Authorization: authorizationHeader }
          : {}),
      },
      body: JSON.stringify(body),
    });

    console.log("7. 백엔드 응답 상태:", response.status);

    const data = await response.json();

    if (!response.ok) {
      console.error("8. 백엔드 오류:", response.status, data);
      console.error("9. 오류 상세:", {
        sessionId: sessionId,
        url: backendUrl,
        requestBody: body,
        responseData: data
      });

      return NextResponse.json(
        {
          error: data.error || data.detail || data.message || "Backend error",
          code: data.error?.code,
          hint: data.error?.hint,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Resume proxy error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to connect to backend" },
      { status: 500 }
    );
  }
}