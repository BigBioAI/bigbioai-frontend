import { NextRequest, NextResponse } from "next/server";
import { BACKEND_URL } from "@/lib/server/env";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; path: string[] }> }
) {
  let sessionId = "";
  let path: string[] = [];

  try {
    ({ sessionId, path } = await params);
    const plotPath = path.join("/");
    const authorizationHeader = request.headers.get("authorization");

    // Build the backend URL
    const backendUrl = `${BACKEND_URL}/api/artifacts/sessions/${sessionId}/plots/${plotPath}`;

    console.log("Fetching artifact from:", backendUrl);
    console.log("Authorization:", authorizationHeader ? "Present" : "Missing");

    const response = await fetch(backendUrl, {
      headers: {
        ...(authorizationHeader
          ? { Authorization: authorizationHeader }
          : {}),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend artifact fetch failed:", response.status, errorText);
      console.error("Backend URL:", backendUrl);
      console.error("Authorization header:", authorizationHeader ? "Present" : "Missing");

      return NextResponse.json(
        {
          error: "Failed to fetch artifact",
          details: errorText,
          status: response.status
        },
        { status: response.status }
      );
    }

    // Get the content type from the backend response
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const data = await response.arrayBuffer();

    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600", // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error("Artifact proxy error:", error);
    console.error("Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
      sessionId,
      path,
    });

    return NextResponse.json(
      {
        error: "Failed to proxy artifact request",
        details: (error as Error).message,
        sessionId,
        path,
      },
      { status: 500 }
    );
  }
}
