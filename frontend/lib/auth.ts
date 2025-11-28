// 인증 상태 관리 유틸리티
'use client';

import { useState, useEffect } from 'react';
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

  useEffect(() => {
    checkAuth();
  }, []);

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

  const logout = () => {
    removeToken();
    setUser(null);
    window.location.href = '/login';
  };

  return { user, loading, checkAuth, logout };
}

