'use client';

import React, { useState } from 'react';
import { LogOut, UserRound, X } from 'lucide-react';
import type { FormEvent } from 'react';
import type { User } from 'firebase/auth';

type AccountView = 'login' | 'signup' | 'reset';

interface AccountModalProps {
  isOpen: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  isConfigured: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => void;
  onEmailSignUp: (email: string, password: string) => void;
  onPasswordReset: (email: string) => void;
  onSignOut: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  user,
  isLoading,
  error,
  message,
  isConfigured,
  onClose,
  onSignIn,
  onEmailSignIn,
  onEmailSignUp,
  onPasswordReset,
  onSignOut,
}) => {
  const [view, setView] = useState<AccountView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const close = () => {
    setPassword('');
    setView('login');
    onClose();
  };

  const submitEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const submittedPassword = password;
    setPassword('');
    if (view === 'signup') onEmailSignUp(normalizedEmail, submittedPassword);
    else onEmailSignIn(normalizedEmail, submittedPassword);
  };

  const submitPasswordReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onPasswordReset(email.trim());
  };

  const title = user
    ? '로그인되어 있어요'
    : view === 'signup'
      ? '이메일로 가입하기'
      : view === 'reset'
        ? '비밀번호 재설정'
        : '로그인하고 이어서 학습해요';

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-title"
        className="w-full max-w-md space-y-5 rounded-t-2xl border border-slate-300 bg-white p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600">tudu 계정</p>
            <h2 id="account-title" className="mt-1 text-xl font-extrabold text-slate-950">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {user ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-300 p-4">
              {user.photoURL ? (
                // Firebase profile photo is an external user-provided URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" className="h-11 w-11 rounded-full" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                  <UserRound className="h-5 w-5 text-slate-700" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-950">{user.displayName || 'tudu 사용자'}</p>
                <p className="truncate text-sm text-slate-600">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              disabled={isLoading}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl border border-slate-400 text-base font-bold text-slate-900 disabled:opacity-50"
            >
              <LogOut className="h-5 w-5" /> 로그아웃
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              계정으로 로그인하면 학습 기록과 지갑 기능을 이어서 사용할 수 있어요.
            </p>

            {error && <p role="alert" className="rounded-lg text-sm font-medium text-red-700">{error}</p>}
            {message && <p role="status" className="rounded-lg text-sm font-medium text-slate-700">{message}</p>}

            {!isConfigured ? (
              <p className="rounded-xl border border-slate-300 p-3 text-sm leading-6 text-slate-700">
                Firebase 설정이 아직 연결되지 않았어요. 환경 변수 설정 후 다시 시도해주세요.
              </p>
            ) : view === 'reset' ? (
              <form onSubmit={submitPasswordReset} className="space-y-3">
                <label className="block space-y-1.5 text-sm font-semibold text-slate-800" htmlFor="account-email">
                  <span>이메일</span>
                  <input
                    id="account-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="min-h-12 w-full rounded-xl border border-slate-400 px-3 text-base font-normal text-slate-950"
                    placeholder="name@example.com"
                  />
                </label>
                <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                  {isLoading ? '보내는 중…' : '재설정 이메일 보내기'}
                </button>
                <button type="button" onClick={() => setView('login')} className={quietButtonClass}>
                  로그인으로 돌아가기
                </button>
              </form>
            ) : (
              <>
                <form onSubmit={submitEmail} className="space-y-3">
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-800" htmlFor="account-email">
                    <span>이메일</span>
                    <input
                      id="account-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="min-h-12 w-full rounded-xl border border-slate-400 px-3 text-base font-normal text-slate-950"
                      placeholder="name@example.com"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-semibold text-slate-800" htmlFor="account-password">
                    <span>비밀번호</span>
                    <input
                      id="account-password"
                      type="password"
                      autoComplete={view === 'signup' ? 'new-password' : 'current-password'}
                      minLength={6}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="min-h-12 w-full rounded-xl border border-slate-400 px-3 text-base font-normal text-slate-950"
                      placeholder="6자 이상"
                    />
                  </label>
                  <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                    {isLoading
                      ? '처리 중…'
                      : view === 'signup'
                        ? '이메일로 가입하기'
                        : '이메일로 로그인'}
                  </button>
                </form>

                {view === 'login' && (
                  <button type="button" onClick={() => setView('reset')} className={quietButtonClass}>
                    비밀번호를 잊으셨나요?
                  </button>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="h-px flex-1 bg-slate-300" />
                  <span>또는</span>
                  <span className="h-px flex-1 bg-slate-300" />
                </div>

                <button
                  type="button"
                  onClick={onSignIn}
                  disabled={isLoading}
                  className="flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-slate-400 bg-white px-4 text-base font-bold text-slate-900 disabled:opacity-50"
                >
                  <GoogleMark />
                  {isLoading ? '연결 중…' : 'Google로 계속하기'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPassword('');
                    setView(view === 'signup' ? 'login' : 'signup');
                  }}
                  disabled={isLoading}
                  className={quietButtonClass}
                >
                  {view === 'signup' ? '이미 계정이 있어요 · 로그인' : '처음이신가요? 이메일로 가입'}
                </button>
              </>
            )}

            <p className="text-center text-xs leading-5 text-slate-500">
              로그인하면 서비스 이용에 필요한 계정 정보가 Firebase에 저장됩니다.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

const primaryButtonClass =
  'flex min-h-14 w-full items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-base font-bold text-white disabled:opacity-50';

const quietButtonClass =
  'flex min-h-11 w-full items-center justify-center text-sm font-semibold text-slate-600 underline underline-offset-4 disabled:opacity-50';

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 rounded-full bg-white p-0.5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.1H3.06v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.94a6 6 0 0 1 0-3.88v-2.6H3.06a10 10 0 0 0 0 9.08l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.94 5.46l3.35 2.6c.79-2.35 2.99-4.1 5.59-4.1Z" />
    </svg>
  );
}
