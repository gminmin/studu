'use client';

import React, { useState, useEffect } from 'react';
import {
  SubjectType,
  AIModelMode,
  StandardProblemResponse,
  WrongNoteItem,
  MistakeReason,
} from '@/types/problem';
import { Header } from '@/components/Header';
import { MobileScanView } from '@/components/MobileScanView';
import { HintLadderView } from '@/components/HintLadderView';
import { SolutionView } from '@/components/SolutionView';
import { WrongNoteView } from '@/components/WrongNoteView';
import { TwinProblemModal } from '@/components/TwinProblemModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { WifiOff } from 'lucide-react';

type AppStep = 'scan' | 'hints' | 'solution';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'scan' | 'wrongNote'>('scan');
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
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);
  const [isTwinModalOpen, setIsTwinModalOpen] = useState<boolean>(false);
  const [activeTwinProblem, setActiveTwinProblem] = useState<{
    problem: StandardProblemResponse['twinProblem'];
    topic: string;
    noteId?: string;
  } | null>(null);

  // BYOK 커스텀 키 상태
  const [customApiKey, setCustomApiKey] = useState<string>('');

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
      setIsOffline(!navigator.onLine);
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
    const savedKey = localStorage.getItem('gemini_custom_api_key') || '';
    setCustomApiKey(savedKey);

    const savedNotes = localStorage.getItem('solvify_wrong_notes');
    if (savedNotes) {
      try {
        setWrongNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.warn('Failed to parse saved notes', e);
      }
    }
  }, []);

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
    setNetworkErrorMsg(null);

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
          ...(customApiKey ? { 'x-gemini-api-key': customApiKey } : {}),
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
    } catch (err: any) {
      console.error('Analysis error:', err);
      const isFetchNetworkError =
        err?.name === 'TypeError' ||
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError');

      if (isFetchNetworkError || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setIsOffline(true);
        const msg = '네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.';
        setNetworkErrorMsg(msg);
        alert(msg);
      } else {
        alert(err.message || '문제 분석 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSolveAlone = () => {
    setIsSolvedAlone(true);
  };

  const handleGiveUp = () => {
    setCurrentStep('solution');
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
    setProblemData(note);
    setCurrentSubject(note.subject);
    setIsSolvedAlone(note.status === 'solved_alone');
    setCurrentStep('solution');
    setActiveTab('scan');
  };

  const handleDeleteNote = (id: string) => {
    const updated = wrongNotes.filter((n) => n.id !== id);
    saveWrongNotes(updated);
  };

  return (
    <div className="fixed inset-0 w-full h-dvh flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      {/* ⚠️ 네트워크 연결 끊김 글로벌 알림 배너 */}
      {(isOffline || networkErrorMsg) && (
        <div className="bg-rose-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm shrink-0 z-50 animate-in slide-in-from-top">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          <span>{networkErrorMsg || '네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.'}</span>
        </div>
      )}

      {/* 모바일 상단 미니 바 */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'scan' && currentStep !== 'scan' && !problemData) {
            setCurrentStep('scan');
          }
        }}
        wrongNoteCount={wrongNotes.length}
      />

      {/* 메인 뷰포트 영역 (전체 화면 높이 꽉 차게) */}
      <main className="flex-1 relative w-full h-full overflow-hidden flex flex-col">
        {activeTab === 'scan' && (
          <div className="w-full h-full flex-1 relative">
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

            {currentStep === 'hints' && problemData && (
              <div className="w-full h-full overflow-y-auto p-4 max-w-md mx-auto">
                <HintLadderView
                  data={problemData}
                  onSolveAlone={handleSolveAlone}
                  onGiveUp={handleGiveUp}
                  onReScan={() => setCurrentStep('scan')}
                />
              </div>
            )}

            {currentStep === 'solution' && problemData && (
              <div className="w-full h-full overflow-y-auto p-4 max-w-md mx-auto">
                <SolutionView
                  data={problemData}
                  isSolvedAlone={isSolvedAlone}
                  onOpenTwinProblem={handleOpenCurrentTwinProblem}
                  onSaveToWrongNote={handleSaveToWrongNote}
                  onBackToScan={() => setCurrentStep('scan')}
                />
              </div>
            )}
          </div>
        )}

        {/* 오답노트 보관함 */}
        {activeTab === 'wrongNote' && (
          <div className="w-full h-full overflow-y-auto p-4 max-w-md mx-auto">
            <WrongNoteView
              notes={wrongNotes}
              onDeleteNote={handleDeleteNote}
              onOpenTwin={handleOpenNoteTwinProblem}
              onSelectNoteDetail={handleSelectNoteDetail}
            />
          </div>
        )}
      </main>

      {/* 모달 1: Gemini API Key 설정 */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaved={setCustomApiKey}
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
