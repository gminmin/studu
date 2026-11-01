'use client';

import React, { useState } from 'react';
import { ArrowLeft, LogOut, UserRound } from 'lucide-react';
import type { FormEvent } from 'react';
import type { User } from 'firebase/auth';

type SignupStage = 'sent' | 'confirm' | 'nickname' | null;
type AuthView = 'login' | 'signup' | 'reset';

interface AuthScreenProps {
  isOpen: boolean;
  user: User | null;
  signupStage: SignupStage;
  signupEmail: string;
  isLoading: boolean;
  error: string | null;
  message: string | null;
  isConfigured: boolean;
  onClose: () => void;
  onGoogleSignIn: () => void;
  onEmailSignIn: (email: string, password: string) => void;
  onSendEmailLink: (email: string, password: string) => void;
  onCompleteEmailLink: (email: string) => void;
  onSetNickname: (nickname: string) => Promise<boolean>;
  onPasswordReset: (email: string) => void;
  onCancelSignup: () => void;
  onSignOut: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  isOpen,
  user,
  signupStage,
  signupEmail,
  isLoading,
  error,
  message,
  isConfigured,
  onClose,
  onGoogleSignIn,
  onEmailSignIn,
  onSendEmailLink,
  onCompleteEmailLink,
  onSetNickname,
  onPasswordReset,
  onCancelSignup,
  onSignOut,
}) => {
  const [view, setView] = useState<AuthView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [nickname, setNickname] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  if (!isOpen) return null;

  const close = () => {
    setPassword('');
    setPasswordConfirm('');
    setLocalError(null);
    onClose();
  };

  const submitLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPassword('');
    onEmailSignIn(email.trim(), password);
  };

  const submitEmailLink = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    if (password.length < 6) {
      setLocalError('비밀번호는 6자 이상으로 입력해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setLocalError('비밀번호가 서로 달라요. 다시 확인해주세요.');
      return;
    }
    onSendEmailLink(email.trim(), password);
  };

  const submitLinkConfirmation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    onCompleteEmailLink(email.trim());
  };

  const submitNickname = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError(null);
    const cleanNickname = nickname.trim();
    if (cleanNickname.length < 2 || cleanNickname.length > 20) {
      setLocalError('닉네임은 2자에서 20자 사이로 입력해주세요.');
      return;
    }
    await onSetNickname(cleanNickname);
  };

  const signupInProgress = signupStage !== null;
  const heading = user && !signupInProgress
    ? '내 계정'
    : signupStage === 'sent'
      ? '이메일을 확인해주세요'
      : signupStage === 'confirm'
        ? '인증 링크를 확인할게요'
      : signupStage === 'nickname'
            ? '닉네임 설정'
            : view === 'signup'
              ? '이메일로 가입하기'
              : view === 'reset'
                ? '비밀번호 재설정'
                : '다시 만나 반가워요';

  return (
    <main className="fixed inset-0 z-[80] flex min-h-dvh flex-col overflow-y-auto bg-white text-slate-950">
      <header className="flex min-h-16 shrink-0 items-center justify-between border-b border-slate-300 px-4 sm:px-6">
        <span className="text-lg font-black tracking-tight">tudu</span>
        <button
          type="button"
          onClick={close}
          className="flex min-h-12 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-slate-700"
          aria-label="로그인 화면 닫기"
        >
          <ArrowLeft className="h-5 w-5" /> 돌아가기
        </button>
      </header>

      <section className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-4 sm:px-8 sm:py-6">
        <div className="mb-4">
          <p className="text-sm font-semibold text-slate-600">tudu 계정</p>
          <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight">{heading}</h1>
          <p className="mt-2 text-sm leading-5 text-slate-600">
            {signupStage === 'sent'
              ? `${signupEmail} 주소로 보낸 링크를 눌러 이메일을 확인해주세요.`
              : signupStage === 'nickname'
                  ? '학습 화면에서 사용할 닉네임을 정해주세요.'
                  : signupStage === 'confirm'
                    ? '링크를 다른 기기에서 열었어요. 인증에 사용한 이메일 주소를 입력해주세요.'
                    : '계정에 로그인하면 학습 기록과 지갑 기능을 이어서 사용할 수 있어요.'}
          </p>
        </div>

        {user && !signupInProgress ? (
          <div className="space-y-5">
            <div className="flex items-center gap-3 border-y border-slate-300 py-5">
              {user.photoURL ? (
                // Firebase profile photo is an external user-provided URL.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt="" className="h-12 w-12 rounded-full" />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <UserRound className="h-5 w-5 text-slate-700" />
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold">{user.displayName || 'tudu 사용자'}</p>
                <p className="truncate text-sm text-slate-600">{user.email}</p>
              </div>
            </div>
            <button type="button" onClick={onSignOut} disabled={isLoading} className={secondaryButtonClass}>
              <LogOut className="mr-2 h-5 w-5" /> 로그아웃
            </button>
          </div>
        ) : signupStage === 'sent' ? (
          <div className="space-y-4">
            <div className="border-y border-slate-300 py-5 text-sm leading-6 text-slate-700">
              메일함에서 인증 링크를 열면 이 화면으로 돌아와 비밀번호를 설정할 수 있어요. 메일이 보이지 않으면 스팸함도 확인해주세요.
            </div>
            {error && <ErrorText>{error}</ErrorText>}
            <button type="button" onClick={() => onSendEmailLink(signupEmail, password)} disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? '보내는 중…' : '인증 이메일 다시 보내기'}
            </button>
            <button type="button" onClick={onCancelSignup} className={secondaryButtonClass}>로그인으로 돌아가기</button>
          </div>
        ) : signupStage === 'confirm' ? (
          <form onSubmit={submitLinkConfirmation} className="space-y-4">
            <Field label="인증에 사용한 이메일" htmlFor="auth-confirm-email">
              <input id="auth-confirm-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="name@example.com" />
            </Field>
            {error && <ErrorText>{error}</ErrorText>}
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? '이메일 확인 중…' : '이메일 확인하기'}
            </button>
          </form>
        ) : signupStage === 'nickname' ? (
          <form onSubmit={submitNickname} className="space-y-4">
            <Field label="닉네임" htmlFor="auth-nickname">
              <input id="auth-nickname" type="text" autoComplete="nickname" minLength={2} maxLength={20} required value={nickname} onChange={(event) => setNickname(event.target.value)} className={inputClass} placeholder="2~20자" />
            </Field>
            {localError && <ErrorText>{localError}</ErrorText>}
            {error && <ErrorText>{error}</ErrorText>}
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? '저장 중…' : '닉네임 저장하고 시작하기'}
            </button>
          </form>
        ) : !isConfigured ? (
          <p className="border-y border-slate-300 py-4 text-sm leading-6 text-slate-700">
            Firebase 설정이 아직 연결되지 않았어요. 환경 변수 설정 후 다시 시도해주세요.
          </p>
        ) : view === 'reset' ? (
          <form onSubmit={(event) => { event.preventDefault(); onPasswordReset(email.trim()); }} className="space-y-4">
            <Field label="이메일" htmlFor="auth-reset-email">
              <input id="auth-reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="name@example.com" />
            </Field>
            {error && <ErrorText>{error}</ErrorText>}
            {message && <p role="status" className="text-sm text-slate-700">{message}</p>}
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? '보내는 중…' : '재설정 이메일 보내기'}
            </button>
            <button type="button" onClick={() => setView('login')} className={secondaryButtonClass}>로그인으로 돌아가기</button>
          </form>
        ) : view === 'signup' ? (
          <form onSubmit={submitEmailLink} className="space-y-4">
            <Field label="이메일" htmlFor="auth-signup-email">
              <input id="auth-signup-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="name@example.com" />
            </Field>
            <Field label="비밀번호" htmlFor="auth-signup-password">
              <input id="auth-signup-password" type="password" autoComplete="new-password" minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="6자 이상" />
            </Field>
            <Field label="비밀번호 확인" htmlFor="auth-signup-password-confirm">
              <input id="auth-signup-password-confirm" type="password" autoComplete="new-password" minLength={6} required value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} className={inputClass} placeholder="비밀번호를 다시 입력하세요" />
            </Field>
            {localError && <ErrorText>{localError}</ErrorText>}
            {error && <ErrorText>{error}</ErrorText>}
            <button type="submit" disabled={isLoading} className={primaryButtonClass}>
              {isLoading ? '인증 이메일 보내는 중…' : '가입하고 인증 이메일 받기'}
            </button>
            <button type="button" onClick={() => { setView('login'); onCancelSignup(); }} className={secondaryButtonClass}>로그인으로 돌아가기</button>
          </form>
        ) : (
          <div className="space-y-2.5">
            <form onSubmit={submitLogin} className="space-y-2.5">
              <Field label="이메일" htmlFor="auth-login-email">
                <input id="auth-login-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="name@example.com" />
              </Field>
              <Field label="비밀번호" htmlFor="auth-login-password">
                <input id="auth-login-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder="비밀번호" />
              </Field>
              {error && <ErrorText>{error}</ErrorText>}
              <button type="submit" disabled={isLoading} className={primaryButtonClass}>
                {isLoading ? '로그인 중…' : '이메일로 로그인'}
              </button>
            </form>
            <div className="mx-auto grid w-fit grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm font-medium text-slate-500">
              <button type="button" onClick={() => setView('reset')} className="justify-self-end py-1">비밀번호 찾기</button>
              <span aria-hidden="true" className="h-4 w-px bg-slate-300" />
              <button type="button" onClick={() => { setView('signup'); setLocalError(null); }} className="justify-self-start py-1">가입하기</button>
            </div>
            <Divider />
            <button type="button" onClick={onGoogleSignIn} disabled={isLoading} className={secondaryButtonClass}>
              <GoogleMark /> Google로 계속하기
            </button>
          </div>
        )}

        {message && signupStage !== 'sent' && view !== 'reset' && (
          <p role="status" className="mt-4 text-center text-sm text-slate-700">{message}</p>
        )}
        <p className="mt-4 text-center text-xs leading-5 text-slate-500">
          귀하의 정보는 동의 없이 공개되지 않습니다.
        </p>
      </section>
    </main>
  );
};

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="block space-y-2 text-sm font-semibold text-slate-800">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p role="alert" className="text-sm font-medium leading-6 text-red-700">{children}</p>;
}

function Divider() {
  return (
    <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-4 py-1 text-xs text-slate-500">
      <span className="h-px flex-1 bg-slate-300" />
      <span>또는</span>
      <span className="h-px flex-1 bg-slate-300" />
    </div>
  );
}

const inputClass = 'min-h-12 w-full rounded-xl border border-slate-400 px-4 text-base font-normal text-slate-950 focus:border-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200';
const primaryButtonClass = 'flex min-h-12 w-full items-center justify-center rounded-xl border border-slate-900 bg-slate-900 px-4 text-base font-bold text-white disabled:opacity-50';
const secondaryButtonClass = 'flex min-h-11 w-full items-center justify-center rounded-xl border border-slate-400 px-4 text-sm font-semibold text-slate-900 disabled:opacity-50';

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="mr-2 h-5 w-5 rounded-full bg-white p-0.5">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.59-4.1H3.06v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.41 13.94a6 6 0 0 1 0-3.88v-2.6H3.06a10 10 0 0 0 0 9.08l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C16.95 2.98 14.7 2 12 2a10 10 0 0 0-8.94 5.46l3.35 2.6c.79-2.35 2.99-4.1 5.59-4.1Z" />
    </svg>
  );
}
