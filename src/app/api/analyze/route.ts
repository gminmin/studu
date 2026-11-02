import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { analyzeProblemWithGemini } from '@/lib/gemini';
import { SubjectType, AIModelMode } from '@/types/problem';
import { getAdminFirestore, verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { ensureWallet, getWalletRef } from '@/lib/firebase/economy';
import { CREDIT_COST_BY_MODE } from '@/lib/economy';

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
  let uid: string | null = null;
  let requestRef: FirebaseFirestore.DocumentReference | null = null;
  let reservedCost = 0;
  let ownsReservation = false;
  try {
    const authorization = req.headers.get('authorization');
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) {
      return NextResponse.json({ error: '문제를 분석하려면 먼저 로그인해주세요.' }, { status: 401 });
    }

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
      requestId,
    } = body;

    if (modelMode !== 'speed' && modelMode !== 'deep') {
      return NextResponse.json({ error: '선택한 분석 모드를 확인해주세요.' }, { status: 400 });
    }
    if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(requestId)) {
      return NextResponse.json({ error: '분석 요청을 다시 시작해주세요.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error: '서버의 Gemini API 설정이 필요합니다.',
        },
        { status: 503 }
      );
    }

    await ensureWallet(uid);
    const db = getAdminFirestore();
    requestRef = db.doc(`users/${uid}/analysisRequests/${requestId}`);
    const walletRef = getWalletRef(uid);
    reservedCost = CREDIT_COST_BY_MODE[modelMode as AIModelMode];
    const reservation = await db.runTransaction(async (transaction) => {
      const requestSnapshot = await transaction.get(requestRef!);
      if (requestSnapshot.exists) {
        const previous = requestSnapshot.data();
        if (previous?.status === 'completed' && previous.result && previous.sessionId) {
          return { duplicate: true as const, result: previous.result, sessionId: previous.sessionId };
        }
        throw new Error(previous?.status === 'pending' ? 'ANALYSIS_ALREADY_RUNNING' : 'ANALYSIS_REQUEST_ALREADY_USED');
      }
      const walletSnapshot = await transaction.get(walletRef);
      const credits = Number(walletSnapshot.data()?.credits ?? 0);
      if (credits < reservedCost) throw new Error('INSUFFICIENT_CREDITS');
      transaction.update(walletRef, { credits: credits - reservedCost, updatedAt: FieldValue.serverTimestamp() });
      transaction.set(requestRef!, {
        status: 'pending',
        mode: modelMode,
        cost: reservedCost,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.set(getAdminFirestore().doc(`users/${uid}/walletTransactions/${requestId}`), {
        currency: 'credits', amount: -reservedCost, reason: 'problem_analysis', referenceId: requestId,
        createdAt: FieldValue.serverTimestamp(),
      });
      return { duplicate: false as const };
    });
    if (reservation.duplicate) {
      return NextResponse.json({ ...reservation.result, sessionId: reservation.sessionId });
    }
    ownsReservation = true;

    // Gemini 분석 비용은 성공 응답을 만드는 요청에만 남긴다.
    const result = await analyzeProblemWithGemini({
      subject: subject as SubjectType,
      modelMode: modelMode as AIModelMode,
      imageBase64,
      imageMimeType,
      problemText,
      userContext,
    });
    const safeResult = JSON.parse(JSON.stringify(result)) as typeof result;

    const sessionId = randomUUID();
    const sessionRef = db.doc(`problemSessions/${sessionId}`);
    await db.runTransaction(async (transaction) => {
      transaction.set(sessionRef, {
        uid,
        subject,
        finalAnswer: safeResult.fullSolution.finalAnswer,
        twinAnswer: safeResult.twinProblem.correctAnswer,
        topic: safeResult.topic,
        source: 'new_problem',
        attemptCount: 0,
        solved: false,
        reviewRewardClaimed: false,
        createdAt: FieldValue.serverTimestamp(),
      });
      transaction.update(requestRef!, {
        status: 'completed', result: safeResult, sessionId, completedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ...safeResult, sessionId });
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
    if (apiError?.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: '크레딧이 부족해요. 지갑에서 토큰을 크레딧으로 바꾸거나 나중에 다시 이용해주세요.' }, { status: 402 });
    }
    if (apiError?.message === 'ANALYSIS_ALREADY_RUNNING' || apiError?.message === 'ANALYSIS_REQUEST_ALREADY_USED') {
      return NextResponse.json({ error: '이 분석 요청은 이미 처리 중이거나 완료됐어요. 다시 분석하려면 새 요청으로 시작해주세요.' }, { status: 409 });
    }

    if (ownsReservation && uid && requestRef && reservedCost > 0) {
      try {
        const db = getAdminFirestore();
        const walletRef = getWalletRef(uid);
        await db.runTransaction(async (transaction) => {
          const [requestSnapshot, walletSnapshot] = await Promise.all([
            transaction.get(requestRef!), transaction.get(walletRef),
          ]);
          if (requestSnapshot.data()?.status !== 'pending') return;
          const credits = Number(walletSnapshot.data()?.credits ?? 0);
          transaction.update(walletRef, { credits: credits + reservedCost, updatedAt: FieldValue.serverTimestamp() });
          transaction.set(db.doc(`users/${uid}/walletTransactions/${requestRef!.id}-refund`), {
            currency: 'credits', amount: reservedCost, reason: 'analysis_refund', referenceId: requestRef!.id,
            createdAt: FieldValue.serverTimestamp(),
          });
          transaction.update(requestRef!, { status: 'failed', failedAt: FieldValue.serverTimestamp() });
        });
      } catch (refundError) {
        console.error('Failed to refund analysis credits:', refundError);
      }
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
