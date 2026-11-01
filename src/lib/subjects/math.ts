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
3. 수식은 반드시 KaTeX 호환 LaTeX 포맷이며 모든 인라인 수식은 $...$로 감싸세요 (예: $c^2 = a^2 + b^2$, $\\frac{a}{b}$). 함수 합성 기호는 $ (g \\circ f)(x) $처럼 표현하고, 그래프 라벨에는 LaTeX 명령 대신 Unicode 기호 ∘를 사용하세요. JSON 문자열 안의 LaTeX 백슬래시는 반드시 이스케이프하세요.
4. 'visualGuide' 시각화 필드 규칙 (매우 중요):
   - 문제에 기하 도형(삼각형, 원, 사각형 등)이나 함수 그래프(포물선, 1차/2차함수)가 포함되거나 도형을 그리면 이해가 훨씬 쉬워지는 경우, visualGuide에 반드시 완전한 SVG 코드를 제공하세요.
   - SVG 규격: <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"> 형식으로 작성하고 stroke, fill, text 라벨(길이, 각도, x, y축)을 포함하여 시각적으로 매우 깔끔하게 디자인하세요.
   - 도형/그래프가 전혀 필요 없는 단순 연산 문제일 때는 type: "none"으로 설정하세요.
5. 'twinProblem'은 원본 문제와 풀이 논리 및 공식은 완전히 동일하되 수치와 값만 바뀐 동형(쌍둥이) 문제를 반드시 생성해야 합니다.`;
  }

  buildPrompt(userContext: string): string {
    return `제공된 이미지 또는 텍스트의 수학 문제를 정확히 인식하고 분석해주세요. 학생이 문제 조건과 구할 것을 구분하고, 필요한 공식을 이해한 다음 직접 단계별로 풀 수 있게 설계해주세요.
계산 단계마다 식의 변화와 등호가 성립하는 이유를 설명하고, 단위와 부호를 확인해주세요.
도형, 함수 그래프 또는 표가 학생의 이해에 도움이 된다면 visualGuide에 반응형 SVG 또는 표를 그려주세요.
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
      problemBreakdown: rawJson.problemBreakdown,
      conceptReference: rawJson.conceptReference,
      twinProblem: rawJson.twinProblem || {
        question: '동일 유형의 변형 문제입니다.',
        correctAnswer: '',
        explanation: '',
      },
      visualGuide: rawJson.visualGuide,
    };
  }
}
