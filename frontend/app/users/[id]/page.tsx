// 유저 프로필 페이지
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { usersApi } from '@/lib/api';

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId) {
      loadUser();
      loadProjects();
    }
  }, [userId]);

  const loadUser = async () => {
    try {
      setError(null);
      const data = await usersApi.getOne(userId);
      setUser(data);
    } catch (err: any) {
      console.error('유저 정보 로드 실패:', err);
      setError(err.message || '유저 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const data = await usersApi.getProjects(userId);
      setProjects(data || []);
    } catch (err: any) {
      console.error('프로젝트 목록 로드 실패:', err);
      setProjects([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="px-6 py-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 font-semibold mb-6">
            {error || '유저를 찾을 수 없습니다.'}
          </div>
          <Link
            href="/projects"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            프로젝트 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  // 기술 스택 파싱
  const techStacks = user?.techStacks ? JSON.parse(user.techStacks || '[]') : [];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/projects" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          프로젝트 목록
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">{user.nickname}님의 프로필</h1>

        {/* 프로필 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">프로필 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">닉네임</div>
              <div className="text-lg font-bold text-gray-900">{user.nickname || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">역할</div>
              <div className="text-lg font-bold text-gray-900">
                {user.role === 'DEVELOPER' && '개발자'}
                {user.role === 'DESIGNER' && '디자이너'}
                {user.role === 'PLANNER' && '기획자'}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">가입일</div>
              <div className="text-lg font-bold text-gray-900">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}
              </div>
            </div>
          </div>
          
          {techStacks.length > 0 && (
            <div className="mb-6">
              <div className="text-sm font-semibold text-gray-600 mb-3">기술 스택</div>
              <div className="flex flex-wrap gap-2">
                {techStacks.map((stack: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                  >
                    {stack}
                  </span>
                ))}
              </div>
            </div>
          )}

          {user.githubUsername && (
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-sm font-semibold text-gray-600 mb-3">GitHub</div>
              <div className="flex items-center gap-3">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <a
                  href={`https://github.com/${user.githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  {user.githubUsername}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* 생성한 프로젝트 */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {user.nickname}님이 생성한 프로젝트 ({projects.length})
          </h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-600 border border-gray-100">
              생성한 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
                      {project.shortDescription}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                      <span>신청: {project.applicationCount || 0}건</span>
                      <span>메시지: {project.messageCount || 0}개</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString('ko-KR')}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
