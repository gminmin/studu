'use client';

import React, { useState } from 'react';
import { StandardProblemResponse, MistakeReason } from '@/types/problem';
import { MathRenderer } from './MathRenderer';
import {
  CheckCircle2,
  BookOpen,
  Atom,
  Calculator,
  ArrowRight,
  Sparkles,
  BookmarkCheck,
  Split,
  Tag,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface SolutionViewProps {
  data: StandardProblemResponse;
  isSolvedAlone: boolean;
  onOpenTwinProblem: () => void;
  onSaveToWrongNote: (reason: MistakeReason) => void;
  onBackToScan: () => void;
}

export const SolutionView: React.FC<SolutionViewProps> = ({
  data,
  isSolvedAlone,
  onOpenTwinProblem,
  onSaveToWrongNote,
  onBackToScan,
}) => {
  // 영어 끊어읽기 토글 상태
  const [showSlashReading, setShowSlashReading] = useState<boolean>(true);
  // 선택된 어휘 툴팁 단어
  const [selectedWord, setSelectedWord] = useState<{ word: string; meaning: string } | null>(null);
  // 오답 이유 선택 상태
  const [selectedMistakeReason, setSelectedMistakeReason] = useState<MistakeReason>('concept');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const mistakeOptions: Array<{ id: MistakeReason; label: string }> = [
    { id: 'calculation', label: '단순 계산 실수' },
    { id: 'concept', label: '개념/공식 미숙지' },
    { id: 'reading', label: '문제 조건 오독' },
    { id: 'time', label: '시간 부족' },
    { id: 'other', label: '기타' },
  ];

  const handleSaveNote = () => {
    onSaveToWrongNote(selectedMistakeReason);
    setIsSaved(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 1. 상단 상태 배너 */}
      <div
        className={`p-4 rounded-2xl border flex items-center justify-between ${
          isSolvedAlone
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white ${
              isSolvedAlone ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          >
            {isSolvedAlone ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-extrabold text-sm">
              {isSolvedAlone ? '스스로 풀기 완료!' : '정답 및 상세 해설 확인'}
            </h4>
            <p className="text-xs opacity-80">
              {isSolvedAlone
                ? '힌트를 발판 삼아 정답을 맞혔습니다. 아래에서 모범 풀이를 확인해보세요.'
                : '스스로 풀지 못했더라도 괜찮습니다! 해설을 분석하고 아래의 쌍둥이 문제로 완전 학습하세요.'}
            </p>
          </div>
        </div>
        <button
          onClick={onBackToScan}
          className="text-xs font-semibold px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg shadow-2xs transition"
        >
          새 문제 스캔
        </button>
      </div>

      {/* 2. 최종 정답 카드 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Final Answer
          </span>
          <h3 className="text-2xl font-black text-[#099078] mt-1 font-mono">
            {data.fullSolution.finalAnswer}
          </h3>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">단원 / 핵심 개념</span>
          <p className="text-sm font-bold text-slate-800">{data.topic}</p>
        </div>
      </div>

      {/* 3. 과목별 특화 솔루션 뷰 */}

      {/* [수학] 단계별 풀이 블록 & KaTeX 수식 하이라이트 */}
      {data.subject === 'math' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <h4 className="font-extrabold text-sm text-slate-800">
              수학 단계별 정밀 유도 과정
            </h4>
          </div>

          <div className="space-y-3">
            {data.fullSolution.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black bg-blue-600 text-white px-2 py-0.5 rounded-md">
                    {step.stepNumber}단계
                  </span>
                  <span className="font-bold text-xs text-slate-800">{step.title}</span>
                </div>
                <div className="text-sm text-slate-700 pl-1 leading-relaxed">
                  <MathRenderer content={step.detail} />
                </div>
                {step.formula && (
                  <div className="mt-2 p-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-center font-mono text-sm text-blue-900">
                    <MathRenderer content={step.formula} block />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* [영어] 직독직해(/) 토글 & 어휘 툴팁 팝업 & 문법 포인트 */}
      {data.subject === 'english' && data.englishGuide && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <h4 className="font-extrabold text-sm text-slate-800">
                영어 직독직해 & 구문 분석
              </h4>
            </div>
            <button
              onClick={() => setShowSlashReading(!showSlashReading)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <Split className="w-3.5 h-3.5" />
              <span>{showSlashReading ? '일반 문장 보기' : '직독직해(/) 끊어읽기'}</span>
            </button>
          </div>

          {/* 직독직해 문장 */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl leading-loose text-slate-800 text-sm font-medium">
            {showSlashReading ? (
              data.englishGuide.slashReading.split('/').map((chunk, i) => (
                <span
                  key={i}
                  className="inline-block bg-white px-2 py-0.5 m-1 rounded-md border border-emerald-200/60 shadow-2xs"
                >
                  {chunk.trim()} <span className="text-emerald-500 font-bold ml-1">/</span>
                </span>
              ))
            ) : (
              <p>{data.extractedText}</p>
            )}
          </div>

          {/* 핵심 어휘 사전 태그 */}
          {data.englishGuide.vocabulary?.length > 0 && (
            <div>
              <span className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> 지문 내 필수 어휘 (클릭하여 뜻 확인)
              </span>
              <div className="flex flex-wrap gap-2">
                {data.englishGuide.vocabulary.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedWord(selectedWord?.word === v.word ? null : v)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      selectedWord?.word === v.word
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {v.word}
                  </button>
                ))}
              </div>

              {selectedWord && (
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 animate-in fade-in flex items-center justify-between">
                  <div>
                    <strong className="font-bold text-sm mr-2">{selectedWord.word}</strong>: {selectedWord.meaning}
                  </div>
                  <button
                    onClick={() => setSelectedWord(null)}
                    className="text-emerald-700 hover:underline text-[11px]"
                  >
                    닫기
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 문법 포인트 */}
          {data.englishGuide.grammarPoint && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
              <strong className="font-bold text-blue-600 mr-1.5">[핵심 문법]</strong>
              {data.englishGuide.grammarPoint}
            </div>
          )}
        </div>
      )}

      {/* [과학] 변수 대입 테이블 & 적용 법칙 */}
      {data.subject === 'science' && data.scienceGuide && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Atom className="w-4 h-4 text-purple-600" />
            <h4 className="font-extrabold text-sm text-slate-800">
              과학 원리 & 물리량 변수 분석
            </h4>
          </div>

          {/* 적용 법칙 카드 */}
          <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-xl text-xs text-purple-900">
            <span className="font-bold text-purple-700 mr-2">[적용 과학 법칙]</span>
            <span className="font-semibold">{data.scienceGuide.appliedLaw}</span>
            {data.scienceGuide.corePrinciple && (
              <p className="mt-1 text-slate-600">{data.scienceGuide.corePrinciple}</p>
            )}
          </div>

          {/* 변수 대입 테이블 */}
          {data.scienceGuide.variables?.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">기호</th>
                    <th className="py-2.5 px-3">물리량 명칭</th>
                    <th className="py-2.5 px-3">주어진 값 / 조건</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.scienceGuide.variables.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{v.symbol}</td>
                      <td className="py-2.5 px-3 text-slate-700">{v.label}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{v.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. 오답노트 자동 등록 및 사유 진단 태깅 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-rose-500" />
            <h4 className="font-bold text-sm text-slate-800">오답노트 관리 & 자가 진단</h4>
          </div>
          {isSaved && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              ✓ 오답노트에 저장됨
            </span>
          )}
        </div>

        <p className="text-xs text-slate-500">
          이 문제를 풀면서 어떤 점이 가장 헷갈렸나요? 원인을 기록해두면 오답노트에서 한눈에 복습할 수 있습니다.
        </p>

        <div className="flex flex-wrap gap-2">
          {mistakeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSelectedMistakeReason(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                selectedMistakeReason === opt.id
                  ? 'bg-rose-50 border-rose-300 text-rose-700 ring-2 ring-rose-100'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div>
          <button
            onClick={handleSaveNote}
            disabled={isSaved}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              isSaved
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
            }`}
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{isSaved ? '오답노트 보관함에 저장 완료' : '선택한 사유로 오답노트에 저장'}</span>
          </button>
        </div>
      </div>

      {/* 5. 핵심 하이라이트: 쌍둥이 변형 문제(Twin Problem) 1-클릭 풀기 배너 */}
      <div className="bg-gradient-to-r from-[#099078] via-teal-600 to-emerald-600 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
            <Sparkles className="w-3.5 h-3.5" /> Isomorphic Twin Problem
          </div>
          <h3 className="text-lg font-black tracking-tight">
            수치만 바뀐 &lsquo;쌍둥이 문제&rsquo;로 완전 학습 달성하기!
          </h3>
          <p className="text-xs text-teal-100">
            동일한 공식과 풀이 논리로 수치만 변형된 문제를 풀어보며 개념을 완벽하게 내 것으로 만드세요.
          </p>
        </div>

        <button
          onClick={onOpenTwinProblem}
          className="shrink-0 px-6 py-3.5 bg-white text-[#099078] hover:bg-teal-50 active:scale-95 rounded-xl font-black text-sm shadow-lg transition flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>쌍둥이 문제 즉시 풀기 &rarr;</span>
        </button>
      </div>
    </div>
  );
};
