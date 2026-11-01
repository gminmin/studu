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
  slashReading: string;
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

export interface VisualGuide {
  type: 'geometry' | 'graph' | 'table' | 'diagram' | 'none';
  title?: string;
  // AI가 생성한 반응형 SVG 코드 (<svg viewBox="0 0 320 200" ...>...</svg>)
  svgContent?: string;
  // 표 데이터 (물리량, 상태 변화, 수열 등)
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  caption?: string;
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
  problemBreakdown?: {
    summary: string;
    givens: Array<{ label: string; value: string }>;
    target: string;
  };
  conceptReference?: {
    name: string;
    statement: string;
    application: string;
    source?: string;
  };
  visualGuide?: VisualGuide;
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
  problemBreakdown?: StandardProblemResponse['problemBreakdown'];
  conceptReference?: StandardProblemResponse['conceptReference'];
  visualGuide?: VisualGuide;
  englishGuide?: EnglishGuide;
  scienceGuide?: ScienceGuide;
  status: 'unsolved' | 'solved_alone' | 'viewed_solution' | 'mastered';
  mistakeReason?: MistakeReason;
  createdAt: string;
  twinSolved?: boolean;
}
