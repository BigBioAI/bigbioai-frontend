import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const upstreamForm = new FormData();

    for (const [key, value] of formData.entries()) {
      upstreamForm.append(key, value);
    }

    const authorizationHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/api/documents/upload${request.nextUrl.search}`,
      {
        method: "POST",
        headers: authorizationHeader
          ? { Authorization: authorizationHeader }
          : undefined,
        body: upstreamForm,
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
