import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ datasetId: string; plotName: string }> },
) {
  try {
    const { datasetId, plotName } = await params;
    const authorizationHeader = request.headers.get("authorization");

    const backendUrl = `${BACKEND_URL}/api/datasets/${datasetId}/plots/${encodeURIComponent(
      plotName,
    )}${request.nextUrl.search}`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: authorizationHeader
        ? { Authorization: authorizationHeader }
        : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        {
          error: "Failed to fetch plot",
          details: errorText,
          status: response.status,
        },
        { status: response.status },
      );
    }

    const contentType =
      response.headers.get("content-type") || "application/octet-stream";
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to connect to backend" },
      { status: 500 },
    );
  }
}
