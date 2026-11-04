import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore, verifyFirebaseIdToken } from '@/lib/firebase/admin';
import { ensureWallet, getWalletRef } from '@/lib/firebase/economy';
import { REWARD_RULES, WALLET_CURRENCY_VERSION } from '@/lib/economy';

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace(/^Bearer\s+/, '') || '';
    if (!token) return NextResponse.json({ error: '로그인이 필요해요.' }, { status: 401 });
    const uid = await verifyFirebaseIdToken(token);
    const { sessionId, answer, kind = 'answer' } = await req.json();
    if (typeof sessionId !== 'string' || typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json({ error: '답안과 풀이 정보를 확인해주세요.' }, { status: 400 });
    }
    if (kind !== 'answer' && kind !== 'review') {
      return NextResponse.json({ error: '풀이 유형이 올바르지 않아요.' }, { status: 400 });
    }
    await ensureWallet(uid);
    const db = getAdminFirestore();
    const sessionRef = db.doc(`problemSessions/${sessionId}`);
    const walletRef = getWalletRef(uid);
    const leaderboardRef = db.doc(`leaderboard/${uid}`);
    const result = await db.runTransaction(async (transaction) => {
      const [sessionSnapshot, walletSnapshot, leaderboardSnapshot] = await Promise.all([
        transaction.get(sessionRef), transaction.get(walletRef), transaction.get(leaderboardRef),
      ]);
      if (!sessionSnapshot.exists) throw new Error('SESSION_NOT_FOUND');
      const session = sessionSnapshot.data()!;
      if (session.uid !== uid) throw new Error('SESSION_FORBIDDEN');

      const wallet = walletSnapshot.data()!;
      const isReview = kind === 'review';
      const attemptField = isReview ? 'reviewAttemptCount' : 'attemptCount';
      const attemptCount = Number(session[attemptField] || 0);
      const claimed = isReview ? Boolean(session.reviewRewardClaimed) : Boolean(session.solved);
      if (claimed) return { correct: true, attemptCount, reward: null, wallet, duplicate: true };
      if (attemptCount >= 2) throw new Error('ATTEMPTS_EXHAUSTED');

      const nextAttempt = attemptCount + 1;
      const normalized = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, '');
      const input = normalized(answer);
      const expected = normalized(String(session.finalAnswer || ''));
      const inputNumber = Number(input);
      const expectedNumber = Number(expected);
      const correct = Boolean(expected) && (
        input === expected ||
        (Number.isFinite(inputNumber) && Number.isFinite(expectedNumber) && inputNumber === expectedNumber)
      );
      const baseWallet = {
        credits: Number(wallet.credits || 0),
        tokens: Number(wallet.tokens || 0),
        currencyVersion: Number(wallet.currencyVersion ?? WALLET_CURRENCY_VERSION),
        xp: Number(wallet.xp || 0),
        subjectXp: {
          math: Number(wallet.subjectXp?.math || 0),
          science: Number(wallet.subjectXp?.science || 0),
          english: Number(wallet.subjectXp?.english || 0),
        },
      };
      const subject = ['math', 'science', 'english'].includes(session.subject) ? session.subject as 'math' | 'science' | 'english' : 'math';
      const reward = correct
        ? isReview
          ? nextAttempt === 1 ? REWARD_RULES.wrongNoteFirstTry : REWARD_RULES.wrongNoteSecondTry
          : nextAttempt === 1 ? REWARD_RULES.firstTry : REWARD_RULES.secondTry
        : null;
      const updatedWallet = reward
        ? { ...baseWallet, credits: baseWallet.credits + reward.credits, xp: baseWallet.xp + reward.xp, subjectXp: { ...baseWallet.subjectXp, [subject]: baseWallet.subjectXp[subject] + reward.xp } }
        : baseWallet;

      transaction.update(sessionRef, {
        [attemptField]: nextAttempt,
        ...(correct ? (isReview ? { reviewRewardClaimed: true } : { solved: true }) : {}),
        updatedAt: FieldValue.serverTimestamp(),
      });
      if (reward) {
        transaction.update(walletRef, { credits: updatedWallet.credits, xp: updatedWallet.xp, subjectXp: updatedWallet.subjectXp, updatedAt: FieldValue.serverTimestamp() });
        transaction.set(db.doc(`users/${uid}/walletTransactions/${isReview ? 'review' : 'solve'}-${sessionId}`), {
          currency: 'credits', amount: reward.credits, xp: reward.xp,
          reason: isReview ? 'wrong_note_solved' : 'problem_solved', referenceId: sessionId,
          createdAt: FieldValue.serverTimestamp(),
        });
        transaction.set(leaderboardRef, {
          displayName: leaderboardSnapshot.data()?.displayName || 'tudu 학습자',
          xp: updatedWallet.xp,
          subjectXp: updatedWallet.subjectXp,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      }
      return { correct, attemptCount: nextAttempt, reward, wallet: updatedWallet, duplicate: false };
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = (error as { message?: string })?.message;
    if (message === 'SESSION_NOT_FOUND') return NextResponse.json({ error: '이 풀이 기록을 찾지 못했어요.' }, { status: 404 });
    if (message === 'SESSION_FORBIDDEN') return NextResponse.json({ error: '이 풀이 기록에 접근할 수 없어요.' }, { status: 403 });
    if (message === 'ATTEMPTS_EXHAUSTED') return NextResponse.json({ error: '이번 풀이의 기회를 모두 사용했어요.' }, { status: 409 });
    console.error('API /api/rewards error:', error);
    return NextResponse.json({ error: '보상을 처리하지 못했어요.' }, { status: 500 });
  }
}
