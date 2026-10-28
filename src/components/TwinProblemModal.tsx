'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { TwinProblem } from '@/types/problem';
import { MathRenderer } from './MathRenderer';
import { X, Sparkles, CheckCircle2, XCircle, Award, RotateCcw, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 헤더 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
            쌍둥이 변형 문제 (Twin Problem)
          </span>
        </div>
        <h3 className="font-extrabold text-base text-slate-900 mb-4">
          [{topic}] 개념 마스터 챌린지
        </h3>

        {/* 문제 지문 */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed font-medium">
          <MathRenderer content={twinProblem.question} />
        </div>

        {/* 정답 입력 폼 */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="정답 입력 (숫자 또는 단답)"
              value={userAnswer}
              onChange={(e) => {
                setUserAnswer(e.target.value);
                if (isCorrect === false) setIsCorrect(null);
              }}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
            />
            <button
              type="submit"
              disabled={!userAnswer.trim()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                !userAnswer.trim()
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              제출 및 채점
            </button>
          </div>

          {/* 오답 알림 */}
          {isCorrect === false && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>틀렸습니다. 원본 문제의 풀이 공식을 다시 생각해보세요!</span>
              </div>
              <button
                type="button"
                onClick={() => setShowExplanation(true)}
                className="text-xs text-rose-800 font-bold underline shrink-0 ml-2"
              >
                해설 보기
              </button>
            </div>
          )}

          {/* 정답 및 마스터 획득 알림 */}
          {isCorrect === true && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2 animate-in fade-in">
              <div className="inline-flex p-2 bg-emerald-100 text-emerald-600 rounded-full">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-black text-base text-emerald-800">
                개념 마스터 완료! 🏆
              </h4>
              <p className="text-xs text-emerald-700">
                변형 문제까지 완벽하게 정복하셨습니다. 이 문제는 오답노트에서 &apos;마스터 완료&apos;로 전환됩니다.
              </p>
            </div>
          )}
        </form>

        {/* 변형 문제 해설 블록 */}
        {showExplanation && (
          <div className="mt-4 p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl space-y-2 text-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-bold text-indigo-900">[변형 문제 정답 및 풀이]</span>
              <span className="font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                정답: {twinProblem.correctAnswer}
              </span>
            </div>
            <div className="text-slate-700 leading-relaxed">
              <MathRenderer content={twinProblem.explanation} />
            </div>
          </div>
        )}

        {/* 하단 닫기 */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
