'use client';

import React, { useEffect, useState } from 'react';
import { Award, ArrowLeft, Check, LogOut, Palette, Settings, Trophy, UserRound } from 'lucide-react';
import type { SubjectType } from '@/types/problem';
import type { Wallet } from '@/lib/economy';
import { AVATAR_BACKGROUNDS, AVATAR_CHARACTERS, DEFAULT_AVATAR_PROFILE, type AvatarProfile } from '@/lib/avatar';

interface PersonalTabProps {
  displayName: string;
  email: string;
  userId: string;
  idToken: () => Promise<string>;
  wallet: Wallet | null;
  rank: number | null;
  overallRank: number | null;
  subject: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  onSignOut: () => void | Promise<void>;
}

const subjectNames: Record<SubjectType, string> = { math: '수학', science: '과학', english: '영어' };

export function PersonalTab({ displayName, email, userId, idToken, wallet, rank, overallRank, subject, onSubjectChange, onSignOut }: PersonalTabProps) {
  const [profile, setProfile] = useState<AvatarProfile>(DEFAULT_AVATAR_PROFILE);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch('/api/profile', { headers: { Authorization: `Bearer ${await idToken()}` } });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || '프로필을 불러오지 못했어요.');
        if (active) setProfile(data.profile);
      } catch (loadError) {
        if (active) setError((loadError as Error).message || '프로필을 불러오지 못했어요.');
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, [idToken]);

  const saveProfile = async (nextProfile: AvatarProfile) => {
    const previousProfile = profile;
    setProfile(nextProfile);
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await idToken()}` },
        body: JSON.stringify(nextProfile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '아바타를 저장하지 못했어요.');
      setProfile(data.profile);
    } catch (saveError) {
      setProfile(previousProfile);
      setError((saveError as Error).message || '아바타를 저장하지 못했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAvatar = AVATAR_CHARACTERS.find((item) => item.id === profile.characterId) ?? AVATAR_CHARACTERS[0];
  const selectedBackground = AVATAR_BACKGROUNDS.find((item) => item.id === profile.backgroundId) ?? AVATAR_BACKGROUNDS[0];
  const xp = wallet?.subjectXp ?? { math: 0, science: 0, english: 0 };
  const achievements = [
    { id: 'first', title: '첫걸음', description: 'XP 20 달성', target: 20, value: wallet?.xp ?? 0 },
    { id: 'collector', title: '경험치 수집가', description: 'XP 100 달성', target: 100, value: wallet?.xp ?? 0 },
    { id: 'all-subjects', title: '다재다능', description: '세 과목에서 XP 획득', target: 3, value: Object.values(xp).filter((value) => value > 0).length },
  ];

  if (isSettingsOpen) return (
    <section className="space-y-5 pb-6">
      <button type="button" onClick={() => setIsSettingsOpen(false)} className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-5 w-5"/>프로필로</button>
      <header><h1 className="text-2xl font-extrabold">설정</h1><p className="mt-1 text-sm text-slate-600">학습 환경과 계정을 관리해요.</p></header>
      <section className="space-y-3 rounded-2xl border border-slate-300 p-4">
        <h2 className="font-extrabold">기본 학습 과목</h2>
        <p className="text-sm text-slate-600">선택한 과목이 학습 화면의 기본 과목으로 저장돼요.</p>
        <div className="grid grid-cols-3 gap-2">
          {(['math', 'science', 'english'] as const).map((item) => <button key={item} type="button" aria-pressed={subject === item} onClick={() => onSubjectChange(item)} className={`min-h-12 rounded-xl border text-sm font-bold ${subject === item ? 'border-teal-700 bg-teal-50 text-teal-900' : 'border-slate-300 bg-white'}`}>{subjectNames[item]}</button>)}
        </div>
      </section>
      <section className="space-y-2 rounded-2xl border border-slate-300 p-4">
        <h2 className="font-extrabold">계정</h2>
        <p className="text-sm text-slate-600">현재 로그인: {email || displayName || userId}</p>
        <button type="button" onClick={() => void onSignOut()} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-900 font-bold"><LogOut className="h-4 w-4"/>로그아웃</button>
      </section>
    </section>
  );

  if (isEditingAvatar) return (
    <section className="space-y-5 pb-6">
      <button type="button" onClick={() => setIsEditingAvatar(false)} className="flex min-h-11 items-center gap-2 text-sm font-bold text-slate-700"><ArrowLeft className="h-5 w-5"/>프로필로</button>
      <header><h1 className="text-2xl font-extrabold">아바타 꾸미기</h1><p className="mt-1 text-sm text-slate-600">캐릭터와 배경을 선택해 나만의 아바타를 만들어요.</p></header>
      <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white">
        <span className="flex h-32 w-32 items-center justify-center rounded-full text-7xl" style={{ backgroundColor: selectedBackground.color }}>{selectedAvatar.emoji}</span>
        <span className="text-sm font-bold text-slate-600">{isSaving ? '저장 중…' : isLoading ? '불러오는 중…' : '선택하면 자동 저장돼요'}</span>
      </div>
      <section className="space-y-3 rounded-2xl border border-slate-300 p-4">
        <div className="flex items-center gap-2"><UserRound className="h-5 w-5"/><h2 className="font-extrabold">캐릭터</h2></div>
        <div className="grid grid-cols-3 gap-2">
          {AVATAR_CHARACTERS.map((avatar) => <button key={avatar.id} type="button" aria-pressed={profile.characterId === avatar.id} disabled={isLoading || isSaving} onClick={() => void saveProfile({ ...profile, characterId: avatar.id })} className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border transition-transform disabled:opacity-60 ${profile.characterId === avatar.id ? 'scale-[1.03] border-2 border-teal-700 bg-teal-50' : 'border-slate-300 bg-white'}`}><span className="text-3xl" aria-hidden="true">{avatar.emoji}</span><span className="text-xs font-bold">{avatar.label}</span></button>)}
        </div>
        <div className="flex items-center gap-2 pt-2"><Palette className="h-5 w-5"/><h2 className="font-extrabold">배경 색상</h2></div>
        <div className="grid grid-cols-5 gap-2">
          {AVATAR_BACKGROUNDS.map((background) => <button key={background.id} type="button" aria-label={`${background.label} 배경`} aria-pressed={profile.backgroundId === background.id} disabled={isLoading || isSaving} onClick={() => void saveProfile({ ...profile, backgroundId: background.id })} className={`flex h-12 items-center justify-center rounded-xl border transition-transform disabled:opacity-60 ${profile.backgroundId === background.id ? 'scale-105 border-2 border-teal-700' : 'border-slate-300'}`} style={{ backgroundColor: background.color }}>{profile.backgroundId === background.id && <Check className="h-4 w-4 text-slate-950"/>}</button>)}
        </div>
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-300 p-3 text-sm font-semibold text-red-700">{error}</p>}
    </section>
  );

  return (
    <section className="space-y-5 pb-6">
      <header className="flex items-center justify-between gap-3"><div><h1 className="text-2xl font-extrabold">프로필</h1><p className="mt-1 text-sm text-slate-600">계정과 학습 기록을 확인해요.</p></div><button type="button" onClick={() => setIsSettingsOpen(true)} aria-label="설정 열기" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300"><Settings className="h-5 w-5"/></button></header>

      <article className="space-y-4 rounded-2xl border border-slate-300 bg-white p-4">
        <button type="button" onClick={() => setIsEditingAvatar(true)} aria-label="아바타 수정 화면 열기" className="mx-auto flex min-h-28 w-full flex-col items-center justify-center gap-2 rounded-xl active:bg-slate-50">
          <span className="flex h-20 w-20 items-center justify-center rounded-full text-5xl" style={{ backgroundColor: selectedBackground.color }}>{selectedAvatar.emoji}</span>
          <span className="text-xs font-bold text-teal-800">아바타 수정</span>
        </button>
        <div aria-hidden="true" className="h-px w-full bg-slate-300" />
        <div className="space-y-2">
          <h2 className="font-extrabold">계정 정보</h2>
          <InfoRow label="아이디" value={email || userId} />
          <InfoRow label="닉네임" value={displayName || 'tudu 학습자'} />
        </div>
      </article>

      <section className="space-y-3">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5"/><h2 className="font-extrabold">학습 기록과 업적</h2></div>
        <div className="grid grid-cols-2 gap-2">
          <StatCard label={`${subjectNames[subject]} 순위`} value={rank ? `${rank}위` : '—'} detail={`${xp[subject].toLocaleString()} XP`} />
          <StatCard label="종합 순위" value={overallRank ? `${overallRank}위` : '—'} detail="전체 과목 기준" />
          <StatCard label="총 경험치" value={`${(wallet?.xp ?? 0).toLocaleString()} XP`} detail="모든 과목 합계" />
          <StatCard label="보유 크레딧" value={(wallet?.credits ?? 0).toLocaleString()} detail="학습 보상" />
          <StatCard label="AI 토큰" value={(wallet?.tokens ?? 0).toLocaleString()} detail="문제 분석 사용" />
        </div>
        <div className="rounded-2xl border border-slate-300 p-4">
          <h3 className="mb-3 font-bold">과목별 경험치</h3>
          <div className="divide-y divide-slate-200">{(['math', 'science', 'english'] as const).map((item) => <div key={item} className="flex min-h-11 items-center justify-between text-sm"><span className="font-semibold">{subjectNames[item]}</span><span className="tabular-nums text-slate-600">{xp[item].toLocaleString()} XP</span></div>)}</div>
        </div>
        <div className="grid gap-2">
          {achievements.map((item) => {
            const complete = item.value >= item.target;
            const progress = Math.min(100, Math.round((item.value / item.target) * 100));
            return <article key={item.id} className={`rounded-2xl border p-4 ${complete ? 'border-teal-700 bg-teal-50' : 'border-slate-300 bg-white'}`}>
              <div className="flex items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${complete ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}><Award className="h-5 w-5"/></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-bold">{item.title}</h3><span className="text-xs font-bold text-slate-600">{complete ? '달성' : `${progress}%`}</span></div><p className="text-sm text-slate-600">{item.description}</p>{!complete && <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }}/></div>}</div></div>
            </article>;
          })}
        </div>
      </section>
      {error && <p role="alert" className="rounded-xl border border-red-300 p-3 text-sm font-semibold text-red-700">{error}</p>}
      {isLoading && <p className="text-center text-sm text-slate-500">아바타 정보를 불러오는 중이에요.</p>}
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-3 border-t border-slate-200 pt-3 text-sm"><span className="shrink-0 text-slate-500">{label}</span><span className="min-w-0 break-all text-right font-semibold">{value}</span></div>;
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <div className="min-w-0 rounded-2xl border border-slate-300 p-3"><span className="block text-xs font-semibold text-slate-600">{label}</span><strong className="mt-1 block truncate text-lg tabular-nums">{value}</strong><span className="mt-0.5 block truncate text-xs text-slate-500">{detail}</span></div>;
}
