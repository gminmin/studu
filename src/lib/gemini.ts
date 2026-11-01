import { GoogleGenAI, Type } from '@google/genai';
import type { Part, Schema } from '@google/genai';
import { AIModelMode, StandardProblemResponse, SubjectType } from '@/types/problem';
import { getSubjectStrategy } from './subjects/registry';

// Gemini Structured Output Schema 정의
const problemResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: {
      type: Type.STRING,
      description: '과목 (math | english | science)'
    },
    topic: {
      type: Type.STRING,
      description: '단원 및 핵심 개념명'
    },
    extractedText: {
      type: Type.STRING,
      description: '인식된 문제 원본 텍스트'
    },
    problemBreakdown: {
      type: Type.OBJECT,
      description: '학생이 문제를 먼저 해석하도록 정리한 구조',
      properties: {
        summary: { type: Type.STRING, description: '문제가 요구하는 바를 쉬운 말로 한 문장 요약' },
        givens: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.STRING } }, required: ['label', 'value'] } },
        target: { type: Type.STRING, description: '구해야 하는 값 또는 판단' }
      },
      required: ['summary', 'givens', 'target']
    },
    conceptReference: {
      type: Type.OBJECT,
      description: '풀이에 실제로 적용할 공식, 문법 또는 과학 법칙',
      properties: {
        name: { type: Type.STRING },
        statement: { type: Type.STRING, description: '정확한 공식/규칙과 조건' },
        application: { type: Type.STRING, description: '이 문제가 해당 개념을 쓰는 이유' },
        source: { type: Type.STRING, description: '신뢰 가능한 출처명 또는 교과서 단원. 확인하지 않은 URL 금지' }
      },
      required: ['name', 'statement', 'application']
    },
    hints: {
      type: Type.ARRAY,
      description: '3단계 점진적 소크라테스식 힌트 (절대 답을 바로 주지 말 것)',
      items: {
        type: Type.OBJECT,
        properties: {
          level: { type: Type.INTEGER, description: '힌트 단계 (1: 개념, 2: 접근법, 3: 결정적 수식/단서)' },
          type: { type: Type.STRING, description: 'concept | approach | critical' },
          title: { type: Type.STRING, description: '힌트 소제목' },
          content: { type: Type.STRING, description: '힌트 상세 내용 (LaTeX 수식 포함 가능)' }
        },
        required: ['level', 'type', 'content']
      }
    },
    fullSolution: {
      type: Type.OBJECT,
      description: '단계별 정밀 풀이 및 최종 정답',
      properties: {
        steps: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              stepNumber: { type: Type.INTEGER },
              title: { type: Type.STRING },
              detail: { type: Type.STRING },
              formula: { type: Type.STRING }
            },
            required: ['stepNumber', 'title', 'detail']
          }
        },
        finalAnswer: {
          type: Type.STRING,
          description: '최종 단답형 정답 (숫자, 기호 또는 짧은 텍스트)'
        }
      },
      required: ['steps', 'finalAnswer']
    },
    twinProblem: {
      type: Type.OBJECT,
      description: '동일한 풀이 알고리즘과 논리를 가지되 수치나 조건만 바꾼 쌍둥이 변형 문제',
      properties: {
        question: { type: Type.STRING, description: '변형 문제 지문' },
        correctAnswer: { type: Type.STRING, description: '변형 문제의 정답' },
        explanation: { type: Type.STRING, description: '변형 문제의 풀이 및 해설' },
        formula: { type: Type.STRING, description: '주요 수식' }
      },
      required: ['question', 'correctAnswer', 'explanation']
    },
    visualGuide: {
      type: Type.OBJECT,
      description: '수학 기하 도형, 함수 좌표 그래프, 과학 실험 표/다이어그램 시각 자료',
      properties: {
        type: { type: Type.STRING, description: 'geometry | graph | table | diagram | none' },
        title: { type: Type.STRING, description: '시각 자료 제목' },
        svgContent: {
          type: Type.STRING,
          description: '완전한 SVG 코드 (예: <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">...도형 및 수치 라벨...</svg>). 기하나 그래프 문제일 때 권장'
        },
        tableData: {
          type: Type.OBJECT,
          description: '표 데이터',
          properties: {
            headers: { type: Type.ARRAY, items: { type: Type.STRING } },
            rows: { type: Type.ARRAY, items: { type: Type.ARRAY, items: { type: Type.STRING } } }
          }
        },
        caption: { type: Type.STRING, description: '시각 자료에 대한 1줄 설명' }
      }
    },
    englishGuide: {
      type: Type.OBJECT,
      description: '영어 과목 전용 가이드',
      properties: {
        slashReading: { type: Type.STRING, description: '슬래시(/)를 넣은 직독직해 문장' },
        vocabulary: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              meaning: { type: Type.STRING }
            },
            required: ['word', 'meaning']
          }
        },
        grammarPoint: { type: Type.STRING }
      }
    },
    scienceGuide: {
      type: Type.OBJECT,
      description: '과학 과목 전용 가이드',
      properties: {
        variables: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              label: { type: Type.STRING },
              value: { type: Type.STRING }
            },
            required: ['symbol', 'label', 'value']
          }
        },
        appliedLaw: { type: Type.STRING },
        corePrinciple: { type: Type.STRING }
      }
    }
  },
  required: ['subject', 'topic', 'extractedText', 'problemBreakdown', 'conceptReference', 'hints', 'fullSolution', 'twinProblem']
};

export async function analyzeProblemWithGemini(params: {
  subject: SubjectType;
  modelMode: AIModelMode;
  imageBase64?: string;
  imageMimeType?: string;
  problemText?: string;
  userContext?: string;
}): Promise<StandardProblemResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });
  const strategy = getSubjectStrategy(params.subject);

  // 무료 티어 RPM 절약을 위해 가장 가볍고 할당량이 넉넉한 gemini-flash-lite-latest 사용
  const targetModel = 'gemini-flash-lite-latest';

  const parts: Part[] = [];

  // 이미지 첨부 시
  if (params.imageBase64 && params.imageMimeType) {
    const cleanBase64 = params.imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: params.imageMimeType || 'image/jpeg',
      },
    });
  }

  // 텍스트 프롬프트
  let promptText = `${strategy.buildPrompt(params.userContext || '')}

학습 설계 지침:
- 학습자가 정답을 보기 전에 문제를 자기 말로 파악하도록 problemBreakdown에 핵심 요약, 주어진 조건(givens), 구할 것(target)을 분리해 적으세요.
- conceptReference에는 문제 해결에 필요한 정확한 공식·문법·법칙 하나 이상을 이름, 성립 조건이 포함된 원문 진술, 이 문제에 적용하는 이유로 작성하세요. 과목에 맞는 교육과정 수준 표현을 사용하세요.
- 출처가 검증되지 않았으면 URL이나 책 쪽수를 꾸며내지 마세요. 교과서 단원이나 잘 알려진 규칙명처럼 확실한 범위만 source에 쓰세요.
- 힌트는 점진적으로 제공하며 첫 힌트에서 정답/계산 결과를 노출하지 마세요. 전체 풀이의 각 단계는 직전 단계에서 다음 단계로 가는 이유를 설명하고, 수학/과학은 대입부터 계산까지 식을 빠뜨리지 마세요.
- 모든 수식은 KaTeX 호환 LaTeX로 작성하고, 문장 안 수식은 반드시 $...$로 감싸세요. 특히 함수 합성은 $(g \\circ f)(x)$ 형식으로 정확히 표기하세요. SVG 내부 텍스트 라벨에는 LaTeX 명령을 넣지 말고 기호를 직접 쓰세요.
- 필요한 경우에만 visualGuide의 SVG 또는 표를 만드세요. 웹 사진 URL을 추측해서 만들지 마세요.
`;
  if (params.problemText) {
    promptText += `\n\n[사용자가 입력한 문제 텍스트]:\n${params.problemText}`;
  }
  parts.push({ text: promptText });

  const generateConfig = {
    systemInstruction: strategy.getSystemInstruction(),
    responseMimeType: 'application/json',
    responseSchema: problemResponseSchema,
    temperature: 0.2,
  };

  try {
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: parts,
      config: generateConfig,
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Gemini로부터 응답을 받지 못했습니다.');
    }

    const rawJson = JSON.parse(responseText);
    return strategy.parseResult(rawJson);
  } catch (error: unknown) {
    const apiError = error as { status?: number; code?: number; message?: string };
    console.error(`[Gemini API Error] model=${targetModel}:`, apiError?.message || error);
    // RPM 및 쿼터 에러 감지
    if (
      apiError?.status === 429 ||
      apiError?.code === 429 ||
      apiError?.message?.includes('RESOURCE_EXHAUSTED') ||
      apiError?.message?.includes('quota') ||
      apiError?.message?.includes('high demand') ||
      apiError?.status === 503
    ) {
      throw new Error(
        '무료 API 키의 1분당 요청 한도(RPM)에 도달했습니다. 약 15~30초 후에 다시 보내기(↑) 버튼을 눌러주세요.'
      );
    }
    throw error;
  }
}
