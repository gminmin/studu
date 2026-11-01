import { StandardProblemResponse } from '@/types/problem';
import { SubjectStrategy } from './types';

export class EnglishStrategy implements SubjectStrategy {
  subjectId = 'english' as const;
  displayName = '영어 (English)';
  iconName = 'BookOpen';
  description = '직독직해 구문 분석, 빈칸 추론, 문맥 어휘, 문법 해설';

  getSystemInstruction(): string {
    return `당신은 학생의 독해력과 어휘력을 길러주는 수능/내신 전문 영어 튜터입니다.
규칙:
1. 바로 정답을 주지 마세요.
2. 힌트 3단계:
   - 1단계(concept): 지문의 핵심 소재(주제) 및 글의 전개 방식(역접, 예시, 인과) 힌트
   - 2단계(approach): 빈칸 앞뒤 핵심 문맥 단서 및 문장 구조(구문) 접근 힌트
   - 3단계(critical): 정답으로 직결되는 결정적 단서 문장 지목
3. englishGuide 필드에:
   - slashReading: 문맥을 이해하기 쉽도록 의미 단위로 슬래시(/)를 넣은 끊어읽기 문장 제공
   - vocabulary: 지문에 나온 고난도 핵심 단어 및 뜻 목록
   - grammarPoint: 핵심 문법 사항 요약
4. twinProblem: 유사한 문법/독해 구조를 가진 새로운 짧은 변형 문제 및 정답 해설.`;
  }

  buildPrompt(userContext: string): string {
    return `제공된 이미지 또는 텍스트의 영어 문제를 분석해주세요. 정답 근거가 되는 문장/구절을 먼저 특정하고, 관련 어휘·문법 규칙과 문맥의 연결을 단계별로 설명해주세요. 보기형 문제라면 각 선택지를 판별하는 근거를 명시해주세요.
${userContext ? `추가 사용자 메모: ${userContext}` : ''}
반드시 지정된 JSON 스키마 규격으로 응답하세요.`;
  }

  parseResult(rawJson: any): StandardProblemResponse {
    return {
      subject: 'english',
      topic: rawJson.topic || '영어 독해 및 어법',
      extractedText: rawJson.extractedText || '',
      hints: Array.isArray(rawJson.hints) ? rawJson.hints : [],
      fullSolution: rawJson.fullSolution || { steps: [], finalAnswer: '' },
      problemBreakdown: rawJson.problemBreakdown,
      conceptReference: rawJson.conceptReference,
      twinProblem: rawJson.twinProblem || {
        question: '유사한 변형 문제입니다.',
        correctAnswer: '',
        explanation: '',
      },
      visualGuide: rawJson.visualGuide,
      englishGuide: rawJson.englishGuide,
    };
  }
}
