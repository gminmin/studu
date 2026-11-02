'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  getRedirectResult,
  signInWithRedirect,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  isSignInWithEmailLink,
  updatePassword,
  sendPasswordResetEmail,
  updateProfile,
  reload,
  signOut,
  type User,
} from 'firebase/auth';
import {
  SubjectType,
  AIModelMode,
  StandardProblemResponse,
  WrongNoteItem,
  MistakeReason,
} from '@/types/problem';
import { MobileScanView } from '@/components/MobileScanView';
import { LearningFlowView } from '@/components/LearningFlowView';
import { WrongNoteView } from '@/components/WrongNoteView';
import { TwinProblemModal } from '@/components/TwinProblemModal';
import { AuthScreen } from '@/components/AuthScreen';
import { EconomyPanel } from '@/components/EconomyPanel';
import { MainHome, type MainTab } from '@/components/MainHome';
import { auth, firebaseConfigured } from '@/lib/firebase/client';
import type { Wallet } from '@/lib/economy';
import { WifiOff, X } from 'lucide-react';

type AppStep = 'scan' | 'hints' | 'solution';
type SignupStage = 'sent' | 'confirm' | 'password' | 'nickname' | null;
type EconomyLeader = { uid: string; rank: number; displayName: string; xp: number; isMe: boolean };
type WalletTransaction = { id: string; currency: string; amount: number; tokenAmount?: number; xp?: number; reason: string };

export default function Home() {
  const [mainTab, setMainTab] = useState<MainTab>('home');
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isScanExitConfirmOpen, setIsScanExitConfirmOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'wrongNote'>('scan');
  const [learningReturnTab, setLearningReturnTab] = useState<'scan' | 'wrongNote'>('scan');
  const [currentStep, setCurrentStep] = useState<AppStep>('scan');
  const [currentSubject, setCurrentSubject] = useState<SubjectType>('math');
  const [modelMode, setModelMode] = useState<AIModelMode>('speed');

  // 네트워크 오프라인 상태 관리
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [networkErrorMsg, setNetworkErrorMsg] = useState<string | null>(null);

  // 분석 결과 데이터
  const [problemData, setProblemData] = useState<StandardProblemResponse | null>(null);
  const [isSolvedAlone, setIsSolvedAlone] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 모달 상태
  const [isAuthScreenOpen, setIsAuthScreenOpen] = useState<boolean>(true);
  const [signupStage, setSignupStage] = useState<SignupStage>(null);
  const [signupEmail, setSignupEmail] = useState('');
  const [isTwinModalOpen, setIsTwinModalOpen] = useState<boolean>(false);
  const [activeTwinProblem, setActiveTwinProblem] = useState<{
    problem: StandardProblemResponse['twinProblem'];
    topic: string;
    noteId?: string;
  } | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthActionLoading, setIsAuthActionLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // 오답노트 상태
  const [wrongNotes, setWrongNotes] = useState<WrongNoteItem[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [leaders, setLeaders] = useState<EconomyLeader[]>([]);
  const [walletRank, setWalletRank] = useState<number | null>(null);
  const [walletOverallRank, setWalletOverallRank] = useState<number | null>(null);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [isEconomyPanelOpen, setIsEconomyPanelOpen] = useState(false);
  const [isEconomyLoading, setIsEconomyLoading] = useState(false);
  const [economyError, setEconomyError] = useState<string | null>(null);

  useEffect(() => {
    const savedSubject = localStorage.getItem('tudu_default_subject');
    if (savedSubject === 'math' || savedSubject === 'science' || savedSubject === 'english') {
      queueMicrotask(() => setCurrentSubject(savedSubject));
    }
  }, []);

  const handleSubjectPreferenceChange = useCallback((subject: SubjectType) => {
    setCurrentSubject(subject);
    localStorage.setItem('tudu_default_subject', subject);
  }, []);

  const refreshEconomy = useCallback(async (currentUser: User) => {
    const response = await fetch(`/api/economy?subject=${currentSubject}`, {
      headers: { Authorization: `Bearer ${await currentUser.getIdToken()}` },
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || '지갑 정보를 불러오지 못했어요.');
    setWallet(data.wallet);
    setLeaders(data.leaders || []);
    setWalletRank(data.rank ?? null);
    setWalletOverallRank(data.overallRank ?? null);
    setWalletTransactions(data.transactions || []);
    return data;
  }, [currentSubject]);

  const getCurrentIdToken = useCallback(() => user?.getIdToken() ?? Promise.resolve(''), [user]);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => {
        setWallet(null);
        setLeaders([]);
        setWalletRank(null);
        setWalletOverallRank(null);
        setWalletTransactions([]);
      });
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      void refreshEconomy(user).catch((error: unknown) => {
        if (active) setEconomyError((error as Error).message || '지갑 정보를 불러오지 못했어요.');
      });
    });
    return () => { active = false; };
  }, [user, refreshEconomy]);

  const handleCompleteEmailLink = useCallback(async (email: string) => {
    if (!auth || typeof window === 'undefined') {
      setAuthError('인증 링크가 유효하지 않거나 만료됐어요. 인증 메일을 다시 요청해 주세요.');
      return;
    }
    setAuthError(null);
    setIsAuthActionLoading(true);
    try {
      const pendingEmailLink = isSignInWithEmailLink(auth, window.location.href);
      if (pendingEmailLink) {
        await signInWithEmailLink(auth, email, window.location.href);
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (auth.currentUser?.email !== email) {
        throw new Error('인증 링크가 유효하지 않거나 만료됐어요. 인증 메일을 다시 요청해 주세요.');
      }
      if (!auth.currentUser) throw new Error('인증 후 계정을 확인하지 못했어요.');
      localStorage.removeItem('tudu_signup_email');
      localStorage.setItem('tudu_signup_stage', 'password');
      setSignupEmail(email);
      setSignupStage('password');
      setAuthError(null);
      setIsAuthScreenOpen(true);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthActionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      queueMicrotask(() => setIsAuthLoading(false));
      return;
    }
    let active = true;
    getRedirectResult(auth).catch((error) => {
      if (active) setAuthError(getAuthErrorMessage(error));
    });
    if (isSignInWithEmailLink(auth, window.location.href)) {
      const savedEmail = localStorage.getItem('tudu_signup_email');
      if (savedEmail) {
        queueMicrotask(() => {
          if (!active) return;
          setSignupEmail(savedEmail);
          setSignupStage('confirm');
          setIsAuthScreenOpen(true);
          void handleCompleteEmailLink(savedEmail);
        });
      } else {
        queueMicrotask(() => {
          if (!active) return;
          if (savedEmail) setSignupEmail(savedEmail);
          setSignupStage('confirm');
          setIsAuthScreenOpen(true);
        });
      }
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setIsAuthLoading(false);
      const stage = localStorage.getItem('tudu_signup_stage');
      if (stage === 'password' || stage === 'nickname') {
        setSignupStage(stage);
        setSignupEmail(nextUser?.email ?? localStorage.getItem('tudu_signup_email') ?? '');
        setIsAuthScreenOpen(true);
      } else if (stage === 'sent' || stage === 'confirm') {
        setIsAuthScreenOpen(true);
      } else {
        setIsAuthScreenOpen(!nextUser);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [handleCompleteEmailLink]);

  // 네트워크 상태 감지 리스너
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setNetworkErrorMsg(null);
    };
    const handleOffline = () => {
      setIsOffline(true);
      setNetworkErrorMsg('네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.');
    };

    if (typeof window !== 'undefined') {
      queueMicrotask(() => setIsOffline(!navigator.onLine));
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 로컬 스토리지 로드
  useEffect(() => {
    localStorage.removeItem('gemini_custom_api_key');
    const savedNotes = localStorage.getItem('solvify_wrong_notes');
    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes) as WrongNoteItem[];
        queueMicrotask(() => setWrongNotes(parsedNotes));
      } catch (e) {
        console.warn('Failed to parse saved notes', e);
      }
    }
  }, []);

  const handleSignIn = async () => {
    if (!auth) return;
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthActionLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      setIsAuthActionLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string) => {
    if (!auth) return;
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthActionLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setSignupStage(null);
      setIsAuthScreenOpen(false);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleSendEmailLink = async (email: string) => {
    if (!auth) return;
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthActionLoading(true);
    try {
      await sendSignInLinkToEmail(auth, email, {
        url: `${window.location.origin}/?signup=email`,
        handleCodeInApp: true,
      });
      localStorage.setItem('tudu_signup_email', email);
      localStorage.setItem('tudu_signup_stage', 'sent');
      setAuthError(null);
      setSignupEmail(email);
      setSignupStage('sent');
      setIsAuthScreenOpen(true);
    } catch (error) {
      console.error('[tudu auth] Email link send failed', error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleSetSignupPassword = async (password: string) => {
    if (!auth?.currentUser) return false;
    setAuthError(null);
    setIsAuthActionLoading(true);
    try {
      await updatePassword(auth.currentUser, password);
      localStorage.setItem('tudu_signup_stage', 'nickname');
      setSignupStage('nickname');
      return true;
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleSetSignupNickname = async (nickname: string) => {
    if (!auth?.currentUser) return false;
    setAuthError(null);
    setIsAuthActionLoading(true);
    try {
      await updateProfile(auth.currentUser, { displayName: nickname });
      await reload(auth.currentUser);
      setUser(auth.currentUser);
      localStorage.removeItem('tudu_signup_email');
      localStorage.removeItem('tudu_signup_stage');
      setSignupStage(null);
      setIsAuthScreenOpen(false);
      return true;
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
      return false;
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleCancelSignup = () => {
    localStorage.removeItem('tudu_signup_email');
    localStorage.removeItem('tudu_signup_stage');
    setSignupStage(null);
    setSignupEmail('');
    setAuthError(null);
    setIsAuthScreenOpen(!user);
  };

  const handlePasswordReset = async (email: string) => {
    if (!auth) return;
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthActionLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthMessage('비밀번호 재설정 이메일을 보냈어요. 받은 편지함을 확인해주세요.');
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    setIsAuthActionLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      await signOut(auth);
      setSignupStage(null);
      setIsAuthScreenOpen(false);
    } catch {
      setAuthError('로그아웃하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleSubmitLearningAnswer = async (
    sessionId: string,
    answer: string,
    kind: 'answer' | 'review',
  ) => {
    if (!user) throw new Error('로그인이 필요해요.');
    const response = await fetch('/api/rewards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await user.getIdToken()}`,
      },
      body: JSON.stringify({ sessionId, answer, kind }),
    });
    const data = await response.json();
    if (data.wallet) setWallet(data.wallet);
    if (!response.ok) throw new Error(data.error || '답안 확인에 실패했어요.');
    await refreshEconomy(user);
    return data as { correct: boolean; attemptCount: number; reward: { tokens: number; xp: number } | null };
  };

  const handleExchangeCredits = async (credits: number) => {
    if (!user) return;
    setIsEconomyLoading(true);
    setEconomyError(null);
    try {
      const response = await fetch('/api/economy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await user.getIdToken()}`,
        },
        body: JSON.stringify({ transactionId: crypto.randomUUID(), credits }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '환전을 처리하지 못했어요.');
      setWallet(data.wallet);
      await refreshEconomy(user);
    } catch (error) {
      setEconomyError((error as Error).message || '환전을 처리하지 못했어요.');
    } finally {
      setIsEconomyLoading(false);
    }
  };

  const handleExchangeOneCredit = () => {
    void handleExchangeCredits(1);
  };

  const saveWrongNotes = (updated: WrongNoteItem[]) => {
    setWrongNotes(updated);
    localStorage.setItem('solvify_wrong_notes', JSON.stringify(updated));
  };

  const handleStartAnalysis = async (params: {
    imageBase64?: string;
    imageMimeType?: string;
    problemText?: string;
    userContext?: string;
  }) => {
    setLearningReturnTab('scan');
    setNetworkErrorMsg(null);

    if (!user) {
      setAuthError('문제를 분석하려면 로그인해주세요.');
      setIsAuthScreenOpen(true);
      return;
    }

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setNetworkErrorMsg('네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.');
      alert('네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {}),
        },
        body: JSON.stringify({
          subject: currentSubject,
          modelMode,
          imageBase64: params.imageBase64,
          imageMimeType: params.imageMimeType,
          problemText: params.problemText,
          userContext: params.userContext,
          requestId: crypto.randomUUID(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402) {
          setEconomyError(data.error || '크레딧이 부족해요.');
          setIsEconomyPanelOpen(true);
          return;
        }
        throw new Error(data.error || '문제 분석 실패');
      }

      setProblemData(data);
      void refreshEconomy(user).catch(() => undefined);
      setIsSolvedAlone(false);
      setCurrentStep('hints');
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string };
      console.error('Analysis error:', err);
      const isFetchNetworkError =
        error?.name === 'TypeError' ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError');

      if (isFetchNetworkError || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setIsOffline(true);
        const msg = '네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.';
        setNetworkErrorMsg(msg);
        alert(msg);
      } else {
        alert(error.message || '문제 분석 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
      if (user) void refreshEconomy(user).catch(() => undefined);
    }
  };

  const handleSolveAlone = () => {
    setIsSolvedAlone(true);
  };

  const handleSaveToWrongNote = (reason: MistakeReason) => {
    if (!problemData) return;

    const newNote: WrongNoteItem = {
      id: `note-${Date.now()}`,
      ...problemData,
      status: isSolvedAlone ? 'solved_alone' : 'viewed_solution',
      mistakeReason: reason,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNote, ...wrongNotes.filter((n) => n.extractedText !== problemData.extractedText)];
    saveWrongNotes(updated);
  };

  const handleOpenCurrentTwinProblem = () => {
    if (!problemData) return;
    setActiveTwinProblem({
      problem: problemData.twinProblem,
      topic: problemData.topic,
    });
    setIsTwinModalOpen(true);
  };

  const handleOpenNoteTwinProblem = (note: WrongNoteItem) => {
    setActiveTwinProblem({
      problem: note.twinProblem,
      topic: note.topic,
      noteId: note.id,
    });
    setIsTwinModalOpen(true);
  };

  const handleTwinMasterSuccess = () => {
    if (!activeTwinProblem) return;

    if (activeTwinProblem.noteId) {
      const updated = wrongNotes.map((n) =>
        n.id === activeTwinProblem.noteId ? { ...n, status: 'mastered' as const, twinSolved: true } : n
      );
      saveWrongNotes(updated);
    } else if (problemData) {
      const existing = wrongNotes.find((n) => n.extractedText === problemData.extractedText);
      if (existing) {
        const updated = wrongNotes.map((n) =>
          n.id === existing.id ? { ...n, status: 'mastered' as const, twinSolved: true } : n
        );
        saveWrongNotes(updated);
      } else {
        const newNote: WrongNoteItem = {
          id: `note-${Date.now()}`,
          ...problemData,
          status: 'mastered',
          mistakeReason: 'concept',
          createdAt: new Date().toISOString(),
          twinSolved: true,
        };
        saveWrongNotes([newNote, ...wrongNotes]);
      }
    }
  };

  const handleSelectNoteDetail = (note: WrongNoteItem) => {
    setLearningReturnTab('wrongNote');
    setProblemData(note);
    setCurrentSubject(note.subject);
    setIsSolvedAlone(note.status === 'solved_alone');
    setCurrentStep('hints');
    setActiveTab('scan');
  };

  const handleDeleteNote = (id: string) => {
    const updated = wrongNotes.filter((n) => n.id !== id);
    saveWrongNotes(updated);
  };

  const handleExitLearning = () => {
    setCurrentStep('scan');
    setActiveTab(learningReturnTab);
    setMainTab('home');
    setIsScanOpen(false);
  };

  const isLearning = activeTab === 'scan' && (currentStep === 'hints' || currentStep === 'solution') && Boolean(problemData);

  return (
      <div className="fixed inset-0 flex h-dvh w-full flex-col overflow-hidden bg-white text-slate-900">
      {/* ⚠️ 네트워크 연결 끊김 글로벌 알림 배너 */}
      {user && (isOffline || networkErrorMsg) && (
        <div className="z-50 flex shrink-0 items-center justify-center gap-2 border-b border-slate-900 bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{networkErrorMsg || '네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.'}</span>
        </div>
      )}

      {/* 모바일 상단 미니 바 */}
      {user && !isLearning && !isScanOpen && activeTab === 'scan' && <MainHome
        subject={currentSubject}
        onSubjectChange={handleSubjectPreferenceChange}
        wallet={wallet}
        rank={walletRank}
        overallRank={walletOverallRank}
        displayName={user.displayName || 'tudu 학습자'}
        email={user.email || ''}
        userId={user.uid}
        idToken={getCurrentIdToken}
        leaders={leaders}
        activeTab={mainTab}
        onTabChange={setMainTab}
        onStartScan={() => {
          setActiveTab('scan');
          setCurrentStep('scan');
          setMainTab('home');
          setIsScanOpen(true);
        }}
        onStartCall={() => window.alert('?? ??? ?? ????.')}
        onOpenWrongNotes={() => setActiveTab('wrongNote')}
        onOpenStore={() => setMainTab('personal')}
        onExchange={handleExchangeOneCredit}
        onSignOut={handleSignOut}
      />}

      {user && !isLearning && isScanOpen && <main className="relative min-h-0 flex-1 overflow-hidden">
        <MobileScanView
          currentSubject={currentSubject}
          modelMode={modelMode}
          onModelModeChange={setModelMode}
          onStartAnalysis={handleStartAnalysis}
          isLoading={isLoading}
          isOffline={isOffline}
        />
        <button type="button" onClick={() => setIsScanExitConfirmOpen(true)} aria-label="나가기" className="absolute left-4 top-3 z-30 flex min-h-11 min-w-11 items-center justify-center text-white active:opacity-70"><X className="h-7 w-7" strokeWidth={2.8} /></button>
        {isScanExitConfirmOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="scan-exit-title" className="w-full max-w-sm rounded-2xl border border-slate-900 bg-white p-5 text-slate-950">
            <h2 id="scan-exit-title" className="text-lg font-extrabold">촬영을 나갈까요?</h2>
            <p className="mt-2 text-sm leading-5 text-slate-600">계속 촬영하거나 학습 홈으로 돌아갈 수 있어요.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setIsScanExitConfirmOpen(false)} className="min-h-12 rounded-xl border border-slate-400 px-3 text-sm font-bold">계속하기</button>
              <button type="button" onClick={() => { setIsScanExitConfirmOpen(false); setIsScanOpen(false); }} className="min-h-12 rounded-xl border border-slate-900 bg-slate-900 px-3 text-sm font-bold text-white">나가기</button>
            </div>
          </section>
        </div>}
      </main>}

      {user && isLearning && <main className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <div className="relative min-h-0 w-full flex-1">
          <div className="h-full w-full overflow-hidden">
            <LearningFlowView
              data={problemData!}
              isReview={learningReturnTab === 'wrongNote'}
              onSubmitAnswer={handleSubmitLearningAnswer}
              onSolveAlone={handleSolveAlone}
              onSaveToWrongNote={() => handleSaveToWrongNote('concept')}
              onOpenTwinProblem={handleOpenCurrentTwinProblem}
              onExit={handleExitLearning}
            />
          </div>
        </div>
      </main>}

      {user && !isLearning && mainTab === 'home' && activeTab === 'wrongNote' && <main className="min-h-0 flex-1 overflow-y-auto pb-20">
        <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:p-4">
          <button type="button" onClick={() => setActiveTab('scan')} className="mb-3 min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold">← 학습 홈</button>
          <WrongNoteView
            notes={wrongNotes}
            onDeleteNote={handleDeleteNote}
            onOpenTwin={handleOpenNoteTwinProblem}
            onSelectNoteDetail={handleSelectNoteDetail}
          />
        </div>
      </main>}

      <AuthScreen
        isOpen={isAuthScreenOpen}
        user={user}
        signupStage={signupStage}
        signupEmail={signupEmail}
        isLoading={isAuthLoading || isAuthActionLoading}
        error={authError}
        message={authMessage}
        isConfigured={firebaseConfigured}
        onGoogleSignIn={handleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onSendEmailLink={handleSendEmailLink}
        onCompleteEmailLink={handleCompleteEmailLink}
        onSetPassword={handleSetSignupPassword}
        onSetNickname={handleSetSignupNickname}
        onPasswordReset={handlePasswordReset}
        onCancelSignup={handleCancelSignup}
        onSignOut={handleSignOut}
      />

      <EconomyPanel
        isOpen={isEconomyPanelOpen}
        wallet={wallet}
        leaders={leaders}
        rank={walletRank}
        transactions={walletTransactions}
        error={economyError}
        isLoading={isEconomyLoading}
        onClose={() => setIsEconomyPanelOpen(false)}
        onExchange={handleExchangeCredits}
      />

      {/* 모달 2: 쌍둥이 변형 문제 (Twin Problem) */}
      {activeTwinProblem && (
        <TwinProblemModal
          isOpen={isTwinModalOpen}
          onClose={() => setIsTwinModalOpen(false)}
          twinProblem={activeTwinProblem.problem}
          topic={activeTwinProblem.topic}
          onMasterSuccess={handleTwinMasterSuccess}
        />
      )}
    </div>
  );
}

function getAuthErrorMessage(error: unknown): string {
  const authFailure = error as {
    code?: string;
    message?: string;
    errorInfo?: { code?: string; message?: string };
    customData?: { _tokenResponse?: { error?: { message?: string } } };
  } | null;
  const code = authFailure?.code ?? authFailure?.errorInfo?.code;
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return '로그인을 취소했어요.';
  }
  if (code === 'auth/popup-blocked') {
    return '브라우저가 로그인 창을 차단했어요. 다시 시도해주세요.';
  }
  if (code === 'auth/unauthorized-domain') {
    return '이 도메인은 Firebase 로그인에 등록되지 않았어요. Firebase 승인 도메인을 확인해주세요.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return '이 이메일은 다른 로그인 방식으로 가입되어 있어요.';
  }
  if (code === 'auth/operation-not-allowed') {
    return '이메일 인증 로그인이 꺼져 있어요. Firebase Authentication의 이메일/비밀번호와 이메일 링크 제공자를 모두 켜주세요.';
  }
  if (code === 'auth/email-already-in-use') {
    return '이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정해주세요.';
  }
  if (code === 'auth/invalid-email') {
    return '이메일 주소를 확인해주세요.';
  }
  if (code === 'auth/invalid-action-code' || code === 'auth/expired-action-code') {
    return '인증 링크가 이미 사용됐거나 만료됐어요. 인증 이메일을 다시 보내주세요.';
  }
  if (code === 'auth/unauthorized-continue-uri' || code === 'auth/invalid-continue-uri') {
    return '인증 링크 도메인이 Firebase 승인 도메인에 등록되지 않았어요. 현재 사이트 도메인을 추가해주세요.';
  }
  if (code === 'auth/missing-email') {
    return '인증에 사용할 이메일 주소를 입력해주세요.';
  }
  if (code === 'auth/requires-recent-login') {
    return '인증 세션이 만료됐어요. 이메일 인증 링크를 다시 열어주세요.';
  }
  if (code === 'auth/weak-password') {
    return '비밀번호는 6자 이상으로 설정해주세요.';
  }
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return '이메일 또는 비밀번호가 맞지 않아요.';
  }
  if (code === 'auth/too-many-requests') {
    return '시도 횟수가 많아요. 잠시 후 다시 시도해주세요.';
  }
  if (code === 'auth/quota-exceeded') {
    return '오늘 보낼 수 있는 이메일 인증 링크 한도에 도달했어요. 한도가 초기화된 뒤 다시 시도하거나 Firebase 요금제를 확인해주세요.';
  }
  const detail = authFailure?.message ?? authFailure?.errorInfo?.message ?? authFailure?.customData?._tokenResponse?.error?.message;
  return code
    ? `인증 처리에 실패했어요. 오류 코드: ${code}`
    : detail
      ? `인증 처리에 실패했어요. ${detail}`
      : '인증 요청이 Firebase에서 거절됐어요. Firebase Console의 승인 도메인과 이메일 링크 로그인 설정을 확인해주세요.';
}
