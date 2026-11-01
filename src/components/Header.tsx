'use client';

import React from 'react';
import { BookMarked, Camera, UserRound } from 'lucide-react';
import type { User } from 'firebase/auth';

interface HeaderProps {
  activeTab: 'scan' | 'wrongNote';
  onTabChange: (tab: 'scan' | 'wrongNote') => void;
  wrongNoteCount: number;
  user: User | null;
  onOpenAccount: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  wrongNoteCount,
  user,
  onOpenAccount,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-300 bg-white text-slate-900">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2">
        {/* 로고 */}
        <button
          onClick={() => onTabChange('scan')}
          className="flex min-h-12 items-center gap-2 rounded-xl text-left active:opacity-70"
          aria-label="tudu 홈"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-black text-base tracking-tight text-slate-900">tudu</span>
            <span className="text-xs font-semibold text-slate-600">문제 풀이</span>
          </div>
        </button>

        {/* 상단 우측: 카메라 탭 & 오답노트 탭 */}
        <nav aria-label="주요 메뉴" className="flex items-center gap-1">
          <button
            onClick={() => onTabChange('scan')}
            className={`flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
              activeTab === 'scan'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
            title="카메라 스캔"
          >
            <Camera className="h-5 w-5" /><span className="hidden sm:inline">촬영</span>
          </button>
          <button
            onClick={() => onTabChange('wrongNote')}
            className={`relative flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-bold transition ${
              activeTab === 'wrongNote'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700'
            }`}
            title="오답노트"
          >
            <BookMarked className="h-5 w-5" /><span>오답노트</span>
            <span className={`rounded-md px-1.5 text-xs ${activeTab === 'wrongNote' ? 'bg-white text-slate-900' : 'bg-slate-100 text-slate-700'}`}>{wrongNoteCount}</span>
          </button>
          <button
            onClick={onOpenAccount}
            className="flex min-h-12 min-w-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 text-sm font-bold text-slate-800"
            aria-label={user ? `계정: ${user.displayName || user.email || '로그인됨'}` : '로그인'}
            title={user ? '계정' : '로그인'}
          >
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.photoURL} alt="" className="h-7 w-7 rounded-full" />
            ) : (
              <UserRound className="h-5 w-5" />
            )}
            <span className="hidden sm:inline">{user ? '계정' : '로그인'}</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
