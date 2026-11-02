'use client';

import React from 'react';
import { ArrowLeftRight, Coins, Crown, Trophy, X } from 'lucide-react';
import type { Wallet } from '@/lib/economy';

interface Leader {
  uid: string;
  rank: number;
  displayName: string;
  xp: number;
  isMe: boolean;
}
interface WalletTransaction {
  id: string;
  currency: string;
  amount: number;
  tokenAmount?: number;
  xp?: number;
  reason: string;
}

interface EconomyPanelProps {
  isOpen: boolean;
  wallet: Wallet | null;
  leaders: Leader[];
  rank: number | null;
  transactions: WalletTransaction[];
  error: string | null;
  isLoading: boolean;
  onClose: () => void;
  onExchange: (credits: number) => void;
}

export const EconomyPanel: React.FC<EconomyPanelProps> = ({
  isOpen, wallet, leaders, rank, transactions, error, isLoading, onClose, onExchange,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="economy-title" onClick={(event) => event.stopPropagation()} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-slate-900 bg-white p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:rounded-2xl">
        <header className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2"><Coins className="h-5 w-5"/><h2 id="economy-title" className="text-xl font-extrabold">지갑과 순위</h2></div>
          <button type="button" onClick={onClose} aria-label="닫기" className="flex h-11 w-11 items-center justify-center rounded-lg"><X className="h-5 w-5"/></button>
        </header>

        <div className="grid grid-cols-3 gap-2">
          <Balance label="크레딧" value={wallet?.credits} detail="AI 분석" />
          <Balance label="토큰" value={wallet?.tokens} detail="보상·환전" />
          <Balance label="XP" value={wallet?.xp} detail={rank ? `${rank}위` : '전체 순위'} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-y border-slate-300 py-3">
          <p className="text-sm leading-5 text-slate-600">20토큰을 1크레딧으로 바꿔요.</p>
          <button type="button" onClick={() => onExchange(1)} disabled={isLoading || (wallet?.tokens ?? 0) < 20} className="flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-400 px-3 text-sm font-bold disabled:opacity-40"><ArrowLeftRight className="h-4 w-4"/>환전</button>
        </div>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2"><Trophy className="h-4 w-4"/><h3 className="font-bold">XP 전체 순위</h3></div>
          {leaders.length ? <ol className="divide-y divide-slate-200">
            {leaders.map((leader) => <li key={leader.uid} className={`flex min-h-12 items-center gap-3 py-2 text-sm ${leader.isMe ? 'font-bold' : ''}`}>
              <span className="w-7 text-center text-slate-500">{leader.rank === 1 ? <Crown className="mx-auto h-4 w-4"/> : leader.rank}</span>
              <span className="min-w-0 flex-1 truncate">{leader.displayName}{leader.isMe ? ' (나)' : ''}</span>
              <span className="tabular-nums">{leader.xp.toLocaleString()} XP</span>
            </li>)}
          </ol> : <p className="py-3 text-sm text-slate-500">아직 순위 정보가 없어요. 문제를 풀어 XP를 모아보세요.</p>}
        </div>

        <div className="mt-5 border-t border-slate-300 pt-4">
          <h3 className="mb-2 font-bold">최근 지갑 내역</h3>
          {transactions.length ? <ul className="divide-y divide-slate-200">
            {transactions.slice(0, 5).map((item) => <li key={item.id} className="flex min-h-11 items-center justify-between gap-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-700">{transactionLabel(item.reason)}</span>
              <span className="shrink-0 text-right font-semibold tabular-nums">
                {item.reason === 'token_to_credit_exchange'
                  ? `${item.tokenAmount ?? 0}T → +${item.amount}C`
                  : `${item.amount > 0 ? '+' : ''}${item.amount} ${item.currency === 'credits' ? 'C' : 'T'}${item.xp ? ` · +${item.xp} XP` : ''}`}
              </span>
            </li>)}
          </ul> : <p className="text-sm text-slate-500">아직 지갑 내역이 없어요.</p>}
        </div>
      </section>
    </div>
  );
};

function Balance({ label, value, detail }: { label: string; value?: number; detail: string }) {
  return <div className="min-w-0 border border-slate-300 p-3">
    <div className="text-xs font-semibold text-slate-600">{label}</div>
    <div className="mt-1 truncate text-lg font-extrabold tabular-nums">{value === undefined ? '—' : value.toLocaleString()}</div>
    <div className="mt-0.5 truncate text-xs text-slate-500">{detail}</div>
  </div>;
}

function transactionLabel(reason: string) {
  const labels: Record<string, string> = {
    welcome_grant: '가입 환영 크레딧',
    problem_analysis: '문제 분석',
    analysis_refund: '분석 실패 환불',
    problem_solved: '문제 정답 보상',
    wrong_note_solved: '오답노트 복습 보상',
    token_to_credit_exchange: '토큰 환전',
  };
  return labels[reason] || '지갑 변동';
}
