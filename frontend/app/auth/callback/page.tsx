// OAuth 콜백 페이지 - GitHub 로그인 후 토큰 처리
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setToken } from '@/lib/api';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      // 에러가 있으면 로그인 페이지로 리다이렉트
      router.push(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (token) {
      // 토큰을 저장하고 프로젝트 목록으로 리다이렉트
      setToken(token);
      router.push('/projects');
    } else {
      // 토큰이 없으면 로그인 페이지로 리다이렉트
      router.push('/login?error=no_token');
    }
  }, [router, searchParams]);

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
      <div>로그인 처리 중...</div>
    </div>
  );
}

