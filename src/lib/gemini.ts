import { GoogleGenAI, Type, Schema } from '@google/genai';
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
  required: ['subject', 'topic', 'extractedText', 'hints', 'fullSolution', 'twinProblem']
};

export async function analyzeProblemWithGemini(params: {
  subject: SubjectType;
  modelMode: AIModelMode;
  imageBase64?: string;
  imageMimeType?: string;
  problemText?: string;
  userContext?: string;
  customApiKey?: string;
}): Promise<StandardProblemResponse> {
  const apiKey = params.customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY_MISSING');
  }

  const ai = new GoogleGenAI({ apiKey });
  const strategy = getSubjectStrategy(params.subject);

  // 무료 티어 RPM 절약을 위해 가장 가볍고 할당량이 넉넉한 gemini-flash-lite-latest 사용
  const targetModel = 'gemini-flash-lite-latest';

  const parts: any[] = [];

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
  let promptText = strategy.buildPrompt(params.userContext || '');
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
  } catch (error: any) {
    console.error(`[Gemini API Error] model=${targetModel}:`, error?.message || error);
    // RPM 및 쿼터 에러 감지
    if (
      error?.status === 429 ||
      error?.code === 429 ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('quota') ||
      error?.message?.includes('high demand') ||
      error?.status === 503
    ) {
      throw new Error(
        '무료 API 키의 1분당 요청 한도(RPM)에 도달했습니다. 약 15~30초 후에 다시 보내기(↑) 버튼을 눌러주세요.'
      );
    }
    throw error;
  }
}
