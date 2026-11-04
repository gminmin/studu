export const STARTING_TOKENS = 10;
export const WALLET_CURRENCY_VERSION = 2;
export const CREDITS_PER_TOKEN = 20;
export const TOKEN_COST_BY_MODE = {
  speed: 2,
  deep: 5,
} as const;

export const REWARD_RULES = {
  firstTry: { credits: 10, xp: 20 },
  secondTry: { credits: 6, xp: 12 },
  wrongNoteFirstTry: { credits: 12, xp: 24 },
  wrongNoteSecondTry: { credits: 8, xp: 16 },
} as const;

export interface Wallet {
  credits: number;
  tokens: number;
  currencyVersion: number;
  xp: number;
  subjectXp: Record<'math' | 'science' | 'english', number>;
}
