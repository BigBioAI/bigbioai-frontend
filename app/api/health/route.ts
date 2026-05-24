import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL, BACKEND_URL_CONFIG_ERROR } from "@/lib/server/env";

export async function GET(request: NextRequest) {
  if (BACKEND_URL_CONFIG_ERROR) {
    return NextResponse.json(
      {
        error: BACKEND_URL_CONFIG_ERROR,
        hint: "Set BACKEND_URL in the matching deployment environment, then redeploy.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/health${request.nextUrl.search}`,
      { method: "GET" },
    );

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch (error) {
    const isProduction = process.env.NODE_ENV === "production";

    return NextResponse.json(
      {
        error: "Failed to connect to backend",
        ...(!isProduction
          ? {
              backendUrl: BACKEND_URL,
              details: error instanceof Error ? error.message : "Unknown error",
            }
          : {}),
      },
      { status: 500 },
    );
  }
}
