// 랜딩 페이지 - 프로젝트 목록으로 리다이렉트
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/projects');
  }, [router]);

  return <div>로딩 중...</div>;
}

