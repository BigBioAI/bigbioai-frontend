import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorizationHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/api/agent/query/stream${request.nextUrl.search}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authorizationHeader
            ? { Authorization: authorizationHeader }
            : {}),
        },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const responseText = await response.text();
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          "Content-Type":
            response.headers.get("content-type") || "application/json",
        },
      });
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "Empty response stream" },
        { status: 502 },
      );
    }

    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 },
    );
  }
}
