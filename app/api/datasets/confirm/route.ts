import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authorizationHeader = request.headers.get("authorization");

    console.log("Proxying confirm request to:", `${BACKEND_URL}/api/datasets/confirm`);
    console.log("Raw ID:", body.raw_id);

    const response = await fetch(`${BACKEND_URL}/api/datasets/confirm`, {
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
      console.error("Backend confirm error:", response.status, data);
      return NextResponse.json(
        {
          error: data.error || data.detail || data.message || "Backend error",
          code: data.error?.code,
          hint: data.error?.hint,
        },
        { status: response.status }
      );
    }

    console.log("Dataset confirmed successfully:", data.dataset_id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Confirm proxy error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to connect to backend" },
      { status: 500 }
    );
  }
}