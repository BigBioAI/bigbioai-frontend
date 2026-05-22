import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const authorizationHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/api/agent/sessions/${sessionId}/title${request.nextUrl.search}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(authorizationHeader
            ? { Authorization: authorizationHeader }
            : {}),
        },
        body: JSON.stringify(body),
      },
    );

    const responseText = await response.text();
    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("content-type") || "application/json",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 },
    );
  }
}
