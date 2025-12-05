// 프로젝트 상세 페이지
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, applicationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ChatWidget from '@/components/ChatWidget';
import UserDropdown from '@/components/UserDropdown';

// 역할을 한글로 변환하는 함수
const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    'DEVELOPER': '개발자',
    'DESIGNER': '디자이너',
    'PLANNER': '기획자',
  };
  return roleMap[role] || role;
};

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
  const [closingRecruitment, setClosingRecruitment] = useState(false);
  const [invitingUsers, setInvitingUsers] = useState<Set<string>>(new Set());
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isCreator = user && project && project.creator?.id === user.id;
  const hasApplied = project?.hasApplied || false;
  const isRecruiting = project?.isRecruiting ?? true;
  const canAccessChat = user && (isCreator || project?.isAccepted);

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project && isCreator) {
      loadRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id, isCreator]);

  const loadProject = async () => {
    try {
      const data = await projectsApi.getOne(projectId);
      console.log('프로젝트 데이터:', data);
      console.log('isRecruiting:', data?.isRecruiting);
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
      setApplicationMessage('');
      await loadProject();
    } catch (err: any) {
      alert(err.message || '참여 신청에 실패했습니다.');
    } finally {
      setApplying(false);
    }
  };

  const handleInvite = async (userId: string) => {
    setInvitingUsers(prev => new Set(prev).add(userId));
    try {
      await applicationsApi.invite(projectId, userId);
      alert('초대가 완료되었습니다.');
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

  const handleCloseRecruitment = async () => {
    if (!confirm('모집을 종료하시겠습니까? 종료 후에는 참여 신청을 받을 수 없습니다.')) {
      return;
    }
    setClosingRecruitment(true);
    try {
      await projectsApi.closeRecruitment(projectId);
      await loadProject();
      alert('모집이 종료되었습니다.');
    } catch (err: any) {
      alert(err.message || '모집 종료에 실패했습니다.');
    } finally {
      setClosingRecruitment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">프로젝트를 찾을 수 없습니다.</div>
      </div>
    );
  }

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return null;
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return null;
    }
  };

  const start = formatDate(project.startDate);
  const end = formatDate(project.endDate);
  const dateRange = start && end ? `${start} ~ ${end}` : start ? `${start} ~` : end ? `~ ${end}` : '미정';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link 
          href="/projects" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          목록으로
        </Link>

        {/* 프로젝트 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4 flex-wrap">
                <h1 className="text-4xl font-bold text-gray-900">{project.title}</h1>
                {project.isRecruiting === false && (
                  <span className="px-4 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold whitespace-nowrap">
                    모집 완료
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">{project.shortDescription}</p>
            </div>
            {isCreator && project.isRecruiting !== false && (
              <button
                onClick={handleCloseRecruitment}
                disabled={closingRecruitment}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {closingRecruitment ? '처리 중...' : '모집 종료'}
              </button>
            )}
          </div>
      </div>

        {/* 프로젝트 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">프로젝트 정보</h2>
          {isCreator && (
            <Link
              href={`/projects/${projectId}/manage`}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              프로젝트 관리
            </Link>
          )}
        </div>
          <div className="space-y-5">
          <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700 min-w-[100px]">생성자:</span>
            {project.creator?.id ? (
                <UserDropdown
                  userId={project.creator.id}
                  nickname={project.creator.nickname}
                  onDirectChat={(userId) => {
                    // 개인 채팅 열기 (GlobalChatWidget에서 처리)
                    window.dispatchEvent(new CustomEvent('open-direct-chat', { detail: { userId } }));
                  }}
                />
            ) : (
                <span className="text-gray-600">{project.creator?.nickname || 'N/A'}</span>
            )}
          </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-gray-700 min-w-[100px]">필요 역할:</span>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(project.neededRoles) 
                  ? project.neededRoles.map((role: string) => (
                      <span key={role} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full">
                        {getRoleLabel(role)}
                      </span>
                    ))
                  : <span className="text-gray-600">N/A</span>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="font-semibold text-gray-700 min-w-[100px]">필요 스택:</span>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(project.requiredStacks) 
                  ? project.requiredStacks.map((stack: string) => (
                      <span key={stack} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                        {stack}
                      </span>
                    ))
                  : <span className="text-gray-600">N/A</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-700 min-w-[100px]">프로젝트 기간:</span>
              <span className="text-gray-600">{dateRange}</span>
            </div>
        </div>
      </div>

        {/* 참여 신청 */}
      {!isCreator && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">참여 신청</h2>
            {project.isRecruiting === false ? (
              <div className="px-6 py-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-700 font-semibold">
                모집이 종료된 프로젝트입니다.
              </div>
            ) : hasApplied ? (
              <div className="px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 font-semibold">
                참여 신청이 완료되었습니다!
              </div>
          ) : (
              <div className="space-y-4">
              <textarea
                value={applicationMessage}
                onChange={(e) => setApplicationMessage(e.target.value)}
                placeholder="자기 PR을 입력하세요 (선택사항)"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              />
              <button
                onClick={handleApply}
                disabled={applying || !user}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {!user ? '로그인 필요' : applying ? '신청 중...' : '참여 신청하기'}
              </button>
              </div>
          )}
        </div>
      )}

        {/* 채팅 버튼 (참여자만 표시) */}
        {canAccessChat && (
          <div className="mb-6">
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              채팅방 열기
            </button>
      </div>
        )}


        {/* 추천 팀원 */}
      {isCreator && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">추천 팀원</h2>
          {recommendations.length === 0 ? (
              <div className="text-gray-500 text-center py-12">추천할 팀원이 없습니다.</div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((recommendedUser) => (
                <div
                  key={recommendedUser.userId}
                    className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1 bg-white"
                >
                    <div className="font-bold text-lg text-gray-900 mb-3">
                      <UserDropdown
                        userId={recommendedUser.userId}
                        nickname={recommendedUser.nickname}
                        onDirectChat={(userId) => {
                          window.dispatchEvent(new CustomEvent('open-direct-chat', { detail: { userId } }));
                        }}
                      />
                    </div>
                    <div className="text-gray-600 text-sm mb-3">
                    역할: {
                      recommendedUser.role === 'DEVELOPER' ? '개발자' :
                      recommendedUser.role === 'DESIGNER' ? '디자이너' :
                      recommendedUser.role === 'PLANNER' ? '기획자' : recommendedUser.role
                    }
                  </div>
                    {recommendedUser.role === 'DEVELOPER' && (
                      <div className="text-sm text-gray-600 mb-4">
                        <span className="font-semibold">기술 스택:</span>{' '}
                        {Array.isArray(recommendedUser.techStacks) && recommendedUser.techStacks.length > 0
                          ? recommendedUser.techStacks.slice(0, 3).join(', ') + (recommendedUser.techStacks.length > 3 ? '...' : '')
                          : '없음'}
                      </div>
                    )}
                    {(recommendedUser.role === 'DESIGNER' || recommendedUser.role === 'PLANNER') && (
                      <>
                        {Array.isArray(recommendedUser.portfolioLinks) && recommendedUser.portfolioLinks.length > 0 && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold">포트폴리오:</span>{' '}
                            <span className="text-blue-600">{recommendedUser.portfolioLinks.length}개</span>
                          </div>
                        )}
                        {Array.isArray(recommendedUser.experience) && recommendedUser.experience.length > 0 && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="font-semibold">프로젝트 경험:</span>{' '}
                            <span className="text-blue-600">{recommendedUser.experience.length}개</span>
                          </div>
                        )}
                        {Array.isArray(recommendedUser.techStacks) && recommendedUser.techStacks.length > 0 && (
                          <div className="text-sm text-gray-600 mb-4">
                            <span className="font-semibold">
                              {recommendedUser.role === 'DESIGNER' ? '디자인 도구:' : '기획 도구:'}
                            </span>{' '}
                            {recommendedUser.techStacks.slice(0, 3).join(', ') + (recommendedUser.techStacks.length > 3 ? '...' : '')}
                          </div>
                        )}
                      </>
                    )}
                    <div className={`mb-4 p-4 rounded-xl text-center ${
                      recommendedUser.score >= 70 ? 'bg-emerald-50' : 
                      recommendedUser.score >= 50 ? 'bg-yellow-50' : 'bg-red-50'
                    }`}>
                      <div className="text-3xl font-bold text-blue-600">
                      {recommendedUser.score}점
                    </div>
                      <div className="text-xs text-gray-600 mt-1">
                      매칭률
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(recommendedUser.userId)}
                    disabled={invitingUsers.has(recommendedUser.userId)}
                      className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {invitingUsers.has(recommendedUser.userId) ? '초대 중...' : '초대하기'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* 프로젝트 상세 페이지 전용 채팅 버튼 (전역 버튼과 겹치지 않도록 조건부 렌더링) */}
      {canAccessChat && (
        <ChatWidget 
          projectId={projectId}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      )}
    </div>
  );
}
