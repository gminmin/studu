'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { StandardProblemResponse, HintItem } from '@/types/problem';
import { MathRenderer } from './MathRenderer';
import { VisualRenderer } from './VisualRenderer';
import {
  Lightbulb,
  Unlock,
  Lock,
  ChevronDown,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Trophy,
} from 'lucide-react';

interface HintLadderViewProps {
  data: StandardProblemResponse;
  onSolveAlone: () => void;
  onGiveUp: () => void;
  onReScan: () => void;
}

export const HintLadderView: React.FC<HintLadderViewProps> = ({
  data,
  onSolveAlone,
  onGiveUp,
  onReScan,
}) => {
  // 힌트 1단계는 기본 오픈(1), 2, 3단계는 잠금 해제 상태 관리
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [judgeResult, setJudgeResult] = useState<'correct' | 'wrong' | null>(null);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  // 힌트 레벨 언락
  const handleUnlockHint = (level: number) => {
    if (level > unlockedLevel) {
      setUnlockedLevel(level);
    }
  };

  // 정답 제출 채점
  const handleCheckAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setAttemptCount((prev) => prev + 1);
    const cleanedInput = userAnswer.trim().toLowerCase().replace(/\s+/g, '');
    const cleanedCorrect = data.fullSolution.finalAnswer.trim().toLowerCase().replace(/\s+/g, '');

    // 숫자 오차 허용 (소수점 등) 또는 단순 문자열 일치 판정
    const isCorrect = cleanedInput === cleanedCorrect ||
      (Number(cleanedInput) === Number(cleanedCorrect) && !isNaN(Number(cleanedInput)));

    if (isCorrect) {
      setJudgeResult('correct');
      // 축하 폭죽 효과
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {
        console.warn('Confetti error:', err);
      }
      onSolveAlone();
    } else {
      setJudgeResult('wrong');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. 스캔된 문제 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#099078]/10 text-[#099078] border border-[#099078]/20">
              {data.topic}
            </span>
            <span className="text-xs text-slate-400 font-medium">스캔된 문제</span>
          </div>
          <button
            onClick={onReScan}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium underline"
          >
            새 문제 스캔
          </button>
        </div>

        <div className="text-base text-slate-900 font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
          <MathRenderer content={data.extractedText} />
        </div>

        {/* AI 시각 자료 (기하 도형 / 그래프 / 표) */}
        {data.visualGuide && data.visualGuide.type !== 'none' && (
          <div className="mt-4">
            <VisualRenderer visualGuide={data.visualGuide} />
          </div>
        )}
      </div>

      {/* 2. 소크라테스식 힌트 사다리 3단계 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm text-slate-800">
              소크라테스식 점진적 힌트 사다리
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {unlockedLevel} / 3단계 열림
          </span>
        </div>

        {data.hints.map((hint: HintItem) => {
          const isUnlocked = hint.level <= unlockedLevel;
          const isNextToUnlock = hint.level === unlockedLevel + 1;

          return (
            <div
              key={hint.level}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isUnlocked
                  ? 'bg-white border-blue-200 shadow-xs'
                  : 'bg-slate-50 border-slate-200 opacity-80'
              }`}
            >
              {isUnlocked ? (
                /* 열린 힌트 본문 */
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#099078]/10 text-[#099078] text-xs font-extrabold flex items-center justify-center">
                        {hint.level}
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        {hint.level === 1 && '🌱 1단계: 개념 힌트 (떠올려야 할 공식/원리)'}
                        {hint.level === 2 && '🔍 2단계: 접근 힌트 (조건 정리 및 첫 걸음)'}
                        {hint.level === 3 && '⚡ 3단계: 핵심 단서 (방정식 수식 완성)'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> 잠금 해제됨
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed pl-8">
                    <MathRenderer content={hint.content} />
                  </div>
                </div>
              ) : (
                /* 잠긴 힌트 안내 & 클릭 해제 */
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 text-xs font-bold flex items-center justify-center">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-semibold text-xs text-slate-600">
                        {hint.level === 2 && '2단계: 접근 및 풀이 방향 힌트'}
                        {hint.level === 3 && '3단계: 결정적 계산 공식 힌트'}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        먼저 이전 힌트를 보고 스스로 고민해 본 후 열어보세요.
                      </p>
                    </div>
                  </div>

                  {isNextToUnlock && (
                    <button
                      onClick={() => handleUnlockHint(hint.level)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-xs transition flex items-center gap-1"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{hint.level}단계 힌트 열기</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. 인터랙티브 답안 입력 & 채점 영역 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <h4 className="font-bold text-xs text-slate-700 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#099078]" />
          <span>힌트를 보고 도출한 정답을 입력해보세요!</span>
        </h4>

        {judgeResult === 'correct' ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <div className="inline-flex p-2 bg-emerald-100 text-emerald-600 rounded-full">
              <Trophy className="w-6 h-6" />
            </div>
            <h5 className="font-extrabold text-base text-emerald-800">
              정답입니다! 스스로 풀기에 성공하셨습니다! 🎉
            </h5>
            <p className="text-xs text-emerald-700">
              정답: <strong className="font-mono">{data.fullSolution.finalAnswer}</strong>
            </p>
            <div className="pt-2">
              <button
                onClick={onGiveUp}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
              >
                전체 정밀 해설 및 단계별 풀이 확인하기 &rarr;
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCheckAnswer} className="space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="도출한 답안 입력 (예: 5, distance, 9)"
                value={userAnswer}
                onChange={(e) => {
                  setUserAnswer(e.target.value);
                  if (judgeResult === 'wrong') setJudgeResult(null);
                }}
                className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={!userAnswer.trim()}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                  !userAnswer.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#099078] hover:bg-[#077864] text-white shadow-xs'
                }`}
              >
                정답 확인
              </button>
            </div>

            {judgeResult === 'wrong' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in">
                <XCircle className="w-4 h-4 shrink-0" />
                <span>
                  아쉬워요, 정답이 아닙니다! {unlockedLevel < 3 ? '다음 단계 힌트를 열어보거나 ' : ''}풀이 과정을 다시 점검해보세요.
                </span>
              </div>
            )}
          </form>
        )}

        {/* 4. 포기 / 정답 전체 해설 보기 보조 링크 */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            충분히 고민해 보셨나요?
          </span>
          <button
            onClick={onGiveUp}
            className="text-slate-500 hover:text-rose-600 font-semibold underline flex items-center gap-1 transition"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>도저히 모르겠어요. 전체 정답 및 해설 보기</span>
          </button>
        </div>
      </div>
    </div>
  );
};
