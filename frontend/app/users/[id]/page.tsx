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
      // 프로젝트 로드 실패는 에러로 표시하지 않고 빈 배열로 처리
      setProjects([]);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ color: 'red', marginBottom: '20px' }}>
          {error || '유저를 찾을 수 없습니다.'}
        </div>
        <Link
          href="/projects"
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
          프로젝트 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 기술 스택 파싱
  const techStacks = user?.techStacks ? JSON.parse(user.techStacks || '[]') : [];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '30px' }}>
        <Link href="/projects" style={{ color: '#0070f3', textDecoration: 'none' }}>
          ← 프로젝트 목록
        </Link>
      </div>

      <h1 style={{ marginBottom: '30px' }}>{user.nickname}님의 프로필</h1>

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
            <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{user.nickname || '-'}</div>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>역할</strong>
            <div>
              {user.role === 'DEVELOPER' && '개발자'}
              {user.role === 'DESIGNER' && '디자이너'}
              {user.role === 'PLANNER' && '기획자'}
            </div>
          </div>
          <div>
            <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>가입일</strong>
            <div>{user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : '-'}</div>
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

        {user.githubUsername && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <strong style={{ color: '#666', display: 'block', marginBottom: '10px' }}>GitHub</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0070f3', textDecoration: 'none' }}
              >
                {user.githubUsername}
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 생성한 프로젝트 */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>
          {user.nickname}님이 생성한 프로젝트 ({projects.length})
        </h2>
        {projects.length === 0 ? (
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
            {projects.map((project: any) => (
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
    </div>
  );
}

