import { SubjectType } from '@/types/problem';

export const SUBJECT_THEME: Record<SubjectType, { color: string; foreground: string }> = {
  science: { color: '#FAAA00', foreground: '#111827' },
  math: { color: '#F66C89', foreground: '#111827' },
  english: { color: '#006ECF', foreground: '#FFFFFF' },
};
