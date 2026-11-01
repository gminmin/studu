'use client';

import React, { useState, useEffect } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
import { Header } from '@/components/Header';
import { MobileScanView } from '@/components/MobileScanView';
import { LearningFlowView } from '@/components/LearningFlowView';
import { WrongNoteView } from '@/components/WrongNoteView';
import { TwinProblemModal } from '@/components/TwinProblemModal';
import { AccountModal } from '@/components/AccountModal';
import { auth, firebaseConfigured } from '@/lib/firebase/client';
import { WifiOff } from 'lucide-react';

type AppStep = 'scan' | 'hints' | 'solution';

export default function Home() {
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
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);
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

  useEffect(() => {
    if (!auth) {
      queueMicrotask(() => setIsAuthLoading(false));
      return;
    }

    let active = true;
    getRedirectResult(auth).catch((error: unknown) => {
      if (active) setAuthError(getAuthErrorMessage(error));
    });
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setIsAuthLoading(false);
    }, () => {
      if (active) {
        setUser(null);
        setIsAuthLoading(false);
        setAuthError('로그인 상태를 확인하지 못했어요. 다시 시도해주세요.');
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    if (!auth) return;
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthActionLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) {
        await signInWithRedirect(auth, provider);
        return;
      }
      await signInWithPopup(auth, provider);
      setIsAccountModalOpen(false);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
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
      setIsAccountModalOpen(false);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthActionLoading(false);
    }
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    if (!auth) return;
    setAuthError(null);
    setAuthMessage(null);
    setIsAuthActionLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setIsAccountModalOpen(false);
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsAuthActionLoading(false);
    }
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
      setIsAccountModalOpen(false);
    } catch {
      setAuthError('로그아웃하지 못했어요. 다시 시도해주세요.');
    } finally {
      setIsAuthActionLoading(false);
    }
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
      setAuthError('문제를 분석하려면 Google 계정으로 로그인해주세요.');
      setIsAccountModalOpen(true);
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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || '문제 분석 실패');
      }

      setProblemData(data);
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
  };

  const isLearning = activeTab === 'scan' && (currentStep === 'hints' || currentStep === 'solution') && Boolean(problemData);

  return (
      <div className="fixed inset-0 flex h-dvh w-full flex-col overflow-hidden bg-white text-slate-900">
      {/* ⚠️ 네트워크 연결 끊김 글로벌 알림 배너 */}
      {(isOffline || networkErrorMsg) && (
        <div className="z-50 flex shrink-0 items-center justify-center gap-2 border-b border-slate-900 bg-slate-900 px-4 py-2 text-center text-sm font-bold text-white">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{networkErrorMsg || '네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.'}</span>
        </div>
      )}

      {/* 모바일 상단 미니 바 */}
      {!isLearning && <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'scan' && currentStep !== 'scan' && !problemData) {
            setCurrentStep('scan');
          }
        }}
        wrongNoteCount={wrongNotes.length}
        user={user}
        onOpenAccount={() => {
          setAuthError(null);
          setAuthMessage(null);
          setIsAccountModalOpen(true);
        }}
      />}

      {/* 메인 뷰포트 영역 (전체 화면 높이 꽉 차게) */}
      <main className="relative flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        {activeTab === 'scan' && (
          <div className="relative min-h-0 w-full flex-1">
            {currentStep === 'scan' && (
              <MobileScanView
                currentSubject={currentSubject}
                onSubjectChange={setCurrentSubject}
                modelMode={modelMode}
                onModelModeChange={setModelMode}
                onStartAnalysis={handleStartAnalysis}
                isLoading={isLoading}
                isOffline={isOffline}
              />
            )}

            {(currentStep === 'hints' || currentStep === 'solution') && problemData && (
              <div className="h-full w-full overflow-hidden">
                <LearningFlowView
                  data={problemData}
                  onSolveAlone={handleSolveAlone}
                  onSaveToWrongNote={() => handleSaveToWrongNote('concept')}
                  onOpenTwinProblem={handleOpenCurrentTwinProblem}
                  onExit={handleExitLearning}
                />
              </div>
            )}
          </div>
        )}

        {/* 오답노트 보관함 */}
        {activeTab === 'wrongNote' && (
          <div className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:p-4">
            <WrongNoteView
              notes={wrongNotes}
              onDeleteNote={handleDeleteNote}
              onOpenTwin={handleOpenNoteTwinProblem}
              onSelectNoteDetail={handleSelectNoteDetail}
            />
          </div>
        )}
      </main>

      <AccountModal
        isOpen={isAccountModalOpen}
        user={user}
        isLoading={isAuthLoading || isAuthActionLoading}
        error={authError}
        message={authMessage}
        isConfigured={firebaseConfigured}
        onClose={() => {
          setAuthError(null);
          setAuthMessage(null);
          setIsAccountModalOpen(false);
        }}
        onSignIn={handleSignIn}
        onEmailSignIn={handleEmailSignIn}
        onEmailSignUp={handleEmailSignUp}
        onPasswordReset={handlePasswordReset}
        onSignOut={handleSignOut}
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
  const code = (error as { code?: string })?.code;
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
    return '이메일/비밀번호 로그인이 꺼져 있어요. Firebase Authentication 설정에서 이메일/비밀번호 제공자를 켜주세요.';
  }
  if (code === 'auth/email-already-in-use') {
    return '이미 가입된 이메일이에요. 로그인하거나 비밀번호를 재설정해주세요.';
  }
  if (code === 'auth/invalid-email') {
    return '이메일 주소를 확인해주세요.';
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
  return 'Google 로그인에 실패했어요. 잠시 후 다시 시도해주세요.';
}
