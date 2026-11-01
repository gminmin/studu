'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { TwinProblem } from '@/types/problem';
import { MathRenderer } from './MathRenderer';
import { X, Sparkles, XCircle, Award } from 'lucide-react';

interface TwinProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  twinProblem: TwinProblem;
  topic: string;
  onMasterSuccess: () => void;
}

export const TwinProblemModal: React.FC<TwinProblemModalProps> = ({
  isOpen,
  onClose,
  twinProblem,
  topic,
  onMasterSuccess,
}) => {
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    const cleanedInput = userAnswer.trim().toLowerCase().replace(/\s+/g, '');
    const cleanedCorrect = twinProblem.correctAnswer.trim().toLowerCase().replace(/\s+/g, '');

    const correct =
      cleanedInput === cleanedCorrect ||
      (Number(cleanedInput) === Number(cleanedCorrect) && !isNaN(Number(cleanedInput)));

    if (correct) {
      setIsCorrect(true);
      setShowExplanation(true);
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.5 },
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
      onMasterSuccess();
    } else {
      setIsCorrect(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-900 bg-white p-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:rounded-2xl sm:p-6">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-300 text-slate-900"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 text-slate-900">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="pr-12 text-sm font-bold text-slate-700">
            쌍둥이 변형 문제 (Twin Problem)
          </span>
        </div>
        <h3 className="mb-4 pr-10 text-lg font-extrabold text-slate-900">
          [{topic}] 개념 마스터 챌린지
        </h3>

        {/* 문제 지문 */}
        <div className="rounded-xl border border-slate-400 p-4 text-base leading-7 font-medium text-slate-900">
          <MathRenderer content={twinProblem.question} />
        </div>

        {/* 정답 입력 폼 */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              placeholder="정답 입력 (숫자 또는 단답)"
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                if (isCorrect === false) setIsCorrect(null);
              }}
              className="min-h-12 min-w-0 flex-1 rounded-xl border border-slate-400 px-4 text-base text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className={`min-h-12 rounded-xl border px-5 text-base font-bold ${
                !userAnswer.trim()
                  ? 'cursor-not-allowed border-slate-300 bg-white text-slate-500'
                  : 'border-slate-900 bg-slate-900 text-white'
              }`}
            >
              제출 및 채점
            </button>
          </div>

          {/* 오답 알림 */}
          {isCorrect === false && (
            <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-slate-400 p-3 text-sm text-slate-800 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1.5">
                <XCircle className="h-5 w-5 shrink-0" />
                <span>틀렸습니다. 원본 문제의 풀이 공식을 다시 생각해보세요!</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="min-h-11 rounded-lg border border-slate-400 px-3 text-sm font-bold text-slate-900"
              >
                해설 보기
              </button>
            </div>
          )}

          {/* 정답 및 마스터 획득 알림 */}
          {isCorrect === true && (
            <div className="space-y-2 rounded-xl border border-slate-900 p-4 text-center">
              <div className="inline-flex rounded-full border border-slate-400 p-2 text-slate-900">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                개념 마스터 완료! 🏆
              </h4>
              <p className="text-base leading-6 text-slate-700">
                변형 문제까지 완벽하게 정복하셨습니다. 이 문제는 오답노트에서 &apos;마스터 완료&apos;로 전환됩니다.
              </p>
            </div>
          )}
        </form>

        {/* 변형 문제 해설 블록 */}
        {showExplanation && (
          <div className="mt-4 space-y-2 rounded-xl border border-slate-400 p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-900">[변형 문제 정답 및 풀이]</span>
              <span className="rounded-md border border-slate-400 px-2 py-1 font-bold text-slate-900">
                정답: {twinProblem.correctAnswer}
              </span>
            </div>
            <div className="text-base leading-7 text-slate-800">
              <MathRenderer content={twinProblem.explanation} />
            </div>
          </div>
        )}

        {/* 하단 닫기 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="min-h-12 w-full rounded-xl border border-slate-400 px-4 text-base font-bold text-slate-900 sm:w-auto"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
