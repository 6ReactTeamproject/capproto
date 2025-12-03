// 마이페이지 - 내 프로필 및 활동 정보
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { mypageApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function MyPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const [mypageInfo, setMypageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      loadMyPageInfo();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadMyPageInfo = async () => {
    try {
      setLoading(true);
      const data = await mypageApi.getMyPageInfo();
      setMypageInfo(data);
    } catch (err: any) {
      console.error('마이페이지 정보 로드 실패:', err);
      setError(err.message || '정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">로딩 중...</div>
          <div className="text-sm text-gray-600 mt-2">
            GitHub 활동 정보를 불러오고 있습니다. 잠시만 기다려주세요.
          </div>
          <div className="mt-4 text-xs text-gray-500">
            (처음 로딩 시 최대 20개 저장소의 정보를 수집하므로 약간 시간이 걸릴 수 있습니다)
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-600 mb-6">마이페이지를 보려면 먼저 로그인해주세요.</p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
          >
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium mb-4">
            오류: {error}
          </div>
          <button
            onClick={loadMyPageInfo}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const { user: userInfo, myProjects, myApplications, stats, githubStats } = mypageInfo || {};
  const techStacks = userInfo?.techStacks ? JSON.parse(userInfo.techStacks || '[]') : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/projects" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
        >
          ← 프로젝트 목록
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">마이페이지</h1>

        {/* 프로필 정보 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">프로필 정보</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">닉네임</div>
              <div className="text-gray-900 font-medium">{userInfo?.nickname || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">이메일</div>
              <div className="text-gray-900 font-medium">{userInfo?.email || '-'}</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">역할</div>
              <div className="text-gray-900 font-medium">
                {userInfo?.role === 'DEVELOPER' && '개발자'}
                {userInfo?.role === 'DESIGNER' && '디자이너'}
                {userInfo?.role === 'PLANNER' && '기획자'}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600 mb-2">가입일</div>
              <div className="text-gray-900 font-medium">
                {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR') : '-'}
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
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                  >
                    {stack}
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm font-semibold text-gray-600 mb-3">GitHub 연동</div>
            {userInfo?.githubUsername ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    {userInfo.githubUsername}
                  </div>
                  <div className="text-xs text-gray-600">GitHub 계정이 연동되어 있습니다</div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                  연동됨
                </span>
              </div>
            ) : (
              <div>
                <div className="text-sm text-gray-600 mb-3">
                  GitHub 계정을 연동하면 GitHub로도 로그인할 수 있습니다.
                </div>
                <button
                  onClick={() => {
                    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
                    window.location.href = `${apiBaseUrl}/auth/github`;
                  }}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub 연동하기
                </button>
              </div>
            )}
          </div>
        </div>

        {/* GitHub 통계 */}
        {githubStats && userInfo?.githubUsername && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub 활동 통계
            </h2>
            
            {githubStats.rateLimited && (
              <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-6 text-sm text-yellow-800">
                ⚠️ GitHub API 요청 한도에 도달했습니다. 통계 정보가 제한적으로 표시될 수 있습니다. 잠시 후 다시 시도해주세요.
              </div>
            )}
            
            {githubStats.permissionIssue && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-800">
                ⚠️ GitHub 권한 문제가 발생했습니다. 조직 저장소 정보를 가져오려면 추가 권한이 필요합니다.
                <div className="mt-2">
                  <a 
                    href={`${API_BASE_URL}/auth/github`}
                    className="text-red-800 underline font-bold"
                  >
                    GitHub로 다시 로그인하기 (재인증 필요)
                  </a>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.totalCommits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">총 커밋 수</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.publicRepositories}
                </div>
                <div className="text-sm text-gray-600">Public 저장소</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.commitPattern.lastWeek}
                </div>
                <div className="text-sm text-gray-600">최근 1주일</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.commitPattern.lastMonth}
                </div>
                <div className="text-sm text-gray-600">최근 1개월</div>
              </div>
            </div>

            {Object.keys(githubStats.languages).length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-600 mb-3">주요 사용 언어</div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(githubStats.languages)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 10)
                    .map(([language, count]) => (
                      <span
                        key={language}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {language} ({count})
                      </span>
                    ))}
                </div>
              </div>
            )}

            {githubStats.recentActivity && githubStats.recentActivity.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-600 mb-3">최근 활동 패턴 (최근 30일)</div>
                <div className="flex gap-0.5 items-end h-16">
                  {githubStats.recentActivity.map((activity, index) => {
                    const maxCommits = Math.max(...githubStats.recentActivity.map(a => a.commits), 1);
                    const height = maxCommits > 0 ? (activity.commits / maxCommits) * 60 : 0;
                    return (
                      <div
                        key={index}
                        className="flex-1 bg-emerald-500 rounded-t"
                        style={{ height: `${Math.max(height, 2)}px`, minHeight: '2px' }}
                        title={`${activity.date}: ${activity.commits} commits`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>30일 전</span>
                  <span>오늘</span>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-600">
              <a
                href={`https://github.com/${userInfo.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                GitHub 프로필 보기 →
              </a>
            </div>
          </div>
        )}

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats?.createdProjectsCount || 0}
            </div>
            <div className="text-sm text-gray-600">생성한 프로젝트</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              {stats?.appliedProjectsCount || 0}
            </div>
            <div className="text-sm text-gray-600">참여 신청한 프로젝트</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {stats?.pendingApplicationsCount || 0}
            </div>
            <div className="text-sm text-gray-600">대기 중인 신청</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-cyan-600 mb-2">
              {stats?.acceptedApplicationsCount || 0}
            </div>
            <div className="text-sm text-gray-600">수락된 신청</div>
          </div>
        </div>

        {/* 내가 생성한 프로젝트 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">내가 생성한 프로젝트 ({myProjects?.length || 0})</h2>
            <Link
              href="/projects/new"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
            >
              새 프로젝트 생성
            </Link>
          </div>
          {!myProjects || myProjects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-600 shadow-sm">
              생성한 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer h-full flex flex-col">
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

        {/* 내가 참여 신청한 프로젝트 */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">내가 참여 신청한 프로젝트 ({myApplications?.length || 0})</h2>
          {!myApplications || myApplications.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-600 shadow-sm">
              참여 신청한 프로젝트가 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {myApplications.map((application: any) => (
                <Link key={application.id} href={`/projects/${application.project.id}`}>
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{application.project.title}</h3>
                        <p className="text-sm text-gray-600">{application.project.shortDescription}</p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          application.status === 'ACCEPTED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : application.status === 'REJECTED'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {application.status === 'ACCEPTED' && '수락됨'}
                        {application.status === 'REJECTED' && '거절됨'}
                        {application.status === 'PENDING' && '대기 중'}
                      </span>
                    </div>
                    {application.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                        {application.message}
                      </div>
                    )}
                    <div className="mt-4 text-xs text-gray-600 space-y-1">
                      <div>프로젝트 생성자: {application.project.creator.nickname}</div>
                      <div>신청일: {new Date(application.createdAt).toLocaleDateString('ko-KR')}</div>
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
