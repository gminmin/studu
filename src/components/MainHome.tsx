'use client';

import React, { useState } from 'react';
import { BookOpen, Camera, Calculator, FlaskConical, Microscope, Phone, Sparkles, Trophy, UserRound } from 'lucide-react';
import type { SubjectType } from '@/types/problem';
import type { Wallet } from '@/lib/economy';
import { SUBJECT_THEME } from '@/lib/subjects/theme';
import { PersonalTab } from '@/components/PersonalTab';

export type MainTab = 'home' | 'ranking' | 'personal';
type TopMenu = 'subject' | 'rank' | 'credits' | 'tokens' | null;

interface MainHomeProps {
  subject: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  wallet: Wallet | null;
  walletError: string | null;
  rank: number | null;
  overallRank: number | null;
  displayName: string;
  email: string;
  userId: string;
  idToken: () => Promise<string>;
  leaders: { uid: string; rank: number; displayName: string; xp: number; isMe: boolean }[];
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  onStartScan: () => void;
  onStartCall: () => void;
  onOpenWrongNotes: () => void;
  onOpenStore: () => void;
  onExchange: () => void;
  onSignOut: () => void | Promise<void>;
};

const subjects: { id: SubjectType; label: string; Icon?: typeof FlaskConical | typeof Calculator | typeof Microscope }[] = [
  { id: 'math', label: '수학', Icon: Calculator },
  { id: 'science', label: '과학', Icon: Microscope },
  { id: 'english', label: '영어' },
];

export function MainHome({ subject, onSubjectChange, wallet, walletError, rank, overallRank, displayName, email, userId, idToken, leaders, activeTab, onTabChange, onStartScan, onStartCall, onOpenWrongNotes, onOpenStore, onExchange, onSignOut }: MainHomeProps) {
  const [openMenu, setOpenMenu] = useState<TopMenu>(null);
  const theme = SUBJECT_THEME[subject];
  const toggle = (menu: Exclude<TopMenu, null>) => setOpenMenu((current) => current === menu ? null : menu);

  return (
    <div className="relative flex min-h-0 w-full flex-1 flex-col bg-white text-slate-950">
      <div className="sticky top-0 z-30 border-b border-slate-300 bg-white">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between gap-1 px-3 py-2">
          <TopButton label={subjects.find((item) => item.id === subject)?.label || '과목'} icon={<SubjectIcon subject={subject} color={theme.color} />} value="" open={openMenu === 'subject'} onClick={() => toggle('subject')} />
          <TopButton label="현재 과목 순위" icon={<Trophy className="h-6 w-6 text-amber-400" fill="currentColor" />} value={rank ? `${rank}위` : '—'} open={openMenu === 'rank'} onClick={() => toggle('rank')} />
          <TopButton label="크레딧" icon={<CreditCoin />} value={wallet ? `${wallet.credits}` : '—'} open={openMenu === 'credits'} onClick={() => toggle('credits')} />
          <TopButton label="토큰" icon={<TokenCoin />} value={wallet ? `${wallet.tokens}` : '—'} open={openMenu === 'tokens'} onClick={() => toggle('tokens')} />
        </div>
        {openMenu && <div className="absolute left-0 right-0 top-full z-40 border-y border-slate-300 bg-white px-4 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.12)]">
          {openMenu === 'subject' && <div className="mx-auto flex max-w-2xl items-stretch justify-center gap-3 py-1">{subjects.map(({ id, label, Icon }) => <button key={id} type="button" aria-pressed={subject === id} onClick={() => { onSubjectChange(id); setOpenMenu(null); }} className={`flex min-h-24 w-24 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border bg-white text-sm font-bold transition-transform ${subject === id ? 'scale-105 border-2 border-teal-600 text-slate-950' : 'border-slate-300 text-slate-700'}`}><span className="flex h-12 w-14 items-center justify-center rounded-xl" style={{ backgroundColor: `${SUBJECT_THEME[id].color}30`, color: SUBJECT_THEME[id].color }}>{id === 'english' ? <span className="text-lg font-black tracking-[-0.08em]">AZ</span> : Icon && <Icon className="h-7 w-7"/>}</span>{label}</button>)}</div>}
          {openMenu === 'rank' && <div className="mx-auto max-w-2xl"><h2 className="mb-2 font-bold">XP 순위</h2><Leaderboard leaders={leaders} /></div>}
          {openMenu === 'credits' && <div className="mx-auto flex max-w-2xl items-center justify-between gap-3"><p className="text-sm text-slate-600">보유 크레딧 <strong className="text-slate-950">{wallet?.credits ?? '—'}</strong></p><button type="button" onClick={() => { setOpenMenu(null); onOpenStore(); }} className="min-h-11 rounded-xl border border-slate-900 px-4 text-sm font-bold">스토어로 가기</button></div>}
          {openMenu === 'tokens' && <div className="mx-auto flex max-w-2xl flex-wrap gap-2"><button type="button" disabled={(wallet?.tokens ?? 0) < 20} onClick={onExchange} className="min-h-11 flex-1 rounded-xl border border-slate-900 px-4 text-sm font-bold disabled:opacity-40">크레딧으로 구매 · 20T</button><button type="button" onClick={() => window.alert('광고 보상은 준비 중이에요.')} className="min-h-11 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-bold">광고 시청하여 획득</button></div>}
        </div>}
      </div>

      {openMenu && <button type="button" aria-label="메뉴 닫기" onClick={() => setOpenMenu(null)} className="fixed inset-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 cursor-default bg-black/35 backdrop-blur-[2px]" />}

      {!wallet && walletError && <p role="alert" className="mx-4 mt-3 rounded-xl border border-slate-400 bg-white p-3 text-sm font-semibold text-slate-700">{walletError}</p>}
      <main className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-5" onClick={() => openMenu && setOpenMenu(null)}>
        {activeTab === 'home' && <div aria-hidden="true" className="pointer-events-none fixed bottom-24 right-[-2.5rem] z-0 opacity-[0.055]"><SubjectArtwork subject={subject} /></div>}
        <div className="relative z-10 mx-auto max-w-2xl">
          {activeTab === 'home' && <>
            <button type="button" onClick={onStartScan} style={{ backgroundImage: `linear-gradient(115deg, ${theme.color}38 0%, ${theme.color}18 56%, #ffffff 100%)` }} className="relative mb-7 flex min-h-32 w-full items-center overflow-hidden rounded-2xl border border-slate-300 px-5 py-4 text-left active:border-teal-700">
              <span className="relative z-10 min-w-0 flex-1"><span className="mb-2 block text-xs font-bold text-slate-700">오늘의 학습 · {subjects.find((item) => item.id === subject)?.label}</span><strong className="block text-xl font-extrabold leading-7">모르는 문제를<br/>차근차근 해결해요</strong><span className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-teal-700 px-3 text-sm font-bold text-white">문제 풀기</span></span>
              <span aria-hidden="true" className="absolute -right-3 -top-3 flex h-32 w-32 items-center justify-center rounded-full" style={{ backgroundImage: `linear-gradient(145deg, ${theme.color}48, ${theme.color}18)`, color: theme.color }}><Camera className="h-16 w-16" strokeWidth={1.7}/><Sparkles className="absolute bottom-5 left-4 h-6 w-6 text-teal-700"/></span>
            </button>
            <section className="mb-6">
              <h2 className="mb-3 text-lg font-extrabold">학습하기</h2>
              <div className="grid gap-3">
                <button type="button" onClick={onStartScan} className="relative flex min-h-24 items-center overflow-hidden rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left active:border-teal-700 active:bg-slate-50">
                  <span className="relative z-10 min-w-0 flex-1 pr-20"><strong className="block text-base font-extrabold">문제 촬영</strong><span className="mt-1 block text-sm leading-5 text-slate-600">모르는 문제를 촬영해 보세요.</span></span>
                  <span aria-hidden="true" className="absolute -right-2 -bottom-5 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: `${theme.color}28`, color: theme.color }}><Camera className="h-12 w-12"/></span>
                </button>
                <button type="button" onClick={onStartCall} className="relative flex min-h-24 items-center overflow-hidden rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left active:border-teal-700 active:bg-slate-50">
                  <span className="relative z-10 min-w-0 flex-1 pr-20"><strong className="block text-base font-extrabold">통화 학습</strong><span className="mt-1 block text-sm leading-5 text-slate-600">캐릭터에게서 전화가 왔어요. 확인해 보세요.</span></span>
                  <span aria-hidden="true" className="absolute -right-2 -bottom-5 flex h-24 w-24 items-center justify-center rounded-full" style={{ backgroundColor: `${theme.color}28`, color: theme.color }}><Phone className="h-12 w-12"/></span>
                  <span className="absolute right-2 top-2 z-10 rounded-full border border-slate-300 bg-white/90 px-2 py-1 text-[10px] font-bold text-slate-600">준비 중</span>
                </button>
              </div>
            </section>
            <section>
              <h2 className="mb-3 text-lg font-extrabold">내 학습</h2>
              <button type="button" onClick={() => onTabChange('ranking')} className="relative flex min-h-24 w-full items-center overflow-hidden rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left active:border-teal-700 active:bg-slate-50">
                <span className="relative z-10 min-w-0 flex-1 pr-20"><strong className="block text-base font-extrabold">현재 {rank ? `${rank}위` : '순위 확인 중'}예요</strong><span className="mt-1 block text-sm leading-5 text-slate-600">경험치를 확인해 보세요.</span></span>
                <span aria-hidden="true" className="absolute -right-2 -bottom-5 flex h-24 w-24 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Trophy className="h-12 w-12" fill="currentColor"/></span>
              </button>
              <button type="button" onClick={onOpenWrongNotes} className="mt-3 min-h-11 rounded-xl px-3 text-sm font-bold text-teal-800 active:bg-teal-50"><span className="underline underline-offset-4">오답노트 복습하기</span></button>
            </section>
          </>}
          {activeTab === 'ranking' && <section><div className="mb-5 flex items-center gap-3"><Trophy className="h-7 w-7"/><div><h1 className="text-2xl font-extrabold">랭킹</h1><p className="text-sm text-slate-600">문제를 풀어 XP를 모아보세요.</p></div></div><Leaderboard leaders={leaders} /></section>}
          {activeTab === 'personal' && <PersonalTab displayName={displayName} email={email} userId={userId} idToken={idToken} wallet={wallet} rank={rank} overallRank={overallRank} subject={subject} onSubjectChange={onSubjectChange} onSignOut={onSignOut} />}
        </div>
      </main>

      <nav aria-label="메인 탭" className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto grid h-16 max-w-2xl grid-cols-3">
          <BottomTab active={activeTab === 'home'} label="학습" Icon={BookOpen} onClick={() => onTabChange('home')} />
          <BottomTab active={activeTab === 'ranking'} label="랭킹" Icon={Trophy} onClick={() => onTabChange('ranking')} />
          <BottomTab active={activeTab === 'personal'} label="프로필" Icon={UserRound} onClick={() => onTabChange('personal')} />
        </div>
      </nav>
    </div>
  );
}

function TopButton({ label, icon, value, open, onClick }: { label: string; icon: React.ReactNode; value: string; open: boolean; onClick: () => void }) {
  return <button type="button" aria-label={`${label} ${value}`} aria-expanded={open} onClick={onClick} className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-1 py-2 active:bg-slate-100"><span className="shrink-0 [&_svg]:h-6 [&_svg]:w-6">{icon}</span>{value && <span className="max-w-full truncate text-sm font-extrabold tabular-nums">{value}</span>}</button>;
}

function SubjectIcon({ subject, color }: { subject: SubjectType; color: string }) {
  if (subject === 'english') return <span className="flex h-9 w-11 items-center justify-center rounded-lg text-sm font-black tracking-[-0.08em]" style={{ backgroundColor: `${color}30`, color }}>AZ</span>;
  const Icon = subject === 'science' ? Microscope : Calculator;
  return <span className="flex h-9 w-11 items-center justify-center rounded-lg" style={{ backgroundColor: `${color}30`, color }}><Icon className="h-5 w-5" /></span>;
}

function SubjectArtwork({ subject }: { subject: SubjectType }) {
  if (subject === 'english') return <span className="text-6xl font-black tracking-[-0.1em] text-slate-950">AZ</span>;
  const Icon = subject === 'science' ? Microscope : Calculator;
  return <Icon className="h-24 w-24 text-slate-950" strokeWidth={2.4} />;
}

function CreditCoin() {
  return <span aria-hidden="true" className="relative block h-6 w-6">
    <svg viewBox="0 0 24 24" className="h-full w-full"><defs><linearGradient id="credit-star-fill" x1="4" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse"><stop stopColor="#42D6C4"/><stop offset="1" stopColor="#0F9F91"/></linearGradient><linearGradient id="credit-star-gloss" x1="7" y1="4.5" x2="14" y2="12" gradientUnits="userSpaceOnUse"><stop stopColor="white" stopOpacity=".48"/><stop offset="1" stopColor="white" stopOpacity="0"/></linearGradient></defs><path d="M12 1.5C13.25 7.1 16.9 10.75 22.5 12C16.9 13.25 13.25 16.9 12 22.5C10.75 16.9 7.1 13.25 1.5 12C7.1 10.75 10.75 7.1 12 1.5Z" fill="url(#credit-star-fill)"/><path d="M12 2.7c-1.05 4.65-3.9 7.5-8.55 8.55C8.1 12.3 10.95 15.15 12 19.8" fill="none" stroke="url(#credit-star-gloss)" strokeWidth="2.1" strokeLinecap="round"/></svg>
  </span>;
}

function TokenCoin() {
  return <span aria-hidden="true" className="relative block h-6 w-6">
    <svg viewBox="0 0 24 24" className="h-full w-full"><defs><linearGradient id="token-bolt-fill" x1="5" y1="2" x2="19" y2="22" gradientUnits="userSpaceOnUse"><stop stopColor="#7AC9E3"/><stop offset="1" stopColor="#3699BE"/></linearGradient></defs><path d="M13.7 1.5 4.8 13.2c-.4.5 0 1.2.6 1.2h5.2l-.9 8.1c-.1.7.8 1 1.2.4l8.4-12c.4-.5 0-1.2-.6-1.2h-5l1.2-7.5c.1-.7-.8-1.2-1.2-.7Z" fill="url(#token-bolt-fill)"/><path d="M13.2 4.5 8.1 11.2" fill="none" stroke="white" strokeOpacity=".78" strokeWidth="1.25" strokeLinecap="round"/></svg>
  </span>;
}

function Leaderboard({ leaders }: { leaders: MainHomeProps['leaders'] }) {
  if (!leaders.length) return <p className="rounded-xl border border-slate-300 p-4 text-sm text-slate-600">아직 순위가 없어요. 문제를 풀고 첫 XP를 모아보세요.</p>;
  return <ol className="divide-y divide-slate-200 rounded-2xl border border-slate-300 px-4">{leaders.map((leader) => <li key={leader.uid} className={`flex min-h-14 items-center gap-3 text-sm ${leader.isMe ? 'font-extrabold' : ''}`}><span className="w-8 text-center tabular-nums">{leader.rank}</span><span className="min-w-0 flex-1 truncate">{leader.displayName}{leader.isMe ? ' (나)' : ''}</span><span className="tabular-nums">{leader.xp.toLocaleString()} XP</span></li>)}</ol>;
}

function BottomTab({ active, label, Icon, onClick }: { active: boolean; label: string; Icon: typeof BookOpen; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} aria-current={active ? 'page' : undefined} onClick={onClick} className="flex items-center justify-center"><span className={`flex h-11 w-14 items-center justify-center rounded-xl transition-colors ${active ? 'bg-teal-100 text-teal-800' : 'text-slate-500'}`}><Icon className="h-6 w-6"/></span></button>;
}
