import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { ensureWallet, getWalletRef, getWalletTransactionRef } from '@/lib/firebase/economy';
import { CREDITS_PER_TOKEN } from '@/lib/economy';
import type { SubjectType } from '@/types/problem';

async function authenticatedUid(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) throw new Error('UNAUTHORIZED');
  return verifyFirebaseIdToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const uid = await authenticatedUid(req);
    const wallet = await ensureWallet(uid);
    const requestedSubject = req.nextUrl.searchParams.get('subject');
    const subject: SubjectType = ['math', 'science', 'english'].includes(requestedSubject || '') ? requestedSubject as SubjectType : 'math';
    const subjectXpField = `subjectXp.${subject}`;
    const db = getAdminFirestore();
    const [leadersSnapshot, transactionsSnapshot, higherXpCount, higherOverallXpCount] = await Promise.all([
      db.collection('leaderboard').orderBy(subjectXpField, 'desc').limit(10).get(),
      db.collection(`users/${uid}/walletTransactions`).orderBy('createdAt', 'desc').limit(8).get(),
      db.collection('leaderboard').where(subjectXpField, '>', wallet.subjectXp[subject]).count().get(),
      db.collection('leaderboard').where('xp', '>', wallet.xp).count().get(),
    ]);
    const leaders = leadersSnapshot.docs.map((doc, index) => ({
      uid: doc.id,
      rank: index + 1,
      displayName: doc.data().displayName || 'tudu 학습자',
      xp: Number(doc.get(subjectXpField) || 0),
      isMe: doc.id === uid,
    }));
    const myRank = higherXpCount.data().count + 1;
    return NextResponse.json({
      wallet,
      leaders,
      rank: myRank,
      overallRank: higherOverallXpCount.data().count + 1,
      transactions: transactionsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    });
  } catch (error) {
    const code = (error as { code?: string; message?: string })?.code;
    if (code === 'auth/invalid-credential' || (error as Error)?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    }
    const message = (error as { message?: string })?.message || '';
    if (code === 'app/invalid-credential' || code === 'app/no-app') {
      return NextResponse.json({ error: '서버 Firebase Admin 인증이 실패했어요. Vercel Production의 서비스 계정 변수를 확인해주세요.' }, { status: 503 });
    }
    if (message.includes('FIREBASE_ADMIN_') || message.includes('Could not load the default credentials')) {
      return NextResponse.json({ error: '서버 Firebase Admin 인증 설정을 확인해주세요. Vercel의 Production 환경 변수와 함수 로그를 확인해야 합니다.' }, { status: 503 });
    }
    if (String(code) === '7' || code === 'permission-denied') {
      return NextResponse.json({ error: '서버 계정의 Firestore 권한이 부족해요. Firebase 서비스 계정 권한을 확인해주세요.' }, { status: 503 });
    }
    console.error('API /api/economy GET error:', error);
    return NextResponse.json({ error: '지갑 정보를 불러오지 못했어요.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await authenticatedUid(req);
    const { transactionId, tokens = 1 } = await req.json();
    if (typeof transactionId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(transactionId)) {
      return NextResponse.json({ error: '토큰 구매를 다시 시도해주세요.' }, { status: 400 });
    }
    if (!Number.isInteger(tokens) || tokens < 1 || tokens > 5) {
      return NextResponse.json({ error: '한 번에 1~5토큰까지 구매할 수 있어요.' }, { status: 400 });
    }
    await ensureWallet(uid);
    const db = getAdminFirestore();
    const walletRef = getWalletRef(uid);
    const txRef = getWalletTransactionRef(uid, `exchange-${transactionId}`);
    const purchased = await db.runTransaction(async (transaction) => {
      const [walletSnapshot, previousSnapshot] = await Promise.all([
        transaction.get(walletRef), transaction.get(txRef),
      ]);
      if (previousSnapshot.exists) return walletSnapshot.data();
      const wallet = walletSnapshot.data()!;
      const creditCost = tokens * CREDITS_PER_TOKEN;
      if (Number(wallet.credits || 0) < creditCost) throw new Error('INSUFFICIENT_CREDITS');
      const nextWallet = { ...wallet, credits: Number(wallet.credits || 0) - creditCost, tokens: Number(wallet.tokens || 0) + tokens };
      transaction.update(walletRef, { ...nextWallet, updatedAt: FieldValue.serverTimestamp() });
      transaction.set(txRef, {
        currency: 'exchange', amount: tokens, creditAmount: -creditCost, reason: 'credit_to_token_exchange',
        createdAt: FieldValue.serverTimestamp(),
      });
      return nextWallet;
    });
    return NextResponse.json({ wallet: purchased });
  } catch (error) {
    if ((error as Error)?.message === 'INSUFFICIENT_CREDITS') {
      return NextResponse.json({ error: 'AI 토큰 구매에 필요한 크레딧이 부족해요.' }, { status: 409 });
    }
    if ((error as Error)?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    }
    console.error('API /api/economy POST error:', error);
    return NextResponse.json({ error: 'AI 토큰을 구매하지 못했어요.' }, { status: 500 });
  }
}
