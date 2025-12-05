// 루트 레이아웃
import type { Metadata } from 'next';
import './globals.css';
import GlobalChatWidget from '@/components/GlobalChatWidget';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import I18nProviderWrapper from '@/components/I18nProviderWrapper';

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
      <body className="flex flex-col min-h-screen">
        <I18nProviderWrapper>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <GlobalChatWidget />
        </I18nProviderWrapper>
      </body>
    </html>
  );
}

