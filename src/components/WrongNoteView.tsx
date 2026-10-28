'use client';

import React, { useState } from 'react';
import { WrongNoteItem, SubjectType, MistakeReason } from '@/types/problem';
import { MathRenderer } from './MathRenderer';
import {
  BookMarked,
  Sparkles,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Tag,
  Filter,
  ChevronRight,
} from 'lucide-react';

interface WrongNoteViewProps {
  notes: WrongNoteItem[];
  onDeleteNote: (id: string) => void;
  onOpenTwin: (note: WrongNoteItem) => void;
  onSelectNoteDetail: (note: WrongNoteItem) => void;
}

export const WrongNoteView: React.FC<WrongNoteViewProps> = ({
  notes,
  onDeleteNote,
  onOpenTwin,
  onSelectNoteDetail,
}) => {
  const [filterSubject, setFilterSubject] = useState<SubjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'unsolved'>('all');

  const reasonLabels: Record<MistakeReason, string> = {
    calculation: '계산 실수',
    concept: '개념 미숙지',
    reading: '조건 오독',
    time: '시간 부족',
    other: '기타',
  };

  const filteredNotes = notes.filter((item) => {
    if (filterSubject !== 'all' && item.subject !== filterSubject) return false;
    if (filterStatus === 'mastered' && item.status !== 'mastered') return false;
    if (filterStatus === 'unsolved' && item.status === 'mastered') return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 헤더 및 통계 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                스마트 오답노트 보관함
              </h3>
              <p className="text-xs text-slate-500">
                틀린 문제의 쌍둥이 변형 문제를 풀어 100% 완전 학습을 달성하세요.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <span className="text-[10px] text-slate-400 block font-semibold">총 오답</span>
              <span className="text-sm font-black text-slate-800">{notes.length}개</span>
            </div>
            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
              <span className="text-[10px] text-emerald-600 block font-semibold">마스터 완료</span>
              <span className="text-sm font-black text-emerald-700">
                {notes.filter((n) => n.status === 'mastered').length}개
              </span>
            </div>
          </div>
        </div>

        {/* 필터 칩 */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* 과목 필터 */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1" />
            <span className="text-slate-500 font-semibold">과목:</span>
            {(['all', 'math', 'english', 'science'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSubject(s)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterSubject === s
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? '전체' : s === 'math' ? '수학' : s === 'english' ? '영어' : '과학'}
              </button>
            ))}
          </div>

          {/* 마스터 상태 필터 */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold">상태:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilterStatus('mastered')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'mastered' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🏆 마스터
            </button>
            <button
              onClick={() => setFilterStatus('unsolved')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                filterStatus === 'unsolved' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              미완료
            </button>
          </div>
        </div>
      </div>

      {/* 오답노트 카드 리스트 */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-2">
          <BookMarked className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="font-bold text-sm text-slate-700">해당 조건의 오답 문제가 없습니다</h4>
          <p className="text-xs text-slate-400">
            문제를 스캔하고 학습하면 여기에 자동으로 누적됩니다.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className={`bg-white rounded-2xl border p-5 transition shadow-xs hover:shadow-md ${
                note.status === 'mastered'
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                      note.subject === 'math'
                        ? 'bg-blue-100 text-blue-700'
                        : note.subject === 'english'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {note.subject === 'math' ? '수학' : note.subject === 'english' ? '영어' : '과학'}
                  </span>
                  <span className="font-bold text-xs text-slate-700">{note.topic}</span>
                  {note.mistakeReason && (
                    <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                      {reasonLabels[note.mistakeReason]}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {note.status === 'mastered' ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 마스터 완료 🏆
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> 복습 필요
                    </span>
                  )}
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                    title="오답노트에서 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 문제 본문 */}
              <div className="text-sm text-slate-800 line-clamp-2 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                <MathRenderer content={note.extractedText} />
              </div>

              {/* 하단 액션 버튼 */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500 font-medium">
                  정답: <strong className="font-mono text-blue-600">{note.fullSolution.finalAnswer}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectNoteDetail(note)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    상세 풀이 보기
                  </button>
                  <button
                    onClick={() => onOpenTwin(note)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>🔄 쌍둥이 변형 문제 풀기</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
