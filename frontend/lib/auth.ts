// 인증 상태 관리 유틸리티
'use client';

import { useState, useEffect, useRef } from 'react';
import { authApi, getToken, removeToken } from './api';

export interface User {
  id: string;
  email: string;
  nickname: string;
  role: string;
  techStacks: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);
  const loadingRef = useRef<boolean>(true);

  // ref를 최신 상태로 유지
  useEffect(() => {
    userRef.current = user;
    loadingRef.current = loading;
  }, [user, loading]);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const userData = await authApi.getMe();
      setUser(userData);
    } catch (error) {
      // 토큰이 유효하지 않으면 제거
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
    
    // localStorage 변경 감지 (다른 탭이나 같은 탭에서 토큰이 변경될 때)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        checkAuth();
      }
    };
    
    // 커스텀 이벤트로 같은 탭에서의 토큰 변경 감지
    const handleTokenChange = () => {
      checkAuth();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('token-changed', handleTokenChange);
    
    // 초기 로딩 후에도 토큰이 있는지 주기적으로 체크 (로그인 직후 감지)
    // 최대 10초까지만 체크 (로그인 직후 감지용)
    let checkCount = 0;
    const maxChecks = 20; // 10초 (0.5초 * 20)
    const interval = setInterval(() => {
      checkCount++;
      if (checkCount > maxChecks) {
        clearInterval(interval);
        return;
      }
      
      const token = getToken();
      const hasToken = !!token;
      
      // 토큰이 있는데 사용자 정보가 없고 로딩이 완료되었으면 다시 체크
      if (hasToken && !userRef.current && !loadingRef.current) {
        checkAuth();
      }
    }, 500); // 0.5초마다 체크

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('token-changed', handleTokenChange);
      clearInterval(interval);
    };
  }, []); // 의존성 배열 비움 - 마운트 시 한 번만 실행

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, checkAuth, logout };
}

