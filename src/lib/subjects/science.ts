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
3. 'visualGuide' 시각화 필드 규칙:
   - 물리 운동/힘(FBD, 물체-경사면, 회로도 등)이나 시간-속도 그래프, 또는 실험 데이터 표가 유용한 경우 visualGuide에 반응형 SVG나 tableData를 반드시 포함하세요.
   - SVG 규격: <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg"> 형식으로 물체, 화살표(힘, 속도), 축, 수치 등을 명확히 시각화하세요.
4. scienceGuide 필드에:
   - variables: 주어진 물리량/변수 목록 (symbol, label, value)
   - appliedLaw: 적용되는 과학적 법칙 공식
5. twinProblem: 동일한 과학 법칙을 적용하되 조건과 수치만 변형된 새로운 문제.`;
  }

  buildPrompt(userContext: string): string {
    return `제공된 이미지 또는 텍스트의 과학 문제를 분석해주세요. 주어진 물리량/조건과 구할 값을 정리하고 적용할 법칙의 성립 조건을 먼저 명시한 후, 단위 변환·대입·계산·단위 확인을 단계별로 구성해주세요.
물리 역학 다이어그램, 그래프, 또는 데이터 표가 문제 이해에 필요하다면 visualGuide에 제공하세요.
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
      problemBreakdown: rawJson.problemBreakdown,
      conceptReference: rawJson.conceptReference,
      twinProblem: rawJson.twinProblem || {
        question: '동일 법칙의 변형 문제입니다.',
        correctAnswer: '',
        explanation: '',
      },
      visualGuide: rawJson.visualGuide,
      scienceGuide: rawJson.scienceGuide,
    };
  }
}
