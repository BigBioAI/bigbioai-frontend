import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorizationHeader = request.headers.get("authorization");

    // Avoid logging full chat request body to prevent sensitive data exposure.
    if (process.env.NODE_ENV !== "production") {
      console.log("Chat query request received");
      console.log("Authorization header:", authorizationHeader ? "Present" : "Missing");
      console.log("Dataset ID:", body.dataset_id);
    }

    // Backend health check before sending request
    try {
      const healthController = new AbortController();
      const healthTimeout = setTimeout(() => healthController.abort(), 5000);

      const healthResponse = await fetch(`${BACKEND_URL}/health`, {
        method: "GET",
        headers: authorizationHeader
          ? {
              Authorization: authorizationHeader,
            }
          : undefined,
        signal: healthController.signal,
      });

      clearTimeout(healthTimeout);

      if (!healthResponse.ok) {
        console.warn("Backend health check failed:", healthResponse.status);
      }
    } catch (healthError) {
      console.warn(
        "Backend health check failed:",
        (healthError as Error).message,
      );
      // Continue with request despite health check failure
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000); // 5분 타임아웃

    try {
      console.log("Sending request to backend:", `${BACKEND_URL}/api/agent/query`);
      console.log("Request headers:", {
        "Content-Type": "application/json",
        Authorization: authorizationHeader ? "Bearer token present" : "No auth",
      });
      console.log("Request body:", JSON.stringify(body));

      const response = await fetch(`${BACKEND_URL}/api/agent/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorizationHeader
            ? { Authorization: authorizationHeader }
            : {}),
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

      if (!response.ok) {
        console.error("Chat backend error:", response.status, data);
        if (process.env.NODE_ENV !== "production") {
          console.error("Full error response:", JSON.stringify(data, null, 2));
        }

        let errorMessage = "Chat failed";
        if (data.error) {
          errorMessage =
            typeof data.error === "string"
              ? data.error
              : data.error.message || "Chat failed";
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (data.message) {
          errorMessage = data.message;
        }

        // Provide more helpful error messages based on status
        if (response.status === 500) {
          errorMessage =
            "AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (response.status === 404) {
          errorMessage =
            "요청한 데이터셋을 찾을 수 없습니다. 데이터 전처리가 완료되었는지 확인해주세요.";
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage = `요청 오류: ${errorMessage}`;
        }

        const errorResponse = {
          error: errorMessage,
          code: data.error?.code || data.code,
          hint: data.error?.hint || data.hint,
        };

        return NextResponse.json(errorResponse, { status: response.status });
      }

      console.log("Chat response:", data);
      return NextResponse.json(data);
    } catch (fetchError) {
      throw fetchError;
    }
  } catch (error) {
    console.error("Chat proxy error:", error);
    console.error("Error details:", {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    });

    const err = error as Error;

    if (err.name === "AbortError") {
      return NextResponse.json(
        { error: "Chat request timeout - AI 응답 시간이 초과되었습니다." },
        { status: 408 },
      );
    }

    // 백엔드 연결 실패 시 기본 응답 제공
    const errorWithCause = error as { cause?: { code?: string } };
    if (errorWithCause.cause?.code === "ECONNREFUSED") {
      return NextResponse.json({
        answer: "현재 AI 분석 서버가 준비 중입니다. 곧 서비스가 시작됩니다.",
        session_id: "demo_session",
        figures: [],
      });
    }

    // Agent 실행 오류 등 기타 백엔드 에러 처리
    console.error("Unexpected backend error:", err.message, err.stack);

    return NextResponse.json(
      {
        error:
          "AI 서버와의 연결에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 500 },
    );
  }
}
