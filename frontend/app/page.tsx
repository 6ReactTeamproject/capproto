// 메인 페이지 - Toss 스타일의 그럴듯한 랜딩 페이지
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';

// 역할을 다국어로 변환하는 함수
const getRoleLabel = (role: string, t: (key: string) => string): string => {
  const roleMap: Record<string, string> = {
    'DEVELOPER': t('role.developer'),
    'DESIGNER': t('role.designer'),
    'PLANNER': t('role.planner'),
  };
  return roleMap[role] || role;
};

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useI18n();
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentProjects();
  }, []);

  const loadRecentProjects = async () => {
    try {
      const response = await projectsApi.getAll(1, 6);
      setRecentProjects(response.data || []);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const localeMap: Record<string, string> = {
      'ko': 'ko-KR',
      'en': 'en-US',
      'ja': 'ja-JP',
    };
    return date.toLocaleDateString(localeMap[language] || 'ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.subtitle').split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 1 ? (
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {line}
                    </span>
                  ) : (
                    line
                  )}
                </span>
              ))}
            </h1>
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {t('home.description').split('\n').map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <>
                  <Link
                    href="/projects/new"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  >
                    {t('project.create')}
                  </Link>
                  <Link
                    href="/projects"
                    className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg border border-gray-200 transform hover:-translate-y-1 transition-all duration-200"
                  >
                    {t('home.viewProjects')}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
                  >
                    {t('home.getStarted')}
                  </Link>
                  <Link
                    href="/projects"
                    className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg shadow-md hover:shadow-lg border border-gray-200 transform hover:-translate-y-1 transition-all duration-200"
                  >
                    {t('home.viewProjects')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 최근 프로젝트 섹션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{t('home.recentProjects')}</h2>
          <Link
            href="/projects"
            className="text-blue-600 hover:text-blue-700 font-semibold text-lg transition-colors"
          >
            {t('home.viewProjects')} →
          </Link>
        </div>

        {recentProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg mb-4">{t('project.noProjects')}</p>
            {user && (
              <Link
                href="/projects/new"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('project.createFirst')}
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {project.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                      {project.shortDescription}
                    </p>
                  </div>
                  {!project.isRecruiting && (
                    <span className="ml-2 px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full whitespace-nowrap">
                      {t('project.closed')}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {project.neededRoles?.slice(0, 3).map((role: string) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
                    >
                      {getRoleLabel(role, t)}
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

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {project.creator?.nickname?.[0] || '?'}
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      {project.creator?.nickname || '익명'}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(project.createdAt).toLocaleDateString(
                      language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US'
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 기능 소개 섹션 */}
      <div className="bg-white border-t border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('home.features')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.feature1Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature1Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.feature2Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature2Desc')}
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('home.feature3Title')}</h3>
              <p className="text-gray-600">
                {t('home.feature3Desc')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA 섹션 */}
      {!user && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('home.getStarted')}
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              {t('home.description')}
            </p>
            <Link
              href="/register"
              className="inline-block px-8 py-4 bg-white text-blue-600 rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-200"
            >
              {t('header.register')}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
