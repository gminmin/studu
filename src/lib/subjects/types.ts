import { StandardProblemResponse, SubjectType } from '@/types/problem';

export interface SubjectStrategy {
  subjectId: SubjectType;
  displayName: string;
  iconName: string;
  description: string;
  buildPrompt(userContext: string): string;
  getSystemInstruction(): string;
  parseResult(rawJson: unknown): StandardProblemResponse;
}
