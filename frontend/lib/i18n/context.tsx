// 다국어 Context
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../auth';
import { translations, countryToLanguage, Language } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language>('ko');

  // 사용자 국가에 따라 언어 자동 설정
  useEffect(() => {
    if (user?.country) {
      const userLanguage = countryToLanguage(user.country);
      setLanguage(userLanguage);
    } else {
      // 사용자가 없거나 국가 정보가 없으면 기본값 사용
      setLanguage('ko');
    }
  }, [user?.country]);

  // 번역 함수
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 번역을 찾을 수 없으면 키 반환
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

