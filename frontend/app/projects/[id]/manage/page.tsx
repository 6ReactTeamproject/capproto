// 프로젝트 관리 페이지 - creator만 접근 가능
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, applicationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function ProjectManagePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuth();
  const [project, setProject] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadProject();
      loadApplications();
      loadRecommendations();
    }
  }, [projectId, user]);

  const loadProject = async () => {
    try {
      const data = await projectsApi.getOne(projectId);
      setProject(data);
      // 권한 체크
      if (data.creator?.id !== user?.id) {
        router.push(`/projects/${projectId}`);
      }
    } catch (err) {
      console.error('프로젝트 로드 실패:', err);
      router.push('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const data = await applicationsApi.getByProject(projectId);
      setApplications(data);
    } catch (err) {
      console.error('참여 신청 목록 로드 실패:', err);
    }
  };

  const loadRecommendations = async () => {
    try {
      const data = await projectsApi.getRecommendations(projectId);
      setRecommendations(data);
    } catch (err) {
      console.error('추천 목록 로드 실패:', err);
    }
  };

  const handleAccept = async (applicationId: string) => {
    try {
      await applicationsApi.accept(applicationId);
      loadApplications();
    } catch (err: any) {
      alert(err.message || '수락에 실패했습니다.');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      await applicationsApi.reject(applicationId);
      loadApplications();
    } catch (err: any) {
      alert(err.message || '거절에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    try {
      await projectsApi.delete(projectId);
      alert('프로젝트가 삭제되었습니다.');
      router.push('/projects');
    } catch (err: any) {
      alert(err.message || '프로젝트 삭제에 실패했습니다.');
    }
  };

  const handleInvite = async (userId: string) => {
    setInvitingUsers(prev => new Set(prev).add(userId));
    try {
      await applicationsApi.invite(projectId, userId);
      alert('초대가 완료되었습니다.');
      // 참여 신청 목록과 추천 목록 새로고침
      loadApplications();
      loadRecommendations();
    } catch (err: any) {
      alert(err.message || '초대에 실패했습니다.');
    } finally {
      setInvitingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>로딩 중...</div>;
  }

  if (!project) {
    return <div style={{ padding: '20px' }}>프로젝트를 찾을 수 없습니다.</div>;
  }

  if (project.creator?.id !== user?.id) {
    return <div style={{ padding: '20px' }}>권한이 없습니다.</div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href={`/projects/${projectId}`} style={{ color: '#0070f3' }}>← 프로젝트로 돌아가기</Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>프로젝트 관리: {project.title}</h1>
        <button
          onClick={handleDelete}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          프로젝트 삭제
        </button>
      </div>

      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        <h2 style={{ marginBottom: '15px' }}>참여 신청 목록</h2>
        {applications.length === 0 ? (
          <div>참여 신청이 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {applications.map((application) => (
              <div
                key={application.id}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{application.user?.nickname}</div>
                    <div style={{ color: '#666', marginBottom: '5px' }}>역할: {application.user?.role}</div>
                    {application.message && (
                      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        {application.message}
                      </div>
                    )}
                    <div style={{ fontSize: '0.9em', color: '#999', marginTop: '10px' }}>
                      신청일: {new Date(application.createdAt).toLocaleString()}
                    </div>
                    {application.status && (
                      <div style={{ marginTop: '5px' }}>
                        상태: <strong>{application.status === 'ACCEPTED' ? '수락됨' : application.status === 'REJECTED' ? '거절됨' : '대기 중'}</strong>
                      </div>
                    )}
                  </div>
                  {application.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleAccept(application.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleReject(application.id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px', 
                  backgroundColor: recommendedUser.score >= 70 ? '#d4edda' : recommendedUser.score >= 50 ? '#fff3cd' : '#f8d7da',
                  borderRadius: '4px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0070f3' }}>
                    {recommendedUser.score}점
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    매칭률
                  </div>
                </div>
                <button
                  onClick={() => handleInvite(recommendedUser.userId)}
                  disabled={invitingUsers.has(recommendedUser.userId)}
                  style={{
                    marginTop: '10px',
                    width: '100%',
                    padding: '8px 16px',
                    backgroundColor: invitingUsers.has(recommendedUser.userId) ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: invitingUsers.has(recommendedUser.userId) ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  {invitingUsers.has(recommendedUser.userId) ? '초대 중...' : '초대하기'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

