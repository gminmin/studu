'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import { StandardProblemResponse } from '@/types/problem';
import { SUBJECT_THEME } from '@/lib/subjects/theme';
import { MathRenderer } from './MathRenderer';
import { VisualRenderer } from './VisualRenderer';

interface LearningFlowViewProps {
  data: StandardProblemResponse;
  onSolveAlone: () => void;
  onSaveToWrongNote: () => void;
  onOpenTwinProblem: () => void;
  onExit: () => void;
}

const stages = ['문제 이해', '개념 찾기', '풀이 따라가기', '정답 확인'];

function isNearAnswer(input: string, expected: string): boolean {
  const cleanInput = input.trim().toLocaleLowerCase().replace(/\s+/g, '');
  const cleanExpected = expected.trim().toLocaleLowerCase().replace(/\s+/g, '');
  if (!cleanInput || !cleanExpected || cleanInput === cleanExpected) return false;

  const inputNumber = Number(cleanInput);
  const expectedNumber = Number(cleanExpected);
  if (Number.isFinite(inputNumber) && Number.isFinite(expectedNumber)) {
    const tolerance = Math.max(0.05, Math.abs(expectedNumber) * 0.1);
    if (Math.abs(inputNumber - expectedNumber) <= tolerance) return true;
  }

  const inputCharacters = Array.from(cleanInput);
  const remainingCharacters = Array.from(cleanExpected);
  if (Math.min(inputCharacters.length, remainingCharacters.length) < 3) return false;
  let sharedCount = 0;
  for (const character of inputCharacters) {
    const matchIndex = remainingCharacters.indexOf(character);
    if (matchIndex >= 0) {
      sharedCount += 1;
      remainingCharacters.splice(matchIndex, 1);
    }
  }
  return sharedCount / Math.max(inputCharacters.length, cleanExpected.length) >= 0.65;
}

export const LearningFlowView: React.FC<LearningFlowViewProps> = ({
  data,
  onSolveAlone,
  onSaveToWrongNote,
  onOpenTwinProblem,
  onExit,
}) => {
  const [stage, setStage] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState<'right' | 'wrong' | 'near' | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);
  const [successAttemptCount, setSuccessAttemptCount] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const steps = data.fullSolution.steps ?? [];
  const breakdown = data.problemBreakdown ?? {
    summary: '문제에서 주어진 조건과 구해야 하는 것을 확인해보세요.',
    givens: [],
    target: data.topic,
  };
  const reference = data.conceptReference;
  const theme = SUBJECT_THEME[data.subject];
  const correct = data.fullSolution.finalAnswer.trim().toLocaleLowerCase().replace(/\s+/g, '');
  const step = steps[Math.min(stepIndex, Math.max(steps.length - 1, 0))];

  const submitAnswer = (event: React.FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    const input = answer.trim().toLocaleLowerCase().replace(/\s+/g, '');
    const isCorrect = input === correct || (correct !== '' && Number(input) === Number(correct) && Number.isFinite(Number(input)));
    if (isCorrect) {
      setFeedback('right');
      setSuccessAttemptCount(attemptCount + 1);
      const messages = ['좋아요!', '완벽해요!', '훌륭해요!'];
      setSuccessMessage(messages[Math.floor(Math.random() * messages.length)]);
    } else {
      const nextAttemptCount = attemptCount + 1;
      setAttemptCount(nextAttemptCount);
      setFeedback(isNearAnswer(input, correct) ? 'near' : 'wrong');
      if (nextAttemptCount >= 2) setShowSolution(true);
    }
    if (isCorrect) {
      onSolveAlone();
      try { confetti({ particleCount: 65, spread: 65, origin: { y: 0.65 } }); } catch { /* visual flourish only */ }
    }
  };

  const advance = () => {
    if (stage === 2 && stepIndex < steps.length - 1) setStepIndex((index) => index + 1);
    else setStage((current) => Math.min(current + 1, stages.length - 1));
  };

  const back = () => {
    if (stage === 3 && attemptCount < 2 && feedback !== 'right') {
      setAnswer('');
      setFeedback(null);
    }
    if (stage === 2 && stepIndex > 0) setStepIndex((index) => index - 1);
    else setStage((current) => Math.max(current - 1, 0));
  };

  const saveCurrentNote = () => {
    onSaveToWrongNote();
    setSaved(true);
  };

  return (
    <div className="relative mx-auto flex h-full min-h-0 w-full max-w-2xl flex-col bg-white">
      <header className="shrink-0 border-b border-slate-300 bg-white px-4 pb-3 pt-[max(env(safe-area-inset-top),0.5rem)]">
        <div className="flex items-start gap-3">
          <button
            type="button"
            aria-label="학습 종료"
            onClick={() => setShowExitConfirm(true)}
            className="flex h-12 w-12 shrink-0 items-center justify-center text-3xl font-light text-slate-600"
          >
            ×
          </button>
          <div className="min-w-0 flex-1 pt-1">
            <div className="flex gap-1.5" aria-label={`진행 단계 ${stage + 1}/${stages.length}`}>
              {stages.map((label, index) => (
                <div key={label} className="h-2 flex-1 overflow-hidden rounded-full border border-slate-300 bg-white">
                  <div className="h-full" style={{ backgroundColor: index <= stage ? theme.color : 'transparent' }} />
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-bold text-slate-700">{stage + 1}/{stages.length}</span>
              <span className="font-extrabold text-slate-900">{stages[stage]}</span>
            </div>
          </div>
        </div>
      </header>

      <section key={`${stage}-${stepIndex}`} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-8">
        <div className="mx-auto w-full max-w-xl space-y-6 pb-4">
          {stage === 0 && <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-slate-600">{data.topic}</p>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950">문제를 읽고, 무엇을 구할지 찾아봐요.</h1>
            </div>
            <p className="text-lg leading-8 text-slate-800">{breakdown.summary}</p>
            <div className="text-lg leading-8 text-slate-950"><MathRenderer content={data.extractedText} /></div>
            {breakdown.givens.length > 0 && <div>
              <h2 className="mb-2 text-sm font-bold text-slate-700">문제에서 주어진 조건</h2>
              <dl className="divide-y divide-slate-300 border-y border-slate-300">
                {breakdown.givens.map((item, index) => <div key={`${item.label}-${index}`} className="flex justify-between gap-4 py-3 text-base"><dt className="text-slate-700">{item.label}</dt><dd className="text-right font-bold text-slate-950"><MathRenderer content={item.value} /></dd></div>)}
              </dl>
            </div>}
            <div className="border-l-4 pl-4" style={{ borderColor: theme.color }}>
              <div className="text-sm font-bold text-slate-700">우리가 구할 것</div>
              <div className="mt-1 text-lg font-semibold text-slate-950"><MathRenderer content={breakdown.target} /></div>
            </div>
            {data.visualGuide && <VisualRenderer visualGuide={data.visualGuide} />}
          </div>}

          {stage === 1 && <div className="space-y-6">
            {reference ? <>
              <div>
                <p className="text-sm font-semibold text-slate-600">이번 문제의 핵심 개념</p>
                <h1 className="mt-2 text-2xl font-extrabold text-slate-950">{reference.name}</h1>
              </div>
              <div className="overflow-x-auto border-y border-slate-400 py-5 text-lg leading-8 text-slate-950"><MathRenderer content={reference.statement} block /></div>
              <p className="text-lg leading-8 text-slate-800">{reference.application}</p>
              {reference.source && <p className="border-t border-slate-300 pt-3 text-sm text-slate-600">참고: {reference.source}</p>}
            </> : <>
              <div><p className="text-sm font-semibold text-slate-600">문제 유형</p><h1 className="mt-2 text-2xl font-extrabold text-slate-950">{data.topic}</h1></div>
              {data.hints.slice(0, 1).map((hint) => <p key={hint.level} className="text-lg leading-8 text-slate-800"><MathRenderer content={hint.content} /></p>)}
            </>}
            {data.subject === 'english' && data.englishGuide?.grammarPoint && <div className="border-t border-slate-300 pt-4"><h2 className="mb-2 text-sm font-bold text-slate-700">문법 포인트</h2><div className="text-base leading-7 text-slate-900"><MathRenderer content={data.englishGuide.grammarPoint} /></div></div>}
            {data.subject === 'science' && data.scienceGuide?.appliedLaw && <div className="border-t border-slate-300 pt-4"><h2 className="mb-2 text-sm font-bold text-slate-700">적용 법칙</h2><div className="text-base leading-7 text-slate-900"><MathRenderer content={data.scienceGuide.appliedLaw} /></div></div>}
          </div>}

          {stage === 2 && <div className="space-y-6">
            <div className="flex items-center justify-between text-sm"><span className="font-bold text-slate-950">풀이 {steps.length ? stepIndex + 1 : 0}/{steps.length}</span><span className="text-slate-600">한 줄씩 따라가요</span></div>
            {step ? <>
              <h1 className="text-2xl font-extrabold leading-tight text-slate-950">{step.title}</h1>
              <p className="text-lg leading-8 text-slate-800"><MathRenderer content={step.detail} /></p>
              {step.formula && <div className="overflow-x-auto border-y border-slate-400 py-5 text-center text-slate-950"><MathRenderer content={step.formula} block /></div>}
            </> : <p className="text-lg leading-8 text-slate-800">상세 풀이 단계가 없습니다. 힌트를 확인하고 직접 풀어보세요.</p>}
            {data.hints[stepIndex] && <div className="py-1">
              <button type="button" aria-expanded={showHint} onClick={() => setShowHint((visible) => !visible)} className="flex min-h-12 items-center gap-2 text-base font-medium text-slate-500">
                <Lightbulb className="h-4 w-4 shrink-0"/><span>힌트</span>
              </button>
              {showHint && <div className="pb-3 pl-6 pt-1 text-base leading-7 text-slate-700"><MathRenderer content={data.hints[stepIndex].content} /></div>}
            </div>}
            {data.subject === 'english' && data.englishGuide?.slashReading && <details className="py-1"><summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 text-base font-medium text-slate-500"><span aria-hidden="true" className="text-sm leading-none">▾</span><span>문장 끊어 읽기</span></summary><p className="pb-3 pl-6 pt-1 text-base leading-7 text-slate-700">{data.englishGuide.slashReading}</p></details>}
          </div>}

          {stage === 3 && <div className="space-y-6">
            {attemptCount < 2 && feedback !== 'right' && <div>
              <p className="text-sm font-semibold text-slate-600">마지막으로 확인해봐요</p>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight text-slate-950">정답을 찾았나요?</h1>
            </div>}
            {feedback === 'right' && !showSolution && <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 py-8 text-center">
              <h1
                className={`text-3xl font-extrabold text-slate-950 ${successAttemptCount === 1 ? 'success-glow-first' : 'success-glow-subject'}`}
                style={{ '--success-glow-color': theme.color } as React.CSSProperties}
              >
                {successMessage}
              </h1>
              <p className="text-sm leading-6 text-slate-600">끝까지 생각해서 정답을 찾아냈어요.</p>
            </div>}
            {feedback === 'right' && showSolution && <h1 className="text-center text-2xl font-extrabold text-slate-950">{successMessage}</h1>}
            {attemptCount >= 2 && feedback && feedback !== 'right' && <h1 className="text-center text-2xl font-extrabold text-slate-950">{feedback === 'near' ? '아쉬워요.' : '오답이에요.'}</h1>}
            {attemptCount < 2 && feedback !== 'right' && <form id="learning-answer-form" onSubmit={submitAnswer} className="space-y-3">
              <label htmlFor="learning-answer" className="text-base font-bold text-slate-800">내 답</label>
              <input id="learning-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} className="min-h-14 w-full rounded-xl border border-slate-400 px-4 text-base text-slate-950 focus:border-slate-950 focus:outline-none" placeholder="답을 입력하세요" />
              {attemptCount === 1 && <p className="text-xs font-medium text-red-600">한 번 더 시도해보세요.</p>}
            </form>}
            {attemptCount === 1 && feedback !== 'right' && data.hints[0] && <div className="border-l-4 pl-4 text-base leading-7 text-slate-700" style={{ borderColor: theme.color }}><MathRenderer content={data.hints[0].content} /></div>}
            {showSolution && <div className="space-y-5 border-t border-slate-300 pt-5">
              <h2 className="text-lg font-extrabold text-slate-950">풀이</h2>
              {steps.map((item) => <div key={item.stepNumber} className="space-y-1 text-base"><strong>{item.stepNumber}. {item.title}</strong><div className="leading-7 text-slate-700"><MathRenderer content={item.detail} /></div>{item.formula && <MathRenderer content={item.formula} block />}</div>)}
              <div className="border-t border-slate-300 pt-4"><div className="text-sm font-bold text-slate-700">정답</div><div className="mt-1 font-mono text-xl font-black text-slate-950"><MathRenderer content={data.fullSolution.finalAnswer} /></div></div>
            </div>}
          </div>}
        </div>
      </section>

      <footer className={`grid shrink-0 items-center gap-2 border-t border-slate-300 bg-white px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 ${stage === 3 && attemptCount >= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {stage < 3 ? <>
          {stage > 0 ? <button type="button" onClick={back} className="flex min-h-12 items-center justify-center gap-1 rounded-xl border border-slate-400 px-2 text-sm font-bold text-slate-900"><ArrowLeft className="h-4 w-4"/>이전</button> : <span/>}
          <button type="button" onClick={advance} className="col-span-2 flex min-h-12 items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold" style={{ backgroundColor: theme.color, color: theme.foreground }}>{stage === 2 && stepIndex < steps.length - 1 ? '다음 풀이' : '다음 단계'}<ArrowRight className="h-4 w-4"/></button>
        </> : feedback === 'right' && !showSolution ? <>
          <span />
          <button onClick={() => setShowSolution(true)} className="col-span-2 flex min-h-12 items-center justify-center gap-1 rounded-xl px-2 text-sm font-bold" style={{ backgroundColor: theme.color, color: theme.foreground }}>다음<ArrowRight className="h-4 w-4"/></button>
        </> : attemptCount >= 2 && showSolution ? <>
          <button onClick={() => setShowExitConfirm(true)} className="min-h-12 rounded-xl border border-slate-400 px-2 text-sm font-bold text-slate-900">나가기</button>
          <button disabled={saved} onClick={saveCurrentNote} className="min-h-12 rounded-xl px-2 text-sm font-bold disabled:opacity-50" style={{ backgroundColor: theme.color, color: theme.foreground }}>{saved ? '저장됨' : '오답노트 저장'}</button>
        </> : feedback === 'right' && showSolution ? <>
          <button onClick={() => setShowExitConfirm(true)} className="min-h-12 rounded-xl border border-slate-400 px-2 text-sm font-bold text-slate-900">나가기</button>
          <button disabled={saved} onClick={saveCurrentNote} className="min-h-12 rounded-xl border border-slate-400 px-2 text-sm font-bold text-slate-900 disabled:opacity-50">{saved ? '저장됨' : '저장'}</button>
          <button onClick={onOpenTwinProblem} className="min-h-12 rounded-xl px-2 text-sm font-bold" style={{ backgroundColor: theme.color, color: theme.foreground }}>더 풀기</button>
        </> : <>
          {stage > 0 ? <button onClick={back} className="min-h-12 rounded-xl border border-slate-400 px-2 text-sm font-bold text-slate-900">이전</button> : <span />}
          <button type="submit" form="learning-answer-form" disabled={!answer.trim()} className="col-span-2 min-h-12 rounded-xl px-2 text-sm font-bold disabled:opacity-50" style={{ backgroundColor: theme.color, color: theme.foreground }}>{attemptCount === 1 ? '다시 시도' : '정답 확인'}</button>
        </>}
      </footer>

      {showExitConfirm && <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 sm:items-center sm:p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="exit-title" className="w-full max-w-md space-y-4 rounded-t-2xl border border-slate-900 bg-white p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:rounded-2xl">
          <div><h2 id="exit-title" className="text-xl font-extrabold text-slate-950">학습을 나갈까요?</h2><p className="mt-2 text-base leading-6 text-slate-700">지금 나가면 이 풀이의 진행 상태는 저장되지 않아요.</p></div>
          <button onClick={() => setShowExitConfirm(false)} className="min-h-14 w-full rounded-xl border border-slate-400 text-base font-bold text-slate-900">계속 풀기</button>
          <button onClick={onExit} className="min-h-14 w-full rounded-xl bg-slate-900 text-base font-bold text-white">나가기</button>
        </section>
      </div>}
    </div>
  );
};
