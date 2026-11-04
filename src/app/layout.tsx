import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'tudu | 혼자 푸는 힘을 만드는 AI 학습',
  description: '정답보다 이해하는 힘을 키우는 AI 학습 서비스 tudu.',
  icons: { icon: '/tudu_icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body className="min-h-screen bg-white text-[#1c2a27]">{children}</body></html>;
}
