// 랜딩 페이지 - 프로젝트 목록으로 리다이렉트
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/projects');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-gray-500 text-lg">로딩 중...</div>
    </div>
  );
}

