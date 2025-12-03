// 프로젝트 목록 페이지
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading, logout } = useAuth();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      // 모든 프로젝트를 가져오기 위해 큰 limit 설정
      const response = await projectsApi.getAll(1, 100);
      setProjects(response.data || []);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">프로젝트 목록</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/releases"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
            >
              릴리즈 정보
            </Link>
            {user ? (
              <>
                <Link 
                  href="/mypage" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  마이페이지
                </Link>
                <span className="text-gray-600">안녕하세요, {user.nickname}님</span>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  로그아웃
                </button>
                <Link 
                  href="/projects/new" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  프로젝트 생성
                </Link>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                >
                  로그인
                </Link>
                <Link 
                  href="/projects/new" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  프로젝트 생성
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 프로젝트 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-gray-200 cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start gap-3 mb-3">
                  <h2 className="text-xl font-bold text-gray-900 flex-1 line-clamp-2">{project.title}</h2>
                  {project.isRecruiting === false && (
                    <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0">
                      모집 완료
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">{project.shortDescription}</p>
                <div className="space-y-2 mt-auto">
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">필요 역할:</span>{' '}
                    <span className="text-gray-600">
                      {Array.isArray(project.neededRoles) ? project.neededRoles.join(', ') : 'N/A'}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-semibold text-gray-700">필요 스택:</span>{' '}
                    <span className="text-gray-600">
                      {Array.isArray(project.requiredStacks)
                        ? project.requiredStacks.slice(0, 3).join(', ')
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

