// 프로젝트 관리 페이지 - creator만 접근 가능
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { projectsApi, applicationsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';
import UserDropdown from '@/components/UserDropdown';

// 역할을 다국어로 변환하는 함수
const getRoleLabel = (role: string, t: (key: string) => string): string => {
  const roleMap: Record<string, string> = {
    'DEVELOPER': t('role.developer'),
    'DESIGNER': t('role.designer'),
    'PLANNER': t('role.planner'),
  };
  return roleMap[role] || role;
};

// 신청 상태를 다국어로 변환하는 함수
const getStatusLabel = (status: string, t: (key: string) => string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': t('project.statusPending'),
    'ACCEPTED': t('project.statusAccepted'),
    'REJECTED': t('project.statusRejected'),
  };
  return statusMap[status] || status;
};

export default function ProjectManagePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user } = useAuth();
  const { t, language } = useI18n();
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
      alert(t('project.acceptSuccess'));
    } catch (err: any) {
      alert(err.message || t('project.acceptError'));
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      await applicationsApi.reject(applicationId);
      loadApplications();
      alert(t('project.rejectSuccess'));
    } catch (err: any) {
      alert(err.message || t('project.rejectError'));
    }
  };

  const handleDelete = async () => {
    if (!confirm(t('project.deleteConfirm'))) {
      return;
    }

    try {
      await projectsApi.delete(projectId);
      alert(t('project.deleteSuccess'));
      router.push('/projects');
    } catch (err: any) {
      alert(err.message || t('project.deleteError'));
    }
  };

  const handleInvite = async (userId: string) => {
    setInvitingUsers(prev => new Set(prev).add(userId));
    try {
      await applicationsApi.invite(projectId, userId);
      alert(t('project.inviteSuccess'));
      // 참여 신청 목록과 추천 목록 새로고침
      loadApplications();
      loadRecommendations();
    } catch (err: any) {
      alert(err.message || t('project.inviteError'));
    } finally {
      setInvitingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const localeMap: Record<string, string> = {
      ko: "ko-KR",
      en: "en-US",
      ja: "ja-JP",
    };
    return date.toLocaleDateString(localeMap[language] || "ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">{t('project.notFound')}</div>
      </div>
    );
  }

  if (project.creator?.id !== user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">{t('project.accessDenied')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 */}
        <Link 
          href={`/projects/${projectId}`} 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('project.backToProject')}
        </Link>

        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('project.manage')}: {project.title}</h1>
            </div>
            <button
              onClick={handleDelete}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              {t('project.deleteProject')}
            </button>
          </div>
        </div>

        {/* 참여 신청 목록 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('project.applications')}</h2>
          {applications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t('project.noApplications')}</div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <div
                  key={application.id}
                  className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 bg-white"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {application.user?.id ? (
                          <UserDropdown
                            userId={application.user.id}
                            nickname={application.user.nickname}
                            onDirectChat={(userId) => {
                              window.dispatchEvent(new CustomEvent('open-direct-chat', { detail: { userId } }));
                            }}
                          />
                        ) : (
                          <div className="font-bold text-lg text-gray-900">{application.user?.nickname}</div>
                        )}
                      </div>
                      <div className="text-gray-600 text-sm mb-2">
                        {t('project.role')}: {getRoleLabel(application.user?.role || '', t)}
                      </div>
                      {application.message && (
                        <div className="mt-3 p-4 bg-gray-50 rounded-xl text-gray-700 text-sm">
                          {application.message}
                        </div>
                      )}
                      <div className="text-xs text-gray-500 mt-3">
                        {t('project.applicationDate')}: {formatDate(application.createdAt)}
                      </div>
                      {application.status && (
                        <div className="mt-2">
                          <span className="text-sm text-gray-600">{t('project.status')}: </span>
                          <strong className={`text-sm font-semibold ${
                            application.status === 'ACCEPTED' ? 'text-emerald-600' :
                            application.status === 'REJECTED' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>
                            {getStatusLabel(application.status, t)}
                          </strong>
                        </div>
                      )}
                    </div>
                    {application.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAccept(application.id)}
                          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          {t('project.accept')}
                        </button>
                        <button
                          onClick={() => handleReject(application.id)}
                          className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          {t('project.reject')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 추천 팀원 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('project.recommendations')}</h2>
          {recommendations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">{t('project.noRecommendations')}</div>
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
                    {t('project.role')}: {getRoleLabel(recommendedUser.role, t)}
                  </div>
                  {recommendedUser.role === 'DEVELOPER' && (
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-semibold">{t('project.stacks')}:</span>{' '}
                      {Array.isArray(recommendedUser.techStacks) && recommendedUser.techStacks.length > 0
                        ? recommendedUser.techStacks.slice(0, 3).join(', ') + (recommendedUser.techStacks.length > 3 ? '...' : '')
                        : t('common.none')}
                    </div>
                  )}
                  <div className={`mb-4 p-4 rounded-xl text-center ${
                    recommendedUser.score >= 70 ? 'bg-emerald-50' : 
                    recommendedUser.score >= 50 ? 'bg-yellow-50' : 'bg-red-50'
                  }`}>
                    <div className="text-3xl font-bold text-blue-600">
                      {recommendedUser.score}{t('common.score')}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {t('project.matchScore')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleInvite(recommendedUser.userId)}
                    disabled={invitingUsers.has(recommendedUser.userId)}
                    className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {invitingUsers.has(recommendedUser.userId) ? t('project.inviting') : t('project.invite')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

