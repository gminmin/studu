import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { ensureWallet, getWalletRef, getWalletTransactionRef } from '@/lib/firebase/economy';
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
    const { transactionId, credits = 1 } = await req.json();
    if (typeof transactionId !== 'string' || !/^[a-zA-Z0-9_-]{12,80}$/.test(transactionId)) {
      return NextResponse.json({ error: '환전 요청을 다시 시도해주세요.' }, { status: 400 });
    }
    if (!Number.isInteger(credits) || credits < 1 || credits > 5) {
      return NextResponse.json({ error: '한 번에 1~5크레딧까지 환전할 수 있어요.' }, { status: 400 });
    }
    await ensureWallet(uid);
    const db = getAdminFirestore();
    const walletRef = getWalletRef(uid);
    const txRef = getWalletTransactionRef(uid, `exchange-${transactionId}`);
    const exchanged = await db.runTransaction(async (transaction) => {
      const [walletSnapshot, previousSnapshot] = await Promise.all([
        transaction.get(walletRef), transaction.get(txRef),
      ]);
      if (previousSnapshot.exists) return walletSnapshot.data();
      const wallet = walletSnapshot.data()!;
      const tokenCost = credits * 20;
      if (Number(wallet.tokens || 0) < tokenCost) throw new Error('INSUFFICIENT_TOKENS');
      const nextWallet = { ...wallet, tokens: Number(wallet.tokens || 0) - tokenCost, credits: Number(wallet.credits || 0) + credits };
      transaction.update(walletRef, { ...nextWallet, updatedAt: FieldValue.serverTimestamp() });
      transaction.set(txRef, {
        currency: 'exchange', amount: credits, tokenAmount: -tokenCost, reason: 'token_to_credit_exchange',
        createdAt: FieldValue.serverTimestamp(),
      });
      return nextWallet;
    });
    return NextResponse.json({ wallet: exchanged });
  } catch (error) {
    if ((error as Error)?.message === 'INSUFFICIENT_TOKENS') {
      return NextResponse.json({ error: '환전할 토큰이 부족해요.' }, { status: 409 });
    }
    if ((error as Error)?.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    }
    console.error('API /api/economy POST error:', error);
    return NextResponse.json({ error: '환전을 처리하지 못했어요.' }, { status: 500 });
  }
}
