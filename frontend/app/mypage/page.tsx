// 마이페이지 - 내 프로필 및 활동 정보
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { mypageApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

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
    return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  }

  if (!user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <h1>로그인이 필요합니다</h1>
        <p style={{ marginTop: '10px', color: '#666' }}>마이페이지를 보려면 먼저 로그인해주세요.</p>
        <Link
          href="/login"
          style={{
            display: 'inline-block',
            marginTop: '20px',
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            borderRadius: '4px',
            textDecoration: 'none',
          }}
        >
          로그인하기
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '20px' }}>오류: {error}</div>
        <button
          onClick={loadMyPageInfo}
          style={{
            padding: '12px 24px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  const { user: userInfo, myProjects, myApplications, stats, githubStats } = mypageInfo || {};

  // 기술 스택 파싱
  const techStacks = userInfo?.techStacks ? JSON.parse(userInfo.techStacks || '[]') : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link href="/projects" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← 프로젝트 목록
        </Link>
      </div>

      <h1 style={{ marginBottom: '30px' }}>마이페이지</h1>

      {/* 프로필 정보 */}
      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '30px',
          backgroundColor: '#fff',
        }}
      >
        <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>프로필 정보</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>닉네임</strong>
            <div>{userInfo?.nickname || '-'}</div>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>이메일</strong>
            <div>{userInfo?.email || '-'}</div>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>역할</strong>
            <div>
              {userInfo?.role === 'DEVELOPER' && '개발자'}
              {userInfo?.role === 'DESIGNER' && '디자이너'}
              {userInfo?.role === 'PLANNER' && '기획자'}
            </div>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>가입일</strong>
            <div>{userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString('ko-KR') : '-'}</div>
          </div>
        </div>
        {techStacks.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>기술 스택</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {techStacks.map((stack: string, index: number) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '16px',
                    fontSize: '14px',
                  }}
                >
                  {stack}
                </span>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>GitHub 연동</strong>
          {userInfo?.githubUsername ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {userInfo.githubUsername}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>GitHub 계정이 연동되어 있습니다</div>
              </div>
              <span style={{ padding: '6px 12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}>
                연동됨
              </span>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '10px', color: '#666', fontSize: '14px' }}>
                GitHub 계정을 연동하면 GitHub로도 로그인할 수 있습니다.
              </div>
              <button
                onClick={() => {
                  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
                  window.location.href = `${apiBaseUrl}/auth/github`;
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#24292e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                }}
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
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '30px',
            backgroundColor: '#fff',
          }}
        >
          <h2 style={{ marginBottom: '20px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub 활동 통계
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#24292e', marginBottom: '5px' }}>
                {githubStats.totalCommits.toLocaleString()}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>총 커밋 수</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#24292e', marginBottom: '5px' }}>
                {githubStats.publicRepositories}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Public 저장소</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#24292e', marginBottom: '5px' }}>
                {githubStats.commitPattern.lastWeek}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>최근 1주일</div>
            </div>
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#24292e', marginBottom: '5px' }}>
                {githubStats.commitPattern.lastMonth}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>최근 1개월</div>
            </div>
          </div>

          {/* 사용 언어 */}
          {Object.keys(githubStats.languages).length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>주요 사용 언어</strong>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {Object.entries(githubStats.languages)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([language, count]) => (
                    <span
                      key={language}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        borderRadius: '16px',
                        fontSize: '14px',
                      }}
                    >
                      {language} ({count})
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* 최근 활동 패턴 */}
          {githubStats.recentActivity && githubStats.recentActivity.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>최근 활동 패턴 (최근 30일)</strong>
              <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '60px' }}>
                {githubStats.recentActivity.map((activity, index) => {
                  const maxCommits = Math.max(...githubStats.recentActivity.map(a => a.commits), 1);
                  const height = maxCommits > 0 ? (activity.commits / maxCommits) * 50 : 0;
                  return (
                    <div
                      key={index}
                      style={{
                        flex: 1,
                        backgroundColor: activity.commits > 0 ? '#28a745' : '#e9ecef',
                        height: `${Math.max(height, 2)}px`,
                        minHeight: '2px',
                        borderRadius: '2px 2px 0 0',
                        title: `${activity.date}: ${activity.commits} commits`,
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '12px', color: '#666' }}>
                <span>30일 전</span>
                <span>오늘</span>
              </div>
            </div>
          )}

          <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
            <a
              href={`https://github.com/${userInfo.githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#0070f3', textDecoration: 'none' }}
            >
              GitHub 프로필 보기 →
            </a>
          </div>
        </div>
      )}

      {/* 통계 정보 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px',
          marginBottom: '30px',
        }}
      >
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0070f3', marginBottom: '5px' }}>
            {stats?.createdProjectsCount || 0}
          </div>
          <div style={{ color: '#666' }}>생성한 프로젝트</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745', marginBottom: '5px' }}>
            {stats?.appliedProjectsCount || 0}
          </div>
          <div style={{ color: '#666' }}>참여 신청한 프로젝트</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffc107', marginBottom: '5px' }}>
            {stats?.pendingApplicationsCount || 0}
          </div>
          <div style={{ color: '#666' }}>대기 중인 신청</div>
        </div>
        <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8', marginBottom: '5px' }}>
            {stats?.acceptedApplicationsCount || 0}
          </div>
          <div style={{ color: '#666' }}>수락된 신청</div>
        </div>
      </div>

      {/* 내가 생성한 프로젝트 */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px' }}>내가 생성한 프로젝트 ({myProjects?.length || 0})</h2>
          <Link
            href="/projects/new"
            style={{
              padding: '8px 16px',
              backgroundColor: '#0070f3',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            새 프로젝트 생성
          </Link>
        </div>
        {!myProjects || myProjects.length === 0 ? (
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            생성한 프로젝트가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {myProjects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    backgroundColor: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <h3 style={{ marginBottom: '10px', fontSize: '18px' }}>{project.title}</h3>
                  <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                    {project.shortDescription}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#999' }}>
                    <span>신청: {project.applicationCount || 0}건</span>
                    <span>메시지: {project.messageCount || 0}개</span>
                  </div>
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
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
        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>내가 참여 신청한 프로젝트 ({myApplications?.length || 0})</h2>
        {!myApplications || myApplications.length === 0 ? (
          <div
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              color: '#666',
            }}
          >
            참여 신청한 프로젝트가 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {myApplications.map((application: any) => (
              <Link key={application.id} href={`/projects/${application.project.id}`}>
                <div
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '20px',
                    cursor: 'pointer',
                    transition: 'box-shadow 0.2s',
                    backgroundColor: '#fff',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ marginBottom: '5px', fontSize: '18px' }}>{application.project.title}</h3>
                      <p style={{ color: '#666', fontSize: '14px' }}>{application.project.shortDescription}</p>
                    </div>
                    <div>
                      <span
                        style={{
                          padding: '6px 12px',
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor:
                            application.status === 'ACCEPTED'
                              ? '#d4edda'
                              : application.status === 'REJECTED'
                                ? '#f8d7da'
                                : '#fff3cd',
                          color:
                            application.status === 'ACCEPTED'
                              ? '#155724'
                              : application.status === 'REJECTED'
                                ? '#721c24'
                                : '#856404',
                        }}
                      >
                        {application.status === 'ACCEPTED' && '수락됨'}
                        {application.status === 'REJECTED' && '거절됨'}
                        {application.status === 'PENDING' && '대기 중'}
                      </span>
                    </div>
                  </div>
                  {application.message && (
                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px', fontSize: '14px' }}>
                      {application.message}
                    </div>
                  )}
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
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
  );
}

