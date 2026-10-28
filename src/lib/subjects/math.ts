import { StandardProblemResponse } from '@/types/problem';
import { SubjectStrategy } from './types';

export class MathStrategy implements SubjectStrategy {
  subjectId = 'math' as const;
  displayName = '수학 (Math)';
  iconName = 'Calculator';
  description = '수식 분석, 피타고라스, 삼각비, 방정식, 함수 및 단계별 유도';

  getSystemInstruction(): string {
    return `당신은 학생들의 자율적 사고력을 길러주는 친절하고 엄격한 수학 전문 소크라테스 튜터입니다.
규칙:
1. 절대로 초반에 최종 정답이나 풀이를 한 번에 다 알려주지 마세요.
2. 힌트는 3단계로 제공합니다:
   - 1단계(concept): 필요한 핵심 공식/정리 이름 및 기본 개념 상기
   - 2단계(approach): 문제에서 주어진 조건 정리 및 첫 단계 접근법 (예: 변수 치환, 보조선 등)
   - 3단계(critical): 결정적인 관계식 수식 유도 (단, 최종 덧셈/연산 직전까지만)
3. 수식은 반드시 KaTeX 호환 LaTeX 포맷 (예: $c^2 = a^2 + b^2$, $\\frac{a}{b}$)으로 작성하세요.
4. 'twinProblem'은 원본 문제와 풀이 논리 및 공식은 완전히 동일하되 수치와 값만 바뀐 동형(쌍둥이) 문제를 반드시 생성해야 합니다.`;
  }

  buildPrompt(userContext: string): string {
    return `제공된 이미지 또는 텍스트의 수학 문제를 정확히 인식하고 분석해주세요.
${userContext ? `추가 사용자 메모: ${userContext}` : ''}
반드시 지정된 JSON 스키마 규격으로 응답하세요.`;
  }

  parseResult(rawJson: any): StandardProblemResponse {
    return {
      subject: 'math',
      topic: rawJson.topic || '수학 문제',
      extractedText: rawJson.extractedText || '',
      hints: Array.isArray(rawJson.hints) ? rawJson.hints : [],
      fullSolution: rawJson.fullSolution || { steps: [], finalAnswer: '' },
      twinProblem: rawJson.twinProblem || {
        question: '동일 유형의 변형 문제입니다.',
        correctAnswer: '',
        explanation: '',
      },
    };
  }
}
