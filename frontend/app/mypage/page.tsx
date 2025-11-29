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

  const { user: userInfo, myProjects, myApplications, stats } = mypageInfo || {};

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
      </div>

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

