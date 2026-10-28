import { StandardProblemResponse, SubjectType } from '@/types/problem';

export interface SampleProblemItem {
  id: string;
  subject: SubjectType;
  title: string;
  description: string;
  imageUrl?: string;
  sampleInputText: string;
  response: StandardProblemResponse;
}

export const SAMPLE_PROBLEMS: SampleProblemItem[] = [
  {
    id: 'sample-math-1',
    subject: 'math',
    title: '📐 [수학] 직각삼각형 빗변과 피타고라스 정리',
    description: '밑변과 높이가 주어졌을 때 빗변 길이를 구하는 문제',
    sampleInputText: '밑변의 길이가 3cm이고 높이가 4cm인 직각삼각형 ABC가 있다. 빗변 AC의 길이를 구하시오.',
    response: {
      subject: 'math',
      topic: '중등 기하 - 피타고라스 정리',
      extractedText: '밑변의 길이가 3cm이고 높이가 4cm인 직각삼각형 ABC가 있다. 빗변 AC의 길이를 구하시오.',
      hints: [
        {
          level: 1,
          type: 'concept',
          title: '핵심 공식 떠올리기',
          content: '직각삼각형의 세 변 사이의 관계를 나타내는 가장 유명한 정리는 무엇일까요? $c^2 = a^2 + b^2$ 공식을 떠올려 보세요.'
        },
        {
          level: 2,
          type: 'approach',
          title: '조건 대입하기',
          content: '밑변 $a = 3$, 높이 $b = 4$를 피타고라스 공식에 대입해 보세요. $c^2 = 3^2 + 4^2$가 됩니다.'
        },
        {
          level: 3,
          type: 'critical',
          title: '제곱수 계산',
          content: '$3^2 = 9$이고 $4^2 = 16$이므로, $c^2 = 9 + 16 = 25$가 됩니다. 어떤 양수를 제곱해야 25가 될까요?'
        }
      ],
      fullSolution: {
        steps: [
          {
            stepNumber: 1,
            title: '직각삼각형 조건 정리',
            detail: '직각을 낀 두 변의 길이가 각각 $a = 3\\text{cm}$, $b = 4\\text{cm}$입니다.',
            formula: 'a = 3,\\quad b = 4'
          },
          {
            stepNumber: 2,
            title: '피타고라스 정리 적용',
            detail: '빗변의 길이를 $c$라 하면, $c^2 = a^2 + b^2$이 성립합니다.',
            formula: 'c^2 = 3^2 + 4^2 = 9 + 16 = 25'
          },
          {
            stepNumber: 3,
            title: '빗변 길이 도출',
            detail: '길이는 항상 양수이므로 $c = \\sqrt{25} = 5$입니다.',
            formula: 'c = 5\\text{ (cm)}'
          }
        ],
        finalAnswer: '5'
      },
      twinProblem: {
        question: '밑변의 길이가 6cm이고 높이가 8cm인 직각삼각형의 빗변 길이는 몇 cm일까요?',
        correctAnswer: '10',
        explanation: '피타고라스 정리에 의해 $c^2 = 6^2 + 8^2 = 36 + 64 = 100$입니다. 따라서 빗변의 길이는 $\\sqrt{100} = 10\\text{cm}$입니다.',
        formula: 'c^2 = 6^2 + 8^2 = 100 \\implies c = 10'
      }
    }
  },
  {
    id: 'sample-english-1',
    subject: 'english',
    title: '📖 [영어] 역접 연결사 및 빈칸 문맥 추론',
    description: '반대 연결사 However를 활용한 문맥 반전 추론 문제',
    sampleInputText: 'Many people believe that technology always makes communication easier. However, excessive use of digital devices often creates emotional _________ between family members.',
    response: {
      subject: 'english',
      topic: '수능/내신 영어 - 빈칸 문맥 추론',
      extractedText: 'Many people believe that technology always makes communication easier. However, excessive use of digital devices often creates emotional _________ between family members.\n[보기: 1. distance  2. intimacy  3. connection  4. support]',
      hints: [
        {
          level: 1,
          type: 'concept',
          title: '글의 전개 구조 파악',
          content: '첫 문장의 통념("기술은 소통을 쉽게 해준다") 뒤에 등장하는 연결사 **However(그러나)**에 주목해 보세요. 긍정에서 부정으로 논조가 바뀝니다.'
        },
        {
          level: 2,
          type: 'approach',
          title: '부정적 뉘앙스 단어 포착',
          content: '"excessive use(지나친 사용)"라는 부정적 원인이 가져올 결과를 상상해 보세요. 가족 간에 감정적인 무엇이 생길까요?'
        },
        {
          level: 3,
          type: 'critical',
          title: '핵심 어휘 대조',
          content: 'intimacy(친밀함)나 connection(연결)과 정반대되는, "거리감, 소외감"을 뜻하는 단어는 1번 distance 입니다.'
        }
      ],
      fullSolution: {
        steps: [
          {
            stepNumber: 1,
            title: '전반부 통념 분석',
            detail: '"많은 이들은 기술이 언제나 소통을 더 쉽게 만든다고 믿는다." (긍정적 시각 제시)'
          },
          {
            stepNumber: 2,
            title: 'However를 통한 반전 포착',
            detail: '그러나 뒤에 "과도한 디지털 기기 사용"이 나오므로 긍정적 효과가 아닌 부작용(소외/거리감)이 와야 합니다.'
          },
          {
            stepNumber: 3,
            title: '정답 도출',
            detail: '빈칸에는 emotional distance(정서적 거리감/단절)가 들어가야 자연스럽습니다.'
          }
        ],
        finalAnswer: '1'
      },
      englishGuide: {
        slashReading: 'Many people believe / that technology always makes communication easier. / However, / excessive use of digital devices / often creates emotional distance / between family members.',
        vocabulary: [
          { word: 'excessive', meaning: '과도한, 지나친' },
          { word: 'emotional distance', meaning: '정서적 거리감' },
          { word: 'intimacy', meaning: '친밀함, 절친함' }
        ],
        grammarPoint: 'However(역접 부사)를 기준으로 앞문장의 통념과 뒷문장의 문제점 제시 대조 구조'
      },
      twinProblem: {
        question: 'Exercise is generally known to improve energy. However, _________ workouts without enough rest can lead to extreme fatigue.\n[보기: 1. moderate  2. excessive  3. regular  4. gentle]',
        correctAnswer: '2',
        explanation: 'However 뒷부분에서 "충분한 휴식 없는 지나친(excessive) 운동은 극심한 피로를 부른다"가 성립해야 하므로 excessive(과도한)가 정답입니다.'
      }
    }
  },
  {
    id: 'sample-science-1',
    subject: 'science',
    title: '⚡ [과학] 역학적 에너지 보존과 운동에너지 공식',
    description: '물체의 질량과 속도로부터 운동에너지를 계산하는 물리 문제',
    sampleInputText: '질량이 2kg인 물체가 수평면 위를 3m/s의 일정한 속력으로 직선 운동하고 있다. 이 물체의 운동에너지(Ek)를 구하시오.',
    response: {
      subject: 'science',
      topic: '물리학 - 운동 에너지($E_k$)와 일',
      extractedText: '질량이 2kg인 물체가 수평면 위를 3m/s의 일정한 속력으로 직선 운동하고 있다. 이 물체의 운동에너지(Ek)를 구하시오.',
      hints: [
        {
          level: 1,
          type: 'concept',
          title: '운동에너지 기본 공식',
          content: '질량 $m$과 속력 $v$를 가진 물체의 운동에너지 공식 $E_k = \\frac{1}{2}mv^2$을 상기해 보세요.'
        },
        {
          level: 2,
          type: 'approach',
          title: '주어진 물리량 기호화',
          content: '질량 $m = 2\\text{kg}$, 속력 $v = 3\\text{m/s}$입니다. 공식에 대입하면 $E_k = \\frac{1}{2} \\times 2 \\times 3^2$이 됩니다.'
        },
        {
          level: 3,
          type: 'critical',
          title: '속력의 제곱 계산 주의',
          content: '$3^2 = 9$입니다. $\\frac{1}{2} \\times 2$는 1이 되므로, $1 \\times 9$를 계산하면 됩니다. 단위는 줄(J)입니다.'
        }
      ],
      fullSolution: {
        steps: [
          {
            stepNumber: 1,
            title: '물리량 정리',
            detail: '물체의 질량 $m = 2\\text{kg}$, 속력 $v = 3\\text{m/s}$가 주어졌습니다.',
            formula: 'm = 2\\text{ kg},\\quad v = 3\\text{ m/s}'
          },
          {
            stepNumber: 2,
            title: '운동에너지 공식 적용',
            detail: '운동에너지 공식 $E_k = \\frac{1}{2}mv^2$에 주어진 값을 대입합니다.',
            formula: 'E_k = \\frac{1}{2} \\times 2 \\times 3^2'
          },
          {
            stepNumber: 3,
            title: '최종 연산',
            detail: '계산하면 $E_k = 1 \\times 9 = 9\\text{ J}$입니다.',
            formula: 'E_k = 9\\text{ J}'
          }
        ],
        finalAnswer: '9'
      },
      scienceGuide: {
        variables: [
          { symbol: 'm', label: '질량 (Mass)', value: '2 kg' },
          { symbol: 'v', label: '속력 (Velocity)', value: '3 m/s' },
          { symbol: 'E_k', label: '운동 에너지 (Kinetic Energy)', value: '구하고자 하는 값' }
        ],
        appliedLaw: '운동에너지 법칙: E_k = (1/2)mv^2',
        corePrinciple: '물체의 운동에너지는 질량에 비례하고 속력의 제곱에 비례함'
      },
      twinProblem: {
        question: '질량이 4kg인 물체가 2m/s의 속력으로 운동할 때, 이 물체의 운동에너지는 몇 J일까요?',
        correctAnswer: '8',
        explanation: '$E_k = \\frac{1}{2}mv^2 = \\frac{1}{2} \\times 4 \\times 2^2 = 2 \\times 4 = 8\\text{ J}$ 입니다.',
        formula: 'E_k = \\frac{1}{2} \\times 4 \\times 4 = 8\\text{ J}'
      }
    }
  }
];
