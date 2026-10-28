'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubjectType, AIModelMode } from '@/types/problem';
import {
  Camera,
  Plus,
  ArrowUp,
  RotateCcw,
  Calculator,
  BookOpen,
  Atom,
  WifiOff,
  X,
} from 'lucide-react';

interface MobileScanViewProps {
  currentSubject: SubjectType;
  onSubjectChange: (sub: SubjectType) => void;
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
  onSubjectChange,
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
  const [isHorizontalExpanded, setIsHorizontalExpanded] = useState<boolean>(false);

  // 카메라 및 이미지 프리뷰
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // 기본 과목 3종 (수학, 영어, 과학)
  const subjects: Array<{ id: SubjectType; icon: React.ReactNode; label: string }> = [
    { id: 'math', icon: <Calculator className="w-5 h-5" />, label: '수학' },
    { id: 'english', icon: <BookOpen className="w-5 h-5" />, label: '영어' },
    { id: 'science', icon: <Atom className="w-5 h-5" />, label: '과학' },
  ];

  // ⭐️ 끊김 없는 무한 스크롤을 위한 가상 연속 인덱스 (기본 중간값 300에서 시작)
  const ITEM_HEIGHT = 40; // 각 과목 아이템 높이 (px)
  const [virtualIndex, setVirtualIndex] = useState<number>(() => {
    const idx = subjects.findIndex((s) => s.id === currentSubject);
    return 300 + (idx >= 0 ? idx : 0);
  });

  // virtualIndex가 변경될 때마다 부모의 currentSubject 동기화
  useEffect(() => {
    const realIndex = ((virtualIndex % 3) + 3) % 3;
    const targetSubject = subjects[realIndex].id;
    if (targetSubject !== currentSubject) {
      onSubjectChange(targetSubject);
    }
  }, [virtualIndex, currentSubject, onSubjectChange, subjects]);

  // 부모에서 currentSubject가 직접 변경되었을 때 virtualIndex를 가장 가까운 인덱스로 보정
  const syncVirtualIndexToSubject = (subId: SubjectType) => {
    const currentReal = ((virtualIndex % 3) + 3) % 3;
    const targetReal = subjects.findIndex((s) => s.id === subId);
    if (targetReal === -1) return;
    const diff = targetReal - currentReal;
    // -1, 0, 1 중 가장 가까운 방향으로 델타 계산
    const delta = diff === 2 ? -1 : diff === -2 ? 1 : diff;
    setVirtualIndex((prev) => prev + delta);
  };

  // 세로 스와이프 제스처
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(diff) > 8) {
      isDragging.current = true;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const diff = e.changedTouches[0].clientY - touchStartY.current;

    if (Math.abs(diff) > 20) {
      if (diff > 0) {
        // 아래로 스와이프: 위쪽 이전 과목으로 이동
        setVirtualIndex((prev) => prev - 1);
      } else {
        // 위로 스와이프: 아래쪽 다음 과목으로 이동
        setVirtualIndex((prev) => prev + 1);
      }
    }
    touchStartY.current = null;
  };

  // 마우스 휠 무한 롤링
  const handleWheel = (e: React.WheelEvent) => {
    if (isHorizontalExpanded) return;
    if (e.deltaY < -15) {
      setVirtualIndex((prev) => prev - 1);
    } else if (e.deltaY > 15) {
      setVirtualIndex((prev) => prev + 1);
    }
  };

  // 웹캠 초기화
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
  const handleCenterItemClick = () => {
    if (isDragging.current) return;
    setIsHorizontalExpanded(!isHorizontalExpanded);
  };

  // 화면에 렌더링할 윈도우 슬롯 (-3 ~ +3 총 7개 아이템) -> 완벽한 무한 롤링 구현
  const visibleSlots = [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const slotVirtualIdx = virtualIndex + offset;
    const subjectIdx = ((slotVirtualIdx % 3) + 3) % 3;
    return {
      offset,
      slotVirtualIdx,
      subject: subjects[subjectIdx],
      isCurrent: offset === 0,
    };
  });

  return (
    <div className="relative w-full h-[calc(100dvh-50px)] bg-slate-900 overflow-hidden flex flex-col justify-between select-none">
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
            <button
              onClick={handleRetake}
              className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold rounded-full flex items-center gap-1.5 border border-slate-200 shadow-md active:scale-95 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#099078]" />
              <span>다시 찍기</span>
            </button>
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
            <p className="text-xs">카메라를 켤 수 없습니다.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-[#099078] text-white text-xs font-bold rounded-xl active:scale-95 transition shadow-sm"
            >
              갤러리 사진 불러오기
            </button>
          </div>
        )}

        {/* 뷰파인더 타겟 가이드라인 */}
        {!capturedImage && (
          <div className="pointer-events-none absolute inset-x-8 top-16 bottom-32 border-2 border-white/30 rounded-2xl flex flex-col justify-between p-3">
            <div className="flex justify-between">
              <div className="w-6 h-6 border-t-3 border-l-3 border-[#099078] rounded-tl-lg shadow-xs" />
              <div className="w-6 h-6 border-t-3 border-r-3 border-[#099078] rounded-tr-lg shadow-xs" />
            </div>
            <div className="text-center">
              <span className="text-[11px] font-bold text-slate-800 bg-white/90 px-3 py-1 rounded-full shadow-md backdrop-blur-xs">
                문제를 가이드 박스 안에 맞춰주세요
              </span>
            </div>
            <div className="flex justify-between">
              <div className="w-6 h-6 border-b-3 border-l-3 border-[#099078] rounded-bl-lg shadow-xs" />
              <div className="w-6 h-6 border-b-3 border-r-3 border-[#099078] rounded-br-lg shadow-xs" />
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 우측 상단: 끊김 없는 무한 롤링 과목 휠 & 가로 확장 인터랙션
             - [무한 스크롤]: 마지막 과목 뒤에 첫 과목이 자연스럽게 이어짐
             - [가로 확장]: 현재 과목 탭 시 옆으로 늘어나 전체 한눈에 보기
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-4 right-4 z-30 flex items-center justify-end">
        {isHorizontalExpanded ? (
          /* [가로 확장 모드] 옆으로 촤르륵 늘어나 전체 과목 한눈에 노출 */
          <div className="flex items-center gap-2 p-1.5 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-full shadow-2xl animate-in slide-in-from-right-4 duration-300">
            {subjects.map((sub) => {
              const isSelected = sub.id === currentSubject;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    syncVirtualIndexToSubject(sub.id);
                    setIsHorizontalExpanded(false);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                    isSelected
                      ? 'bg-[#099078] text-white shadow-md shadow-[#099078]/30 scale-105 ring-2 ring-[#099078]/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title={sub.label}
                >
                  {sub.icon}
                </button>
              );
            })}
            <button
              onClick={() => setIsHorizontalExpanded(false)}
              className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center ml-0.5 active:scale-90"
              title="닫기"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          /* [세로 무한 롤링 휠] 끊김 없이 무한으로 회전하는 슬라이드 휠 */
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
            className="relative flex flex-col items-center justify-center p-1 rounded-full bg-white/80 backdrop-blur-md border border-white/70 shadow-xl cursor-ns-resize"
          >
            {/* 세로 슬라이드 뷰포트 (높이 120px) */}
            <div className="relative w-11 h-[120px] overflow-hidden flex items-center justify-center">
              {/* 상하단 반투명 마스크 그라데이션 */}
              <div className="pointer-events-none absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-white/90 to-transparent z-10" />
              <div className="pointer-events-none absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-white/90 to-transparent z-10" />

              {/* ⭐️ 끊김 전혀 없는 상대 좌표 트랙 (상대 위치 기반 부드러운 translateY 롤링) */}
              <div className="relative w-full h-full flex items-center justify-center">
                {visibleSlots.map((slot) => {
                  const yPos = slot.offset * ITEM_HEIGHT;
                  const isCenter = slot.offset === 0;
                  const isAdjacent = Math.abs(slot.offset) === 1;

                  return (
                    <div
                      key={slot.slotVirtualIdx}
                      onClick={() => {
                        if (isCenter) {
                          handleCenterItemClick();
                        } else {
                          setVirtualIndex(slot.slotVirtualIdx);
                        }
                      }}
                      style={{
                        transform: `translateY(${yPos}px) scale(${isCenter ? 1.08 : isAdjacent ? 0.78 : 0.5})`,
                        opacity: isCenter ? 1 : isAdjacent ? 0.45 : 0,
                      }}
                      className={`absolute w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ease-out cursor-pointer ${
                        isCenter
                          ? 'bg-white text-[#099078] border-2 border-[#099078] shadow-md shadow-[#099078]/30 z-20 active:scale-95'
                          : 'bg-white/50 text-slate-400 hover:opacity-80 z-10'
                      }`}
                      title={isCenter ? '터치하여 전체 과목 펼치기' : slot.subject.label}
                    >
                      {slot.subject.icon}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ⭐️ 중앙 셔터 버튼: 흰색으로 다 채운 단순하고 깔끔한 원형 버튼
         ───────────────────────────────────────────────────────────── */}
      {!capturedImage && !isExpanded && (
        <div className="absolute inset-x-0 bottom-24 z-20 flex justify-center pointer-events-none">
          <button
            onClick={handleShutter}
            className="pointer-events-auto w-16 h-16 rounded-full bg-white shadow-2xl active:scale-90 transition-transform duration-150 border-4 border-white/60"
            title="촬영하기"
            aria-label="촬영하기"
          />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. 최하단 고정 바 (화이트 & 민트)
             - [왼쪽]: 직관적인 (+) 첨부 버튼 + 무채색 모델 변경(Flash/Pro)
             - [가운데]: 누르면 위로 펼쳐지는 텍스트 입력창
             - [오른쪽]: 화살표 표시 하나만의 보내기 버튼 (ArrowUp)
         ───────────────────────────────────────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 z-30 p-3 pb-4 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-2xl transition-all duration-300 ease-out flex flex-col gap-2">
        {/* (A) 입력창이 위로 올라가면서 펼쳐지는 영역 */}
        {isExpanded && (
          <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-md animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#099078]" />
                문제 지문 또는 질문 입력
              </span>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md"
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
              className="w-full text-xs bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-hidden resize-none leading-relaxed"
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
              className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 shadow-xs ${
                capturedImage
                  ? 'bg-[#099078] border-[#099078] text-white ring-2 ring-[#099078]/20'
                  : 'bg-white border-slate-300 text-[#099078] hover:border-[#099078] hover:bg-[#099078]/5'
              }`}
              title="사진 / 파일 첨부 (+)"
            >
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </button>

            {/* ⭐️ 무채색 모델 변경 버튼 */}
            <button
              onClick={() => onModelModeChange(modelMode === 'speed' ? 'deep' : 'speed')}
              className="h-10 px-3.5 rounded-2xl border border-slate-300 bg-white text-slate-800 text-xs font-extrabold hover:bg-slate-50 active:scale-95 transition shadow-2xs"
              title="AI 모델 변경 (Flash / Pro)"
            >
              {modelMode === 'speed' ? 'Flash' : 'Pro'}
            </button>
          </div>

          {/* [가운데]: 입력창 트리거 바 (누르면 위로 펼쳐짐) */}
          {!isExpanded && (
            <button
              onClick={() => setIsExpanded(true)}
              className="flex-1 h-10 px-3 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-2xl text-left text-xs font-medium text-slate-500 truncate flex items-center justify-between transition active:scale-[0.98]"
            >
              <span className="truncate">
                {problemText.trim() ? problemText : '질문 / 텍스트 입력...'}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0 ml-1">▲</span>
            </button>
          )}

          {/* [하단 오른쪽]: 화살표 표시 하나만의 원형 보내기 버튼 */}
          <button
            onClick={handleSend}
            disabled={isLoading || isOffline || (!capturedImage && !problemText.trim())}
            className={`w-10 h-10 rounded-full font-black shadow-md transition-all active:scale-90 flex items-center justify-center shrink-0 ${
              isLoading || isOffline || (!capturedImage && !problemText.trim())
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-200'
                : 'bg-[#099078] hover:bg-[#077864] text-white shadow-[#099078]/30 border border-[#099078]'
            }`}
            title="전송"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isOffline ? (
              <WifiOff className="w-4 h-4 text-rose-400" />
            ) : (
              <ArrowUp className="w-5 h-5 stroke-[2.8]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
