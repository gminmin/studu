'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubjectType, AIModelMode } from '@/types/problem';
import { SUBJECT_THEME } from '@/lib/subjects/theme';
import {
  Camera,
  Plus,
  ArrowUp,
  RotateCcw,
  Calculator,
  Microscope,
  WifiOff,
  X,
} from 'lucide-react';

interface MobileScanViewProps {
  currentSubject: SubjectType;
  modelMode: AIModelMode;
  onModelModeChange: (mode: AIModelMode) => void;
  onStartAnalysis: (data: {
    imageBase64?: string;
    imageMimeType?: string;
    problemText?: string;
    userContext?: string;
  }) => void;
  isLoading: boolean;
  isOffline: boolean;
}

export const MobileScanView: React.FC<MobileScanViewProps> = ({
  currentSubject,
  modelMode,
  onModelModeChange,
  onStartAnalysis,
  isLoading,
  isOffline,
}) => {
  // 텍스트 입력창 확장 상태 (위로 펼쳐짐)
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [problemText, setProblemText] = useState<string>('');

  // 과목 선택창 가로 확장 상태 (현재 과목 탭 시 옆으로 촤르륵 늘어남)

  // 카메라 및 이미지 프리뷰
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);
  const subjectTheme = SUBJECT_THEME[currentSubject];

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 기본 과목 3종 (수학, 영어, 과학)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (!capturedImage) {
      navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setHasCameraPermission(true);
        })
        .catch((err) => {
          console.warn('Camera access error:', err);
          setHasCameraPermission(false);
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [capturedImage]);

  // 입력창 확장 시 textarea 자동 포커스
  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  // 카메라 셔터 촬영
  const handleShutter = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedImage(dataUrl);
      setImageMime('image/jpeg');
    }
  };

  // 파일 첨부 (+)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 재촬영
  const handleRetake = () => {
    setCapturedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 보내기
  const handleSend = () => {
    if (isOffline) {
      alert('네트워크가 연결되지 않았습니다. 인터넷 연결을 확인해주세요.');
      return;
    }
    if (!capturedImage && !problemText.trim()) {
      alert('카메라로 문제를 촬영하거나 텍스트를 입력해주세요.');
      return;
    }
    onStartAnalysis({
      imageBase64: capturedImage || undefined,
      imageMimeType: imageMime,
      problemText: problemText.trim() || undefined,
    });
  };

  // 현재 과목 아이콘 탭 처리 (가로 확장 토글)

  return (
    <div className="relative flex h-full min-h-0 w-full select-none flex-col justify-between overflow-hidden bg-slate-900">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. 맨 가운데 메인 뷰: 카메라 촬영 화면 (웹캠 / 촬영본)
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0 bg-slate-950 flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <div className="relative w-full h-full flex items-center justify-center bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="촬영된 문제"
              className="w-full h-full object-contain"
            />
          </div>
        ) : hasCameraPermission ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center p-6 text-slate-400 space-y-3">
            <Camera className="w-12 h-12 mx-auto text-slate-500" />
            <p className="text-base">카메라를 켤 수 없습니다.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-12 rounded-xl border border-white bg-white px-4 text-base font-bold text-slate-900 active:opacity-80"
            >
              갤러리 사진 불러오기
            </button>
          </div>
        )}

        {/* 뷰파인더 타겟 가이드라인 */}
        {!capturedImage && (
          <div className="pointer-events-none absolute inset-x-8 top-16 bottom-32 flex flex-col justify-between p-3">
            <div className="flex justify-between">
              <div className="w-6 h-6 rounded-tl-lg border-l-3 border-t-3 border-white" />
              <div className="w-6 h-6 rounded-tr-lg border-r-3 border-t-3 border-white" />
            </div>
            <div className="flex justify-between">
              <div className="w-6 h-6 rounded-bl-lg border-b-3 border-l-3 border-white" />
              <div className="w-6 h-6 rounded-br-lg border-b-3 border-r-3 border-white" />
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 우측 상단: 끊김 없는 무한 롤링 과목 휠 & 가로 확장 인터랙션
             - [무한 스크롤]: 마지막 과목 뒤에 첫 과목이 자연스럽게 이어짐
             - [가로 확장]: 현재 과목 탭 시 옆으로 늘어나 전체 한눈에 보기
         ───────────────────────────────────────────────────────────── */}
      <div aria-hidden="true" className="pointer-events-none absolute right-5 top-5 z-30">
        <SubjectGlyph subject={currentSubject} color={subjectTheme.color} />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ⭐️ 중앙 셔터 버튼: 흰색으로 다 채운 단순하고 깔끔한 원형 버튼
         ───────────────────────────────────────────────────────────── */}
      {!capturedImage && !isExpanded && (
        <div className="absolute inset-x-0 bottom-24 z-20 flex justify-center pointer-events-none">
          <button
            onClick={handleShutter}
            className="pointer-events-auto h-16 w-16 rounded-full border-4 border-white active:scale-90"
            style={{ backgroundColor: subjectTheme.color }}
            title="촬영하기"
            aria-label="촬영하기"
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. 최하단 고정 바 (화이트 & 민트)
             - [왼쪽]: 직관적인 (+) 첨부 버튼 + 분석 모드 선택
             - [가운데]: 누르면 위로 펼쳐지는 텍스트 입력창
             - [오른쪽]: 화살표 표시 하나만의 보내기 버튼 (ArrowUp)
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 bottom-0 z-30 flex flex-col gap-2 border-t border-slate-900 bg-white p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] transition-all duration-300 ease-out">
        {capturedImage && <button type="button" onClick={handleRetake} className="flex h-9 min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 active:bg-slate-100"><RotateCcw className="h-4 w-4"/><span>다시 찍기</span></button>}
        {/* (A) 입력창이 위로 올라가면서 펼쳐지는 영역 */}
        {isExpanded && (
          <div className="w-full rounded-2xl border border-slate-400 bg-white p-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
              <span className="flex items-center gap-1 text-sm font-bold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-slate-900" />
                문제 지문 또는 질문 입력
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              rows={3}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="직접 문제 지문이나 모르는 부분을 적어주세요..."
              className="w-full resize-none bg-transparent text-base leading-7 text-slate-900 placeholder:text-slate-600 focus:outline-hidden"
            />
          </div>
        )}

        {/* (B) 하단 한 줄 바 */}
        <div className="flex items-center justify-between gap-2">
          {/* [하단 왼쪽]: 직관적인 (+) 첨부 버튼 & 무채색 모델 변경 버튼 */}
          <div className="flex items-center gap-2 shrink-0">
            {/* ⭐️ 직관적인 원형 (+) 사진/파일 첨부 버튼 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-colors ${
                capturedImage
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-400 bg-white text-slate-900'
              }`}
              title="사진 / 파일 첨부 (+)"
            >
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </button>

            {/* ⭐️ 무채색 모델 변경 버튼 */}
            <button
              onClick={() => onModelModeChange(modelMode === 'speed' ? 'deep' : 'speed')}
              className="min-h-12 rounded-xl border border-slate-400 bg-white px-4 text-sm font-bold text-slate-900"
              title={`AI 분석 비용: ${modelMode === 'speed' ? 2 : 5}크레딧`}
            >
              {modelMode === 'speed' ? '기본 · 2C' : '통화 · 5C'}
            </button>
          </div>

          {/* [가운데]: 입력창 트리거 바 (누르면 위로 펼쳐짐) */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex min-h-12 flex-1 items-center justify-between truncate rounded-xl border border-slate-400 bg-white px-3 text-left text-sm font-medium text-slate-700"
            >
              <span className="truncate">
                {problemText.trim() ? problemText : '질문 / 텍스트 입력...'}
              </span>
              <span className="ml-1 shrink-0 text-sm text-slate-700">▲</span>
            </button>
          )}

          {/* [하단 오른쪽]: 화살표 표시 하나만의 원형 보내기 버튼 */}
          <button
            onClick={handleSend}
            disabled={isLoading || isOffline || (!capturedImage && !problemText.trim())}
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-black transition-opacity active:opacity-75 ${
              isLoading || isOffline || (!capturedImage && !problemText.trim())
                ? 'cursor-not-allowed border-slate-300 bg-white text-slate-500'
                : 'border-slate-900'
            }`}
            style={!isLoading && !isOffline && (capturedImage || problemText.trim()) ? { backgroundColor: subjectTheme.color, borderColor: subjectTheme.color, color: subjectTheme.foreground } : undefined}
            title="전송"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isOffline ? (
              <WifiOff className="h-5 w-5 text-slate-700" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.8]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


function SubjectGlyph({ subject, color }: { subject: SubjectType; color: string }) {
  if (subject === 'english') return <span className="text-3xl font-black tracking-[-0.1em]" style={{ color }}>AZ</span>;
  const Icon = subject === 'science' ? Microscope : Calculator;
  return <Icon className="h-9 w-9" style={{ color }} strokeWidth={2.2} />;
}
