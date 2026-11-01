import { NextRequest, NextResponse } from 'next/server';
import { analyzeProblemWithGemini } from '@/lib/gemini';
import { SubjectType, AIModelMode } from '@/types/problem';
import { verifyFirebaseIdToken } from '@/lib/firebase/admin';

// 간단한 인메모리 요청 제한 (분당 15회)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || entry.expiresAt < now) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + 60 * 1000 });
    return true;
  }
  if (entry.count >= 15) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: '문제를 분석하려면 먼저 로그인해주세요.' }, { status: 401 });
    }

    let uid: string;
    try {
      uid = await verifyFirebaseIdToken(token);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (
        code === 'app/invalid-credential' ||
        code === 'auth/invalid-credential' ||
        code === 'app/no-app'
      ) {
        return NextResponse.json({ error: '서버 인증 설정이 필요합니다. 관리자 인증 정보를 확인해주세요.' }, { status: 503 });
      }
      return NextResponse.json({ error: '로그인 정보가 만료되었어요. 다시 로그인해주세요.' }, { status: 401 });
    }

    if (!checkRateLimit(uid)) {
      return NextResponse.json(
        { error: '요청 한도 초과: 1분 뒤에 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const {
      subject = 'math',
      modelMode = 'speed',
      imageBase64,
      imageMimeType,
      problemText,
      userContext,
    } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: '서버의 Gemini API 설정이 필요합니다.',
        },
        { status: 503 }
      );
    }

    // 실제 Gemini API 호출 (네트워크 필수)
    const result = await analyzeProblemWithGemini({
      subject: subject as SubjectType,
      modelMode: modelMode as AIModelMode,
      imageBase64,
      imageMimeType,
      problemText,
      userContext,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('API /api/analyze error:', error);
    const apiError = error as { message?: string; status?: number };
    if (apiError?.message === 'GEMINI_API_KEY_MISSING') {
      return NextResponse.json(
        {
          error:
            '서버의 Gemini API 설정이 필요합니다.',
        },
        { status: 401 }
      );
    }
    let errorMsg = apiError?.message || '네트워크 통신 또는 문제 분석 도중 오류가 발생했습니다.';
    if (apiError?.status === 503 || apiError?.message?.includes('high demand') || apiError?.message?.includes('503')) {
      errorMsg = '구글 Gemini AI 서버의 전 세계 트래픽이 일시적으로 급증했습니다. 3~5초 뒤에 다시 보내기(↑) 버튼을 눌러주세요.';
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
