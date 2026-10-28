'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SubjectType } from '@/types/problem';
import { SAMPLE_PROBLEMS } from '@/lib/mockData';
import { Camera, Upload, Edit3, Sparkles, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react';

interface ScanViewProps {
  currentSubject: SubjectType;
  onSubjectChange: (sub: SubjectType) => void;
  onStartAnalysis: (data: {
    imageBase64?: string;
    imageMimeType?: string;
    problemText?: string;
    userContext?: string;
  }) => void;
  isLoading: boolean;
  isOffline: boolean;
}

export const ScanView: React.FC<ScanViewProps> = ({
  currentSubject,
  onSubjectChange,
  onStartAnalysis,
  isLoading,
  isOffline,
}) => {
  const [tab, setTab] = useState<'upload' | 'camera' | 'text'>('text');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/jpeg');
  const [problemText, setProblemText] = useState<string>('');
  const [userContext, setUserContext] = useState<string>('');
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 파일 업로드 처리
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 웹캠 제어
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (tab === 'camera' && isWebcamActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: 'environment' } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Webcam not accessible:', err);
          setIsWebcamActive(false);
          alert('웹캠 접근 권한이 없거나 지원되지 않습니다. 이미지 업로드를 이용해 주세요.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [tab, isWebcamActive]);

  // 웹캠 캡처
  const captureWebcam = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setImagePreview(dataUrl);
      setImageMime('image/jpeg');
      setIsWebcamActive(false);
    }
  };

  // 분석 시작 (반드시 네트워크 요청을 거침)
  const handleSubmit = () => {
    if (isOffline) {
      alert('네트워크가 연결되어 있지 않아 AI 분석을 진행할 수 없습니다. 인터넷 연결을 확인해주세요.');
      return;
    }
    if (!imagePreview && !problemText.trim()) {
      alert('문제 이미지 또는 텍스트를 입력해주세요.');
      return;
    }
    onStartAnalysis({
      imageBase64: imagePreview || undefined,
      imageMimeType: imageMime,
      problemText: problemText.trim() || undefined,
      userContext: userContext.trim() || undefined,
    });
  };

  // 샘플 문제 지문 자동 채우기 (저장된 가짜 결과를 주입하지 않고, 지문 텍스트만 폼에 채워줌)
  const handleFillSamplePrompt = (sample: (typeof SAMPLE_PROBLEMS)[0]) => {
    onSubjectChange(sample.subject);
    setProblemText(sample.sampleInputText);
    setImagePreview(null);
    setTab('text');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* 오프라인 상태 경고 카드 */}
      {isOffline && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 shadow-xs">
          <div className="p-2 bg-rose-100 rounded-xl shrink-0">
            <WifiOff className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h4 className="font-bold text-sm">네트워크에 연결되지 않았습니다</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              인터넷 연결이 끊겨 AI 문제 스캔 및 실시간 힌트 생성을 이용할 수 없습니다. 연결 상태를 확인해주세요.
            </p>
          </div>
        </div>
      )}

      {/* 문제 지문 자동 입력 보조 버튼 (사전 저장 결과 대신 입력 편의만 제공) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-blue-900">
            테스트용 예시 문제 지문 자동 채우기 (타이핑 없이 바로 입력)
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SAMPLE_PROBLEMS.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleFillSamplePrompt(sample)}
              className={`p-2.5 rounded-xl text-left border transition bg-white/90 hover:bg-white hover:border-blue-400 hover:shadow-xs flex flex-col justify-between ${
                currentSubject === sample.subject ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div className="font-bold text-xs text-slate-800 line-clamp-1">{sample.title}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">{sample.description}</div>
              <div className="mt-2 text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                <span>지문 텍스트 채우기</span> &rarr;
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 입력 방식 탭 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            onClick={() => setTab('text')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
              tab === 'text' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>텍스트 직접 입력</span>
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
              tab === 'upload' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>이미지 파일 업로드</span>
          </button>
          <button
            onClick={() => {
              setTab('camera');
              setIsWebcamActive(true);
            }}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 transition ${
              tab === 'camera' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>카메라 스캔 (웹캠)</span>
          </button>
        </div>

        <div className="p-6">
          {/* 1. 텍스트 직접 입력 뷰 */}
          {tab === 'text' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                문제 지문 또는 수식 텍스트
              </label>
              <textarea
                rows={5}
                value={problemText}
                onChange={(e) => setProblemText(e.target.value)}
                placeholder="예: 밑변의 길이가 3cm이고 높이가 4cm인 직각삼각형의 빗변 길이를 구하시오."
                className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition resize-none"
              />
            </div>
          )}

          {/* 2. 이미지 업로드 뷰 */}
          {tab === 'upload' && (
            <div className="space-y-4">
              {!imagePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/20 rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px]"
                >
                  <div className="w-12 h-12 bg-white rounded-full shadow-xs flex items-center justify-center text-blue-600 mb-3 border border-slate-100">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="font-semibold text-sm text-slate-800">
                    문제 사진을 드래그하거나 클릭하여 업로드
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PNG, JPG, WebP 지원 (최대 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 flex items-center justify-center max-h-[340px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="문제 미리보기"
                      className="max-h-[340px] w-auto object-contain"
                    />
                    <div className="absolute inset-4 border-2 border-dashed border-blue-400/80 rounded-lg pointer-events-none flex items-start justify-end p-2">
                      <span className="text-[10px] font-bold bg-blue-600/90 text-white px-2 py-0.5 rounded shadow-xs">
                        스캔 영역 지정됨
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 이미지가 로드되었습니다
                    </span>
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="text-slate-500 hover:text-rose-600 font-medium"
                    >
                      다른 이미지 선택
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. 웹캠 스캔 뷰 */}
          {tab === 'camera' && (
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-300">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-8 border-2 border-dashed border-emerald-400 rounded-xl pointer-events-none flex items-center justify-center">
                    <span className="bg-black/60 text-white text-[11px] px-3 py-1 rounded-full backdrop-blur-xs">
                      문제를 가이드 박스 안에 맞춰주세요
                    </span>
                  </div>

                  <div className="absolute bottom-4 inset-x-0 flex justify-center">
                    <button
                      onClick={captureWebcam}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-sm shadow-lg flex items-center gap-2 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>문제 캡처 (스캔)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-[320px] flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="캡처 이미지" className="max-h-[320px] object-contain" />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setIsWebcamActive(true);
                      }}
                      className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> 다시 촬영하기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 보조 사용자 메모 (선택사항) */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="block text-xs font-medium text-slate-500 mb-1">
              추가 질문 또는 모르는 부분 (선택)
            </label>
            <input
              type="text"
              value={userContext}
              onChange={(e) => setUserContext(e.target.value)}
              placeholder="예: 2단계 식을 어떻게 세워야 하는지 모르겠어요"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
            />
          </div>

          {/* 하단 분석 시작 버튼 */}
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              disabled={isLoading || isOffline || (!imagePreview && !problemText.trim())}
              className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                isLoading || isOffline || (!imagePreview && !problemText.trim())
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 active:scale-[0.99]'
              }`}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI 소크라테스 튜터가 문제를 분석하고 힌트를 생성 중...</span>
                </>
              ) : isOffline ? (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>네트워크 연결 끊김 (인터넷 확인 필요)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>소크라테스식 힌트 사다리 생성 시작하기</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
