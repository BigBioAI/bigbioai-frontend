import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/chat/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.detail || '분석 요청 실패',
          message: '죄송합니다. 현재 분석 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해주세요.'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Chat analyze error:', error);

    // 백엔드 연결 실패 시 기본 응답 제공
    if (error.cause?.code === 'ECONNREFUSED') {
      return NextResponse.json({
        message: '현재 AI 분석 서버가 준비 중입니다. 곧 서비스가 시작됩니다.',
        suggestions: [
          '클러스터링 분석을 수행해줘',
          '세포 타입을 예측해줘',
          '차별 발현 유전자를 찾아줘',
          '유전자 경로 분석을 수행해줘'
        ]
      });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      },
      { status: 500 }
    );
  }
}