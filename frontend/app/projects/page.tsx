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
    return <div style={{ padding: '20px' }}>로딩 중...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>프로젝트 목록</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            href="/releases"
            style={{
              padding: '8px 16px',
              backgroundColor: '#28a745',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
            }}
          >
            릴리즈 정보
          </Link>
          {user ? (
            <>
              <Link href="/mypage" style={{ color: '#0070f3', textDecoration: 'none', marginRight: '10px' }}>
                마이페이지
              </Link>
              <span style={{ color: '#666' }}>안녕하세요, {user.nickname}님</span>
              <button
                onClick={logout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                로그아웃
              </button>
              <Link href="/projects/new" style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px' }}>
                프로젝트 생성
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" style={{ marginRight: '10px', color: '#0070f3' }}>로그인</Link>
              <Link href="/projects/new" style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px' }}>
                프로젝트 생성
              </Link>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map((project) => (
          <Link key={project.id} href={`/projects/${project.id}`}>
            <div
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'box-shadow 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <h2 style={{ margin: 0, flex: 1 }}>{project.title}</h2>
                {project.isRecruiting === false && (
                  <span style={{
                    padding: '4px 8px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    whiteSpace: 'nowrap',
                    marginLeft: '10px'
                  }}>
                    모집 완료
                  </span>
                )}
              </div>
              <p style={{ color: '#666', marginBottom: '15px' }}>{project.shortDescription}</p>
              <div style={{ marginBottom: '10px' }}>
                <strong>필요 역할:</strong>{' '}
                {Array.isArray(project.neededRoles) ? project.neededRoles.join(', ') : 'N/A'}
              </div>
              <div>
                <strong>필요 스택:</strong>{' '}
                {Array.isArray(project.requiredStacks)
                  ? project.requiredStacks.slice(0, 3).join(', ')
                  : 'N/A'}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

