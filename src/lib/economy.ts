export const STARTING_CREDITS = 10;
export const CREDIT_COST_BY_MODE = {
  speed: 2,
  deep: 5,
} as const;

export const REWARD_RULES = {
  firstTry: { tokens: 10, xp: 20 },
  secondTry: { tokens: 6, xp: 12 },
  wrongNoteFirstTry: { tokens: 12, xp: 24 },
  wrongNoteSecondTry: { tokens: 8, xp: 16 },
} as const;

export interface Wallet {
  credits: number;
  tokens: number;
  xp: number;
  subjectXp: Record<'math' | 'science' | 'english', number>;
}
