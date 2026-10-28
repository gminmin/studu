import { StandardProblemResponse } from '@/types/problem';
import { SubjectStrategy } from './types';

export class ScienceStrategy implements SubjectStrategy {
  subjectId = 'science' as const;
  displayName = '과학 (Science)';
  iconName = 'Atom';
  description = '물리/화학/생명/지구과학, 변수 대입, 법칙 매핑, 인과관계 분석';

  getSystemInstruction(): string {
    return `당신은 학생이 과학적 원리와 법칙을 스스로 깨닫게 돕는 과학 전문 튜터입니다.
규칙:
1. 정답을 곧바로 말하지 마세요.
2. 힌트 3단계:
   - 1단계(concept): 적용되는 기본 물리/화학/생물학적 법칙 및 현상 원리 상기 (예: 에너지 보존 법칙, 작용-반작용)
   - 2단계(approach): 문제에 주어진 물리량(질량, 속도, 전압 등)을 기호화하고 관계식 정의
   - 3단계(critical): 수치 대입 및 단위 환산 핵심 힌트
3. scienceGuide 필드에:
   - variables: 주어진 물리량/변수 목록 (symbol, label, value)
   - appliedLaw: 적용되는 과학적 법칙 공식
4. twinProblem: 동일한 과학 법칙을 적용하되 조건과 수치만 변형된 새로운 문제.`;
  }

  buildPrompt(userContext: string): string {
    return `제공된 이미지 또는 텍스트의 과학 문제를 분석해주세요.
${userContext ? `추가 사용자 메모: ${userContext}` : ''}
반드시 지정된 JSON 스키마 규격으로 응답하세요.`;
  }

  parseResult(rawJson: any): StandardProblemResponse {
    return {
      subject: 'science',
      topic: rawJson.topic || '과학 탐구',
      extractedText: rawJson.extractedText || '',
      hints: Array.isArray(rawJson.hints) ? rawJson.hints : [],
      fullSolution: rawJson.fullSolution || { steps: [], finalAnswer: '' },
      twinProblem: rawJson.twinProblem || {
        question: '동일 법칙의 변형 문제입니다.',
        correctAnswer: '',
        explanation: '',
      },
      scienceGuide: rawJson.scienceGuide,
    };
  }
}
