// 루트 레이아웃
import type { Metadata } from 'next';
import './globals.css';
import GlobalChatWidget from '@/components/GlobalChatWidget';

export const metadata: Metadata = {
  title: 'Sync-Up - 팀 매칭 플랫폼',
  description: '사이드 프로젝트 팀원을 찾는 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {children}
        <GlobalChatWidget />
      </body>
    </html>
  );
}

