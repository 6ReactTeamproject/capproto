// I18n Provider 래퍼 (클라이언트 컴포넌트)
'use client';

import { I18nProvider } from '@/lib/i18n/context';

export default function I18nProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <I18nProvider>{children}</I18nProvider>;
}

