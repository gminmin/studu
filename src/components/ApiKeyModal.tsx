'use client';

import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, X } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSaved }) => {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('gemini_custom_api_key') || '';
    setApiKey(saved);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    localStorage.setItem('gemini_custom_api_key', apiKey.trim());
    onSaved(apiKey.trim());
    onClose();
  };

  const handleClear = () => {
    localStorage.removeItem('gemini_custom_api_key');
    setApiKey('');
    onSaved('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-800">Gemini API 키 설정</h3>
            <p className="text-xs text-slate-500">BYOK (Bring Your Own Key) 모드</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 leading-relaxed flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              입력하신 키는 사용자의 브라우저(LocalStorage)에만 안전하게 보관되며, AI 분석 요청 시에만 서버 프록시를 통해 구글 API로 전송됩니다.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Google Gemini API Key
            </label>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-rose-600 hover:underline font-medium"
            >
              키 삭제 (기본 모의/서버키 모드)
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                저장하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
