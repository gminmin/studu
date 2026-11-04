'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Calculator,
  Check,
  Lightbulb,
  Microscope,
  RotateCcw,
  ScanLine,
  Sparkles,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { SUBJECT_THEME } from '@/lib/subjects/theme';

type SubjectId = 'english' | 'math' | 'science';

type SubjectData = {
  label: string;
  title: string;
  prompt: string;
  options: string[];
  answer: string;
  hint: string;
  explanation: string;
};

const subjects: Record<SubjectId, SubjectData> = {
  english: {
    label: '영어',
    title: '인사하는 말',
    prompt: '처음 만난 사람에게 자연스럽게 건넬 수 있는 인사는?',
    options: ['Good morning!', 'Good night!', 'See you later!'],
    answer: 'Good morning!',
    hint: '아침에 만났을 때 건네는 말이에요.',
    explanation: 'Good morning!은 아침에 만났을 때 쓰는 자연스러운 인사예요.',
  },
  math: {
    label: '수학',
    title: '분수의 곱셈',
    prompt: '다음 계산의 값은 얼마일까요?  2/3 × 3/4',
    options: ['1/2', '2/7', '5/12'],
    answer: '1/2',
    hint: '분자는 분자끼리, 분모는 분모끼리 곱해보세요.',
    explanation: '분자는 2×3, 분모는 3×4로 계산한 뒤 약분하면 1/2가 돼요.',
  },
  science: {
    label: '과학',
    title: '물의 화학식 이해',
    prompt: '수소 원자 2개와 산소 원자 1개로 이루어진 물의 화학식은?',
    options: ['CO₂', 'H₂O', 'O₂'],
    answer: 'H₂O',
    hint: '수소의 기호는 H, 산소의 기호는 O예요.',
    explanation: 'H₂O에서 아래 첨자 2는 수소 원자가 2개라는 뜻이에요.',
  },
};

function SubjectIcon({ subject }: { subject: SubjectId }) {
  const color = SUBJECT_THEME[subject].color;

  return (
    <span
      aria-hidden="true"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${color}30`, color }}
    >
      {subject === 'english' ? (
        <span className="text-sm font-black tracking-[-0.08em]">AZ</span>
      ) : subject === 'science' ? (
        <Microscope className="h-5 w-5" />
      ) : (
        <Calculator className="h-5 w-5" />
      )}
    </span>
  );
}

function SubjectExercise({
  id,
  data,
  selected,
  onSelect,
  onReset,
}: {
  id: SubjectId;
  data: SubjectData;
  selected: string | null;
  onSelect: (value: string) => void;
  onReset: () => void;
}) {
  const color = SUBJECT_THEME[id].color;
  const result = selected ? selected === data.answer : null;

  return (
    <article className="w-full">
      <div className="flex items-start justify-between gap-4 border-b border-[#1c2a27]/15 pb-6">
        <h4 className="text-2xl font-black tracking-[-.05em]" style={{ color }}>
          {data.title}
        </h4>
        {result !== null && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              result ? 'bg-[#edf7f4] text-[#0f726b]' : 'bg-[#fff1f1] text-[#b45a5a]'
            }`}
          >
            {result ? '정답이에요' : '다시 생각해봐요'}
          </span>
        )}
      </div>

      <p className="mt-7 text-lg font-black leading-8">{data.prompt}</p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {data.options.map((option) => {
          const chosen = selected === option;
          const correct = option === data.answer;

          return (
            <button
              key={option}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-xl border bg-white/70 px-4 py-4 text-left text-sm font-bold transition-colors ${
                chosen
                  ? correct
                    ? 'border-[#0f726b] text-[#0f726b]'
                    : 'border-[#d88f8f] text-[#9e5050]'
                  : 'border-[#d9dfda] hover:border-[#0f726b]'
              }`}
            >
              {option}
              {chosen &&
                (correct ? (
                  <Check className="float-right h-5 w-5" />
                ) : (
                  <X className="float-right h-5 w-5" />
                ))}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#1c2a27]/15 pt-5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-[#60706b]">
          <Lightbulb className="h-4 w-4" style={{ color }} />
          힌트: {data.hint}
        </span>
        {selected && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#60706b]"
          >
            <RotateCcw className="h-4 w-4" /> 다시 풀기
          </button>
        )}
      </div>

      {selected && (
        <div className="mt-5 border-t border-[#1c2a27]/15 pt-5 text-sm leading-7 text-[#52645d]">
          <strong className="text-[#1c2a27]">tudu의 설명</strong>
          <br />
          {data.explanation}
          <br />
          <Link
            href="/service"
            className="mt-4 inline-flex items-center rounded-xl bg-[#0f726b] px-4 py-3 font-bold text-white"
          >
            이어하기 <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      )}
    </article>
  );
}

export default function HomePage() {
  const [answers, setAnswers] = useState<Partial<Record<SubjectId, string>>>({});
  const choose = (id: SubjectId, value: string) =>
    setAnswers((current) => ({ ...current, [id]: value }));
  const reset = (id: SubjectId) =>
    setAnswers((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

  return (
    <main className="min-h-screen bg-white text-[#1c2a27]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-[#e5ebe7] bg-white/95 backdrop-blur">
        <nav className="mx-auto flex h-[76px] max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="tudu 홈">
            <Image
              src="/tudu.svg"
              alt="tudu 정식 로고"
              width={120}
              height={36}
              className="h-8 w-[88px] object-cover sm:h-9 sm:w-[120px]"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-6">
            <div className="hidden items-center gap-5 text-sm font-semibold text-[#52645d] sm:flex">
              <a href="#intro" className="hover:text-[#0f726b]">소개</a>
              <a href="#how-it-works" className="hover:text-[#0f726b]">학습 방식</a>
              <a href="#try-english" className="hover:text-[#0f726b]">체험하기</a>
            </div>
            <Link
              href="/service"
              className="inline-flex items-center rounded-full bg-[#0f726b] px-5 py-3 text-sm font-bold text-white"
            >
              시작하기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      <section id="intro" className="flex min-h-svh items-center bg-white px-5 pb-12 pt-24 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <div className="max-w-3xl">
            <p className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-[#0f726b]">
              <Sparkles className="h-4 w-4" /> AI 학습 파트너
            </p>
            <h1 className="text-[clamp(3.2rem,7vw,6.2rem)] font-black leading-[.95] tracking-[-.09em]">
              정답보다
              <br />
              <span className="text-[#0f726b]">이해하는 힘</span>을
              <br />
              키워요.
            </h1>
            <p className="mt-8 max-w-xl text-lg font-medium leading-8 text-[#60706b]">
              tudu는 문제를 대신 풀어주는 서비스가 아니에요. 막힌 순간에 필요한 힌트를 주고,
              다음에는 혼자 풀 수 있게 도와주는 AI 학습 서비스예요.
            </p>
            <Link
              href="#try-english"
              className="mt-9 inline-flex items-center rounded-xl bg-[#0f726b] px-6 py-4 font-bold text-white shadow-[0_5px_0_#0b514d]"
            >
              체험 문제 풀어보기 <ArrowRight className="ml-3 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="flex min-h-svh items-center border-y border-[#e5ebe7] bg-white px-5 py-24 sm:px-8">
        <div className="mx-auto w-full max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[.16em] text-[#0f726b]">
            how tudu works
          </p>
          <h2 className="mt-4 text-4xl font-black tracking-[-.07em] sm:text-5xl">
            문제를 보고, 힌트로 생각하고,
            <br />
            다시 풀며 성장해요.
          </h2>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#e5ebe7] bg-white p-6">
              <ScanLine className="h-6 w-6 text-[#0f726b]" />
              <h3 className="mt-14 text-xl font-black">문제를 보여주세요</h3>
              <p className="mt-3 text-sm leading-6 text-[#667771]">
                사진 한 장으로 조건과 핵심 개념을 읽어요.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e5ebe7] bg-white p-6">
              <Lightbulb className="h-6 w-6 text-[#0f726b]" />
              <h3 className="mt-14 text-xl font-black">힌트로 생각해요</h3>
              <p className="mt-3 text-sm leading-6 text-[#667771]">
                개념·접근·검산, 세 단계로 풀어가요.
              </p>
            </div>
            <div className="rounded-2xl border border-[#e5ebe7] bg-white p-6">
              <RotateCcw className="h-6 w-6 text-[#0f726b]" />
              <h3 className="mt-14 text-xl font-black">다시 풀어봐요</h3>
              <p className="mt-3 text-sm leading-6 text-[#667771]">
                유사 문제와 오답 기록으로 배움을 남겨요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {(['english', 'math', 'science'] as const).map((id) => {
        const theme = SUBJECT_THEME[id];
        const data = subjects[id];

        return (
          <section
            key={id}
            id={`try-${id}`}
            aria-labelledby={`${id}-demo-title`}
            className="flex min-h-svh items-center px-5 pb-12 pt-24 sm:px-8"
            style={{ backgroundColor: `${theme.color}14` }}
          >
            <div className="mx-auto w-full max-w-4xl">
              <p className="text-sm font-bold uppercase tracking-[.16em]" style={{ color: theme.color }}>
                try by subject
              </p>
              <h2
                id={`${id}-demo-title`}
                className="mt-4 flex items-center gap-3 text-4xl font-black tracking-[-.07em] sm:text-5xl"
                style={{ color: theme.color }}
              >
                <SubjectIcon subject={id} />
                {data.label} 체험 문제
              </h2>
              <div className="mt-10 sm:mt-14">
                <SubjectExercise
                  id={id}
                  data={data}
                  selected={answers[id] ?? null}
                  onSelect={(value) => choose(id, value)}
                  onReset={() => reset(id)}
                />
              </div>
            </div>
          </section>
        );
      })}

      <section id="get-started" className="flex min-h-svh flex-col bg-white px-5 pb-2 pt-20 sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-1 items-center py-4">
          <div className="w-full px-2 py-10 sm:px-12">
            <p className="text-sm font-bold text-[#0f726b]">가입하면 바로 시작할 수 있어요</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.07em] sm:text-5xl">
              처음이라서 더 좋은
              <br />
              tudu 가입 혜택
            </h2>
            <ul className="mt-7 grid gap-3 text-sm font-bold text-[#52645d]">
              <li>
                <Check className="mr-2 inline h-5 w-5 text-[#0f726b]" />
                첫 문제 무료 체험
              </li>
              <li>
                <Check className="mr-2 inline h-5 w-5 text-[#0f726b]" />
                3단계 AI 힌트
              </li>
              <li>
                <Check className="mr-2 inline h-5 w-5 text-[#0f726b]" />
                오답노트와 XP 기록
              </li>
            </ul>
            <Link
              href="/service"
              className="mt-8 inline-flex items-center rounded-xl bg-[#0f726b] px-5 py-3 font-bold text-white"
            >
              서비스 시작하기 <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
        <footer className="mx-auto flex w-full max-w-6xl items-center justify-between border-t border-[#e5ebe7] py-4">
          <Image
            src="/tudu.svg"
            alt="tudu 정식 로고"
            width={52}
            height={30}
            className="h-7 w-10 object-contain"
          />
          <span className="text-sm font-medium text-[#7b8984]">
            혼자 푸는 힘을 만드는 AI 학습
          </span>
        </footer>
      </section>
    </main>
  );
}
