export type SubjectType = 'math' | 'english' | 'science';

export type AIModelMode = 'speed' | 'deep';

export interface HintItem {
  level: 1 | 2 | 3;
  type: 'concept' | 'approach' | 'critical';
  title?: string;
  content: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  detail: string;
  formula?: string;
}

export interface EnglishGuide {
  slashReading: string; // "Because the weather was cold, / she wore a thick jacket / to stay warm."
  vocabulary: Array<{
    word: string;
    meaning: string;
    context?: string;
  }>;
  grammarPoint?: string;
}

export interface ScienceGuide {
  variables: Array<{
    symbol: string;
    label: string;
    value: string;
  }>;
  appliedLaw: string;
  corePrinciple?: string;
}

export interface TwinProblem {
  question: string;
  correctAnswer: string;
  explanation: string;
  formula?: string;
}

export interface StandardProblemResponse {
  subject: SubjectType;
  topic: string;
  extractedText: string;
  hints: HintItem[];
  fullSolution: {
    steps: SolutionStep[];
    finalAnswer: string;
  };
  twinProblem: TwinProblem;
  englishGuide?: EnglishGuide;
  scienceGuide?: ScienceGuide;
}

export type MistakeReason = 'calculation' | 'concept' | 'reading' | 'time' | 'other';

export interface WrongNoteItem {
  id: string;
  subject: SubjectType;
  topic: string;
  extractedText: string;
  imageUrl?: string;
  hints: HintItem[];
  fullSolution: {
    steps: SolutionStep[];
    finalAnswer: string;
  };
  twinProblem: TwinProblem;
  englishGuide?: EnglishGuide;
  scienceGuide?: ScienceGuide;
  status: 'unsolved' | 'solved_alone' | 'viewed_solution' | 'mastered';
  mistakeReason?: MistakeReason;
  createdAt: string;
  twinSolved?: boolean;
}
