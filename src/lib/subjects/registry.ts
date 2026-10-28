import { SubjectStrategy } from './types';
import { MathStrategy } from './math';
import { EnglishStrategy } from './english';
import { ScienceStrategy } from './science';
import { SubjectType } from '@/types/problem';

export const SubjectRegistry: Record<SubjectType, SubjectStrategy> = {
  math: new MathStrategy(),
  english: new EnglishStrategy(),
  science: new ScienceStrategy(),
};

export function getSubjectStrategy(subject: SubjectType): SubjectStrategy {
  return SubjectRegistry[subject] || SubjectRegistry.math;
}
