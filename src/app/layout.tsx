import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-5913004716364480';

export const metadata: Metadata = {
  title: 'tudu',
  description: '정답보다 이해하는 힘을 키우는 AI 학습 서비스 tudu.',
  icons: { icon: '/tudu_icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen bg-white text-[#1c2a27]">{children}</body>
    </html>
  );
}

