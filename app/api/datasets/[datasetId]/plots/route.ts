import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> },
) {
  try {
    const { datasetId } = await params;
    const authorizationHeader = request.headers.get("authorization");

    const response = await fetch(
      `${BACKEND_URL}/api/datasets/${datasetId}/plots${request.nextUrl.search}`,
      {
        method: "GET",
        headers: authorizationHeader
          ? { Authorization: authorizationHeader }
          : undefined,
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
