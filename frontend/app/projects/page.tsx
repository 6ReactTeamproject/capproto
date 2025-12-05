// 프로젝트 목록 페이지
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

// 역할을 한글로 변환하는 함수
const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    'DEVELOPER': '개발자',
    'DESIGNER': '디자이너',
    'PLANNER': '기획자',
  };
  return roleMap[role] || role;
};

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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 페이지 헤더 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">프로젝트 목록</h1>
          <p className="text-gray-600">참여하고 싶은 프로젝트를 찾아보세요</p>
        </div>

        {/* 프로젝트 그리드 */}
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">아직 등록된 프로젝트가 없습니다.</p>
            {user && (
              <Link
                href="/projects/new"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                첫 프로젝트 만들기
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100 cursor-pointer h-full flex flex-col">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                        {project.title}
                      </h2>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                        {project.shortDescription}
                      </p>
                    </div>
                    {!project.isRecruiting && (
                      <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full whitespace-nowrap">
                        모집 완료
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.neededRoles?.slice(0, 3).map((role: string) => (
                      <span
                        key={role}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
                      >
                        {getRoleLabel(role)}
                      </span>
                    ))}
                    {project.neededRoles?.length > 3 && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                        +{project.neededRoles.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.requiredStacks?.slice(0, 3).map((stack: string) => (
                      <span
                        key={stack}
                        className="px-2 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded"
                      >
                        {stack}
                      </span>
                    ))}
                    {project.requiredStacks?.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        +{project.requiredStacks.length - 3}
                      </span>
                    )}
                  </div>

                  {(project.startDate || project.endDate) && (
                    <div className="text-xs text-gray-500 mb-2">
                      {project.startDate && formatDate(project.startDate)}
                      {project.startDate && project.endDate && ' ~ '}
                      {project.endDate && formatDate(project.endDate)}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {project.creator?.nickname?.[0] || '?'}
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {project.creator?.nickname || '익명'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

