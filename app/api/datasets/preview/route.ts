import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorizationHeader = request.headers.get("authorization");

    console.log("Proxying preview request to:", `${BACKEND_URL}/api/datasets/preview`);
    console.log("Request body:", JSON.stringify(body));
    console.log("Authorization:", authorizationHeader ? "Present" : "Missing");

    const response = await fetch(`${BACKEND_URL}/api/datasets/preview`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authorizationHeader
          ? { Authorization: authorizationHeader }
          : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Backend preview error:", response.status, data);
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
    console.error("Preview proxy error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to connect to backend" },
      { status: 500 }
    );
  }
}