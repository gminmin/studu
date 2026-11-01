'use client';

import React, { useState } from 'react';
import { WrongNoteItem, SubjectType, MistakeReason } from '@/types/problem';
import { MathRenderer } from './MathRenderer';
import { BookMarked, Trash2, RotateCcw, CheckCircle2, AlertCircle, Filter } from 'lucide-react';

interface WrongNoteViewProps {
  notes: WrongNoteItem[];
  onDeleteNote: (id: string) => void;
  onOpenTwin: (note: WrongNoteItem) => void;
  onSelectNoteDetail: (note: WrongNoteItem) => void;
}

export const WrongNoteView: React.FC<WrongNoteViewProps> = ({ notes, onDeleteNote, onOpenTwin, onSelectNoteDetail }) => {
  const [filterSubject, setFilterSubject] = useState<SubjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'mastered' | 'unsolved'>('all');
  const reasonLabels: Record<MistakeReason, string> = {
    calculation: '계산 실수', concept: '개념 미숙지', reading: '조건 오독', time: '시간 부족', other: '기타',
  };
  const filteredNotes = notes.filter((item) => {
    if (filterSubject !== 'all' && item.subject !== filterSubject) return false;
    if (filterStatus === 'mastered' && item.status !== 'mastered') return false;
    if (filterStatus === 'unsolved' && item.status === 'mastered') return false;
    return true;
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-6">
      <section className="space-y-4 rounded-2xl border border-slate-300 bg-white p-4">
        <div className="flex items-center gap-3">
          <BookMarked className="h-6 w-6 shrink-0 text-slate-900" />
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900">오답노트</h1>
            <p className="mt-1 text-sm leading-5 text-slate-700">저장한 문제를 단계별로 다시 풀어보세요.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-slate-300 px-3 py-2"><span className="block text-xs text-slate-600">저장한 문제</span><strong className="text-lg text-slate-900">{notes.length}개</strong></div>
          <div className="rounded-xl border border-slate-300 px-3 py-2"><span className="block text-xs text-slate-600">마스터 완료</span><strong className="text-lg text-slate-900">{notes.filter((note) => note.status === 'mastered').length}개</strong></div>
        </div>

        <div className="space-y-3 border-t border-slate-300 pt-3">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700"><Filter className="h-4 w-4"/>과목</div>
            <div className="grid grid-cols-4 gap-2">
              {(['all', 'math', 'english', 'science'] as const).map((subject) => <button key={subject} onClick={() => setFilterSubject(subject)} aria-pressed={filterSubject === subject} className={`min-h-11 rounded-xl border px-2 text-sm font-bold ${filterSubject === subject ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-800'}`}>{subject === 'all' ? '전체' : subject === 'math' ? '수학' : subject === 'english' ? '영어' : '과학'}</button>)}
            </div>
          </div>
          <div>
            <div className="mb-2 text-sm font-bold text-slate-700">진행 상태</div>
            <div className="grid grid-cols-3 gap-2">
              {([['all', '전체'], ['mastered', '마스터'], ['unsolved', '복습 필요']] as const).map(([status, label]) => <button key={status} onClick={() => setFilterStatus(status)} aria-pressed={filterStatus === status} className={`min-h-11 rounded-xl border px-2 text-sm font-bold ${filterStatus === status ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 bg-white text-slate-800'}`}>{label}</button>)}
            </div>
          </div>
        </div>
      </section>

      {filteredNotes.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-400 bg-white px-5 py-10 text-center">
          <BookMarked className="mx-auto h-9 w-9 text-slate-700" />
          <h2 className="mt-3 text-base font-bold text-slate-900">조건에 맞는 오답 문제가 없어요</h2>
          <p className="mt-1 text-sm text-slate-700">문제를 풀고 오답노트에 저장하면 여기에 모입니다.</p>
        </section>
      ) : <div className="space-y-3">
        {filteredNotes.map((note) => <article key={note.id} className="space-y-3 rounded-2xl border border-slate-300 bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-slate-400 px-2 py-1 text-xs font-bold text-slate-900">{note.subject === 'math' ? '수학' : note.subject === 'english' ? '영어' : '과학'}</span>
                {note.mistakeReason && <span className="text-sm text-slate-700">{reasonLabels[note.mistakeReason]}</span>}
              </div>
              <h2 className="break-words text-base font-bold leading-6 text-slate-900">{note.topic}</h2>
            </div>
            <button onClick={() => onDeleteNote(note.id)} aria-label="오답노트에서 삭제" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-300 text-slate-800"><Trash2 className="h-5 w-5"/></button>
          </div>

          <div className="rounded-xl border border-slate-300 p-3 text-base leading-6 text-slate-900"><MathRenderer content={note.extractedText} /></div>
          <div className="flex items-center justify-between gap-3 text-sm text-slate-700">
            <span className="min-w-0 truncate">정답: <strong className="font-mono text-slate-900">{note.fullSolution.finalAnswer}</strong></span>
            <span className="flex shrink-0 items-center gap-1 font-semibold">{note.status === 'mastered' ? <><CheckCircle2 className="h-4 w-4"/>마스터</> : <><AlertCircle className="h-4 w-4"/>복습 필요</>}</span>
          </div>
          <div className="grid grid-cols-1 gap-2 border-t border-slate-300 pt-3 sm:grid-cols-2">
            <button onClick={() => onSelectNoteDetail(note)} className="min-h-12 rounded-xl border border-slate-900 bg-slate-900 px-3 text-base font-bold text-white">단계별로 다시 풀기</button>
            <button onClick={() => onOpenTwin(note)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-400 bg-white px-3 text-base font-bold text-slate-900"><RotateCcw className="h-5 w-5"/>비슷한 문제 연습</button>
          </div>
        </article>)}
      </div>}
    </div>
  );
};
