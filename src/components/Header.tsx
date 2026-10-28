'use client';

import React from 'react';
import { Sparkles, BookMarked, Camera } from 'lucide-react';

interface HeaderProps {
  activeTab: 'scan' | 'wrongNote';
  onTabChange: (tab: 'scan' | 'wrongNote') => void;
  wrongNoteCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  wrongNoteCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 text-slate-800 shadow-2xs">
      <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* 로고 */}
        <div
          onClick={() => onTabChange('scan')}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#099078] to-teal-400 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-sm tracking-tight text-slate-900">Solvify</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-[#099078]/10 text-[#099078] border border-[#099078]/20">
              튜터스캔
            </span>
          </div>
        </div>

        {/* 상단 우측: 카메라 탭 & 오답노트 탭 */}
        <div className="flex items-center p-0.5 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => onTabChange('scan')}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeTab === 'scan'
                ? 'bg-[#099078] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="카메라 스캔"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button
            onClick={() => onTabChange('wrongNote')}
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 relative ${
              activeTab === 'wrongNote'
                ? 'bg-[#099078] text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="오답노트"
          >
            <BookMarked className="w-4 h-4" />
            {wrongNoteCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1 py-0.2 text-[9px] font-extrabold bg-rose-500 text-white rounded-full leading-none">
                {wrongNoteCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
