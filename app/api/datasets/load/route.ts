import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log('Proxying request to:', `${BACKEND_URL}/api/datasets/load`);
    console.log('Request body:', body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(`${BACKEND_URL}/api/datasets/load`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const data = await response.json();

    if (!response.ok) {
      console.error('Backend error:', response.status, data);

      const errorResponse = {
        error: data.error || data.detail || data.message || 'Backend error',
        code: data.error?.code,
        hint: data.error?.hint
      };

      return NextResponse.json(errorResponse, { status: response.status });
    }

      console.log('Backend response:', data);
      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('Proxy error:', error);

    const err = error as Error;

    if (err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - 파일이 너무 커서 처리 시간이 초과되었습니다.' },
        { status: 408 }
      );
    }

    return NextResponse.json(
      { error: err.message || 'Failed to connect to backend' },
      { status: 500 }
    );
  }
}