import 'server-only';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from './admin';
import { STARTING_TOKENS, WALLET_CURRENCY_VERSION, type Wallet } from '@/lib/economy';

export function getWalletRef(uid: string) {
  return getAdminFirestore().doc(`users/${uid}/wallet/main`);
}

export function getWalletTransactionRef(uid: string, id: string) {
  return getAdminFirestore().doc(`users/${uid}/walletTransactions/${id}`);
}

export async function ensureWallet(uid: string): Promise<Wallet> {
  const db = getAdminFirestore();
  const walletRef = getWalletRef(uid);
  const leaderboardRef = db.doc(`leaderboard/${uid}`);
  const user = await getAdminAuth().getUser(uid);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(walletRef);
    const storedWallet = snapshot.data();
    const storedCurrencyVersion = Number(storedWallet?.currencyVersion ?? 1);
    const isLegacyWallet = snapshot.exists && (
      !Number.isFinite(storedCurrencyVersion) || storedCurrencyVersion < WALLET_CURRENCY_VERSION
    );
    const wallet: Wallet = {
      credits: snapshot.exists
        ? Number((isLegacyWallet ? storedWallet?.tokens : storedWallet?.credits) ?? 0)
        : 0,
      tokens: snapshot.exists
        ? Number((isLegacyWallet ? storedWallet?.credits : storedWallet?.tokens) ?? 0)
        : STARTING_TOKENS,
      currencyVersion: WALLET_CURRENCY_VERSION,
      xp: Number(storedWallet?.xp ?? 0),
      subjectXp: {
        math: Number(storedWallet?.subjectXp?.math ?? 0),
        science: Number(storedWallet?.subjectXp?.science ?? 0),
        english: Number(storedWallet?.subjectXp?.english ?? 0),
      },
    };
    if (!snapshot.exists) {
      transaction.set(walletRef, { ...wallet, createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      transaction.set(getWalletTransactionRef(uid, 'welcome-tokens'), {
        currency: 'tokens', amount: STARTING_TOKENS, reason: 'welcome_grant',
        createdAt: FieldValue.serverTimestamp(),
      });
    } else if (
      isLegacyWallet ||
      storedWallet?.credits === undefined ||
      storedWallet?.tokens === undefined ||
      storedWallet?.xp === undefined ||
      storedWallet?.subjectXp === undefined
    ) {
      transaction.set(walletRef, { ...wallet, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    transaction.set(leaderboardRef, {
      displayName: user.displayName || 'tudu 학습자',
      xp: wallet.xp,
      subjectXp: wallet.subjectXp,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return wallet;
  });
}

export function normalizeAnswer(answer: string): string {
  return answer.trim().toLocaleLowerCase().replace(/\s+/g, '');
}

export function answersMatch(input: string, expected: string): boolean {
  const normalizedInput = normalizeAnswer(input);
  const normalizedExpected = normalizeAnswer(expected);
  if (!normalizedInput || !normalizedExpected) return false;
  if (normalizedInput === normalizedExpected) return true;
  const inputNumber = Number(normalizedInput);
  const expectedNumber = Number(normalizedExpected);
  return Number.isFinite(inputNumber) && Number.isFinite(expectedNumber) && inputNumber === expectedNumber;
}
