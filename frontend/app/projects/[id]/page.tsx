// 프로젝트 상세 페이지
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, applicationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const isCreator = user && project && project.creator?.id === user.id;

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project && isCreator) {
      loadRecommendations();
    }
  }, [project, isCreator]);

  const loadProject = async () => {
    try {
      const data = await projectsApi.getOne(projectId);
      setProject(data);
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!isCreator) return;
    try {
      const data = await projectsApi.getRecommendations(projectId);
      setRecommendations(data);
    } catch (err) {
      console.error('추천 목록 로드 실패:', err);
    }
  };

  const handleApply = async () => {
    setApplying(true);
    try {
      await applicationsApi.create(projectId, applicationMessage);
      setApplySuccess(true);
      setApplicationMessage('');
    } catch (err: any) {
      alert(err.message || '참여 신청에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>로딩 중...</div>;
  }

  if (!project) {
    return <div style={{ padding: '20px' }}>프로젝트를 찾을 수 없습니다.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/projects" style={{ color: '#0070f3' }}>← 목록으로</Link>
      </div>

      <h1 style={{ marginBottom: '10px' }}>{project.title}</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>{project.shortDescription}</p>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h2>프로젝트 정보</h2>
          {isCreator && (
            <Link
              href={`/projects/${projectId}/manage`}
              style={{
                padding: '8px 16px',
                backgroundColor: '#28a745',
                color: 'white',
                borderRadius: '4px',
              }}
            >
              프로젝트 관리
            </Link>
          )}
        </div>
        <div style={{ marginTop: '10px' }}>
          <div><strong>생성자:</strong> {project.creator?.nickname}</div>
          <div><strong>필요 역할:</strong> {Array.isArray(project.neededRoles) ? project.neededRoles.join(', ') : 'N/A'}</div>
          <div><strong>필요 스택:</strong> {Array.isArray(project.requiredStacks) ? project.requiredStacks.join(', ') : 'N/A'}</div>
        </div>
      </div>

      {!isCreator && (
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
          <h2 style={{ marginBottom: '10px' }}>참여 신청</h2>
          {applySuccess ? (
            <div style={{ color: 'green', marginBottom: '10px' }}>참여 신청이 완료되었습니다!</div>
          ) : (
            <>
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="자기 PR을 입력하세요 (선택사항)"
                rows={3}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '10px' }}
              />
              <button
                onClick={handleApply}
                disabled={applying || !user}
                style={{
                  padding: '8px 16px',
                  backgroundColor: user ? '#0070f3' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: applying || !user ? 'not-allowed' : 'pointer',
                }}
              >
                {!user ? '로그인 필요' : applying ? '신청 중...' : '참여 신청하기'}
              </button>
            </>
          )}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <Link
          href={`/projects/${projectId}/chat`}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            borderRadius: '4px',
            marginBottom: '20px',
          }}
        >
          채팅방 들어가기
        </Link>
      </div>

      {isCreator && (
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ marginBottom: '15px' }}>추천 팀원</h2>
          {recommendations.length === 0 ? (
            <div>추천할 팀원이 없습니다.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {recommendations.map((recommendedUser) => (
                <div
                  key={recommendedUser.userId}
                  style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '15px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{recommendedUser.nickname}</div>
                  <div style={{ color: '#666', marginBottom: '5px' }}>역할: {recommendedUser.role}</div>
                  <div style={{ marginBottom: '5px' }}>
                    <strong>스택:</strong> {Array.isArray(recommendedUser.techStacks) ? recommendedUser.techStacks.join(', ') : 'N/A'}
                  </div>
                  <div style={{ color: '#0070f3', fontWeight: 'bold' }}>매칭 점수: {recommendedUser.score}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

