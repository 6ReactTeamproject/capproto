// 마이페이지 - 내 프로필 및 활동 정보
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { mypageApi, authApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

// 사용 가능한 기술 스택 목록
const AVAILABLE_TECH_STACKS = [
  "React",
  "Vue.js",
  "Next.js",
  "Angular",
  "TypeScript",
  "JavaScript",
  "HTML/CSS",
  "Node.js",
  "NestJS",
  "Express",
  "Spring",
  "Django",
  "FastAPI",
  "Python",
  "Java",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "React Native",
  "Flutter",
  "Swift",
  "Kotlin",
  "Figma",
  "Photoshop",
  "Illustrator",
  "Sketch",
  "Adobe XD",
  "Docker",
  "Git",
  "Kubernetes",
  "AWS",
  "Firebase",
  "Prisma",
  "TypeORM",
];

// 국가 목록 (다국어 지원)
const getCountries = (t: (key: string) => string) => [
  { code: "KR", name: t("common.country.kr") },
  { code: "US", name: t("common.country.us") },
  { code: "JP", name: t("common.country.jp") },
];

export default function MyPage() {
  const { user, loading: authLoading, logout, checkAuth } = useAuth();
  const { t, language } = useI18n();
  const [mypageInfo, setMypageInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFormData, setEditFormData] = useState({
    nickname: '',
    techStacks: [] as string[],
    country: '',
    password: '',
    portfolioLinks: [] as string[],
    experience: [] as Array<{
      title: string;
      role: string;
      period: string;
      description: string;
    }>,
  });
  const [newPortfolioLink, setNewPortfolioLink] = useState("");
  const [newExperience, setNewExperience] = useState({
    title: "",
    role: "",
    period: "",
    description: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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
      // 프로필 수정 폼 초기화
      const techStacks = data.user?.techStacks ? JSON.parse(data.user.techStacks || '[]') : [];
      const portfolioLinks = data.user?.portfolioLinks ? JSON.parse(data.user.portfolioLinks || '[]') : [];
      const experience = data.user?.experience ? JSON.parse(data.user.experience || '[]') : [];
      setEditFormData({
        nickname: data.user?.nickname || '',
        techStacks: techStacks,
        country: data.user?.country || '',
        password: '',
        portfolioLinks: portfolioLinks,
        experience: experience,
      });
    } catch (err: any) {
      console.error('마이페이지 정보 로드 실패:', err);
      setError(err.message || '정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setEditError(null);
    setEditLoading(true);

    try {
      const updateData: any = {};
      if (editFormData.nickname !== mypageInfo?.user?.nickname) {
        updateData.nickname = editFormData.nickname;
      }
      if (JSON.stringify(editFormData.techStacks) !== mypageInfo?.user?.techStacks) {
        updateData.techStacks = editFormData.techStacks;
      }
      if (editFormData.country !== mypageInfo?.user?.country) {
        updateData.country = editFormData.country;
      }
      const currentPortfolioLinks = mypageInfo?.user?.portfolioLinks ? JSON.parse(mypageInfo.user.portfolioLinks || '[]') : [];
      if (JSON.stringify(editFormData.portfolioLinks) !== JSON.stringify(currentPortfolioLinks)) {
        updateData.portfolioLinks = editFormData.portfolioLinks;
      }
      const currentExperience = mypageInfo?.user?.experience ? JSON.parse(mypageInfo.user.experience || '[]') : [];
      if (JSON.stringify(editFormData.experience) !== JSON.stringify(currentExperience)) {
        updateData.experience = editFormData.experience;
      }
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      await authApi.updateProfile(updateData);
      setIsEditingProfile(false);
      await loadMyPageInfo();
      await checkAuth(); // 인증 정보 새로고침
    } catch (err: any) {
      setEditError(err.message || t('mypage.editError'));
    } finally {
      setEditLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900 mb-2">{t('common.loading')}</div>
          <div className="text-sm text-gray-600 mt-2">
          {t('mypage.loadingGitHub')}
        </div>
          <div className="mt-4 text-xs text-gray-500">
          {t('mypage.loadingGitHubHint')}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('mypage.loginRequired')}</h1>
          <p className="text-gray-600 mb-6">{t('mypage.loginRequiredDesc')}</p>
        <Link
          href="/login"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {t('mypage.loginButton')}
        </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium mb-4">
            {t('common.error')}: {error}
          </div>
        <button
          onClick={loadMyPageInfo}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          {t('common.retry')}
        </button>
        </div>
      </div>
    );
  }

  const { user: userInfo, myProjects, myApplications, stats, githubStats } = mypageInfo || {};
  const techStacks = userInfo?.techStacks ? JSON.parse(userInfo.techStacks || '[]') : [];
  const portfolioLinks = userInfo?.portfolioLinks ? JSON.parse(userInfo.portfolioLinks || '[]') : [];
  const experience = userInfo?.experience ? JSON.parse(userInfo.experience || '[]') : [];

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/projects" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('project.list')}
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('mypage.title')}</h1>

      {/* 프로필 정보 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('mypage.profile')}</h2>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {t('mypage.editProfile')}
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('mypage.nickname')}</label>
                <input
                  type="text"
                  value={editFormData.nickname}
                  onChange={(e) => setEditFormData({ ...editFormData, nickname: e.target.value })}
                  required
                  minLength={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('mypage.country')}</label>
                <select
                  value={editFormData.country}
                  onChange={(e) => setEditFormData({ ...editFormData, country: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('auth.selectCountry')}</option>
                  {getCountries(t).map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* 기술 스택 (개발자용) */}
              {user?.role === "DEVELOPER" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">{t('mypage.techStacks')} ({t('common.multipleSelect')})</label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-xl p-4 space-y-2">
                    {AVAILABLE_TECH_STACKS.map((stack) => (
                      <label
                        key={stack}
                        className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={editFormData.techStacks.includes(stack)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({
                                ...editFormData,
                                techStacks: [...editFormData.techStacks, stack],
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                techStacks: editFormData.techStacks.filter((s) => s !== stack),
                              });
                            }
                          }}
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{stack}</span>
                      </label>
                    ))}
                  </div>
                  {editFormData.techStacks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {editFormData.techStacks.map((stack) => (
                        <span
                          key={stack}
                          className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 포트폴리오 링크 (디자이너/기획자용) */}
              {(user?.role === "DESIGNER" || user?.role === "PLANNER") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {user.role === "DESIGNER" 
                      ? t('auth.portfolioLinksDesigner')
                      : t('auth.portfolioLinksPlanner')}
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="url"
                      value={newPortfolioLink}
                      onChange={(e) => setNewPortfolioLink(e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && newPortfolioLink.trim()) {
                          e.preventDefault();
                          setEditFormData({
                            ...editFormData,
                            portfolioLinks: [...editFormData.portfolioLinks, newPortfolioLink.trim()],
                          });
                          setNewPortfolioLink("");
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newPortfolioLink.trim()) {
                          setEditFormData({
                            ...editFormData,
                            portfolioLinks: [...editFormData.portfolioLinks, newPortfolioLink.trim()],
                          });
                          setNewPortfolioLink("");
                        }
                      }}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      추가
                    </button>
                  </div>
                  {editFormData.portfolioLinks.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {editFormData.portfolioLinks.map((link, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                        >
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {link.length > 40 ? `${link.substring(0, 40)}...` : link}
                          </a>
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData({
                                ...editFormData,
                                portfolioLinks: editFormData.portfolioLinks.filter((_, i) => i !== index),
                              });
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 기술 스택 (디자이너/기획자용 - 도구 경험) */}
              {(user?.role === "DESIGNER" || user?.role === "PLANNER") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    {user.role === "DESIGNER" 
                      ? "디자인 도구 경험 (Figma, Adobe 등)" 
                      : "기획 도구 경험 (Notion, Figma, Miro 등)"}
                  </label>
                  <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-xl p-4 space-y-2">
                    {AVAILABLE_TECH_STACKS.map((stack) => (
                      <label
                        key={stack}
                        className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={editFormData.techStacks.includes(stack)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({
                                ...editFormData,
                                techStacks: [...editFormData.techStacks, stack],
                              });
                            } else {
                              setEditFormData({
                                ...editFormData,
                                techStacks: editFormData.techStacks.filter((s) => s !== stack),
                              });
                            }
                          }}
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{stack}</span>
                      </label>
                    ))}
                  </div>
                  {editFormData.techStacks.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {editFormData.techStacks.map((stack) => (
                        <span
                          key={stack}
                          className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                        >
                          {stack}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 프로젝트 경험 (디자이너/기획자용) */}
              {(user?.role === "DESIGNER" || user?.role === "PLANNER") && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    프로젝트 경험 (선택사항)
                  </label>
                  <div className="space-y-3 mb-3 p-4 border border-gray-300 rounded-xl bg-gray-50">
                    <input
                      type="text"
                      value={newExperience.title}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, title: e.target.value })
                      }
                      placeholder="프로젝트명"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newExperience.role}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, role: e.target.value })
                      }
                      placeholder={t("auth.projectRole")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      value={newExperience.period}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, period: e.target.value })
                      }
                      placeholder={t("auth.period")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      value={newExperience.description}
                      onChange={(e) =>
                        setNewExperience({ ...newExperience, description: e.target.value })
                      }
                      placeholder={t("auth.description")}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newExperience.title.trim()) {
                          setEditFormData({
                            ...editFormData,
                            experience: [...editFormData.experience, { ...newExperience }],
                          });
                          setNewExperience({
                            title: "",
                            role: "",
                            period: "",
                            description: "",
                          });
                        }
                      }}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      {t("auth.addExperience")}
                    </button>
                  </div>
                  {editFormData.experience.length > 0 && (
                    <div className="space-y-2">
                      {editFormData.experience.map((exp, index) => (
                        <div
                          key={index}
                          className="p-3 bg-white border border-gray-200 rounded-xl flex justify-between items-start"
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{exp.title}</div>
                            <div className="text-sm text-gray-600">
                              {exp.role} · {exp.period}
                            </div>
                            {exp.description && (
                              <div className="text-sm text-gray-500 mt-1">{exp.description}</div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData({
                                ...editFormData,
                                experience: editFormData.experience.filter((_, i) => i !== index),
                              });
                            }}
                            className="text-red-600 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

          <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t("mypage.passwordChange")}</label>
                <input
                  type="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                  minLength={6}
                  placeholder={t("mypage.passwordPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-gray-500 mt-1">{t("mypage.passwordHint")}</div>
              </div>
              {editError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                  {editError}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  disabled={editLoading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
                >
                  {editLoading ? t("mypage.saving") : t("mypage.saveButton")}
                </button>
                <button
                  onClick={() => {
                    setIsEditingProfile(false);
                    setEditError(null);
                    // 폼 데이터 초기화
                    const techStacks = mypageInfo?.user?.techStacks ? JSON.parse(mypageInfo.user.techStacks || '[]') : [];
                    const portfolioLinks = mypageInfo?.user?.portfolioLinks ? JSON.parse(mypageInfo.user.portfolioLinks || '[]') : [];
                    const experience = mypageInfo?.user?.experience ? JSON.parse(mypageInfo.user.experience || '[]') : [];
                    setEditFormData({
                      nickname: mypageInfo?.user?.nickname || '',
                      techStacks: techStacks,
                      country: mypageInfo?.user?.country || '',
                      password: '',
                      portfolioLinks: portfolioLinks,
                      experience: experience,
                    });
                    setNewPortfolioLink("");
                    setNewExperience({
                      title: "",
                      role: "",
                      period: "",
                      description: "",
                    });
                  }}
                  disabled={editLoading}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
                >
                  {t("common.cancel")}
                </button>
              </div>
          </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">{t("mypage.nickname")}</div>
                  <div className="text-gray-900 font-medium">{userInfo?.nickname || '-'}</div>
          </div>
          <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">{t("mypage.email")}</div>
                  <div className="text-gray-900 font-medium">{userInfo?.email || '-'}</div>
                </div>
            <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">{t("mypage.role")}</div>
                  <div className="text-gray-900 font-medium">
              {userInfo?.role === 'DEVELOPER' && t("role.developer")}
              {userInfo?.role === 'DESIGNER' && t("role.designer")}
              {userInfo?.role === 'PLANNER' && t("role.planner")}
            </div>
          </div>
          <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">{t("mypage.country")}</div>
                  <div className="text-gray-900 font-medium">
                    {userInfo?.country ? getCountries(t).find(c => c.code === userInfo.country)?.name || userInfo.country : '-'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div>
                  <div className="text-sm font-semibold text-gray-600 mb-2">{t("mypage.joinedDate")}</div>
                  <div className="text-gray-900 font-medium">
                    {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString(
                      language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US'
                    ) : '-'}
                  </div>
          </div>
        </div>
        {techStacks.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gray-600 mb-3">
                    {userInfo?.role === 'DEVELOPER' ? t("mypage.techStacks") : userInfo?.role === 'DESIGNER' ? t("mypage.designTools") : t("mypage.planningTools")}
                  </div>
                  <div className="flex flex-wrap gap-2">
              {techStacks.map((stack: string, index: number) => (
                <span
                  key={index}
                        className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                >
                  {stack}
                </span>
              ))}
            </div>
          </div>
        )}
        {portfolioLinks.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-600 mb-3">
              {userInfo?.role === 'DESIGNER' ? t("mypage.portfolioLinks") : t("auth.portfolioLinksPlanner")}
            </div>
            <div className="flex flex-wrap gap-2">
              {portfolioLinks.map((link: string, index: number) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  {link.length > 40 ? `${link.substring(0, 40)}...` : link}
                </a>
              ))}
            </div>
          </div>
        )}
        {experience.length > 0 && (
          <div className="mb-6">
            <div className="text-sm font-semibold text-gray-600 mb-3">{t("mypage.experience")}</div>
            <div className="space-y-3">
              {experience.map((exp: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-white border border-gray-200 rounded-xl"
                >
                  <div className="font-semibold text-gray-900 mb-1">{exp.title}</div>
                  <div className="text-sm text-gray-600 mb-2">
                    {exp.role} · {exp.period}
                  </div>
                  {exp.description && (
                    <div className="text-sm text-gray-500">{exp.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
            </>
          )}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="text-sm font-semibold text-gray-600 mb-3">{t("mypage.github")}</div>
          {userInfo?.githubUsername ? (
              <div className="flex items-center justify-between">
              <div>
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  {userInfo.githubUsername}
                </div>
                  <div className="text-xs text-gray-600">{t("mypage.githubConnected")}</div>
              </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
                {t("mypage.connected")}
              </span>
            </div>
          ) : (
            <div>
                <div className="text-sm text-gray-600 mb-3">
                {t("mypage.githubLinkDescription")}
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
                {t("mypage.linkGitHub")}
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
            {t("mypage.githubStats")}
          </h2>
          
          {githubStats.rateLimited && (
              <div className="px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-6 text-sm text-yellow-800">
              {t("mypage.githubRateLimited")}
            </div>
          )}
          
          {githubStats.permissionIssue && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl mb-6 text-sm text-red-800">
              {t("mypage.githubPermissionIssue")}
                <div className="mt-2">
                <a 
                  href={`${API_BASE_URL}/auth/github`}
                    className="text-red-800 underline font-bold"
                >
                  {t("mypage.githubReauth")}
                </a>
              </div>
            </div>
          )}
          
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                {githubStats.totalCommits.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">{t("mypage.totalCommits")}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.publicRepositories}
            </div>
                <div className="text-sm text-gray-600">{t("mypage.publicRepos")}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.commitPattern.lastWeek}
            </div>
                <div className="text-sm text-gray-600">{t("mypage.lastWeek")}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {githubStats.commitPattern.lastMonth}
            </div>
                <div className="text-sm text-gray-600">{t("mypage.lastMonth")}</div>
            </div>
          </div>

          {Object.keys(githubStats.languages).length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-semibold text-gray-600 mb-3">{t("mypage.topLanguages")}</div>
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
                <div className="text-sm font-semibold text-gray-600 mb-3">{t("mypage.recentActivity")}</div>
                <div className="flex gap-0.5 items-end h-16">
                {githubStats.recentActivity.map((activity, index) => {
                  const maxCommits = Math.max(...githubStats.recentActivity.map(a => a.commits), 1);
                    const height = maxCommits > 0 ? (activity.commits / maxCommits) * 60 : 0;
                  return (
                    <div
                      key={index}
                        className="flex-1 bg-emerald-500 rounded-t"
                        style={{ height: `${Math.max(height, 2)}px`, minHeight: '2px' }}
                        title={`${activity.date}: ${activity.commits} ${t("mypage.commits")}`}
                    />
                  );
                })}
              </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                <span>{t("mypage.daysAgo30")}</span>
                <span>{t("mypage.today")}</span>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent mb-2">
            {stats?.createdProjectsCount || 0}
            </div>
            <div className="text-sm text-gray-600 font-medium">{t("mypage.createdProjects")}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent mb-2">
              {stats?.appliedProjectsCount || 0}
        </div>
            <div className="text-sm text-gray-600 font-medium">{t("mypage.appliedProjects")}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent mb-2">
              {stats?.pendingApplicationsCount || 0}
        </div>
            <div className="text-sm text-gray-600 font-medium">{t("mypage.pendingApplications")}</div>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
            <div className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-cyan-700 bg-clip-text text-transparent mb-2">
              {stats?.acceptedApplicationsCount || 0}
        </div>
            <div className="text-sm text-gray-600 font-medium">{t("mypage.acceptedApplications")}</div>
        </div>
      </div>

      {/* 내가 생성한 프로젝트 */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t("mypage.myProjects")} ({myProjects?.length || 0})</h2>
          <Link
            href="/projects/new"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {t("project.create")}
          </Link>
        </div>
        {!myProjects || myProjects.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-600 shadow-lg">
            {t("mypage.noCreatedProjects")}
          </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myProjects.map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer h-full flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{project.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2">
                    {project.shortDescription}
                  </p>
                    <div className="flex gap-4 text-xs text-gray-500 mb-2">
                    <span>{t("project.applications")}: {project.applicationCount || 0}{t("common.count")}</span>
                    <span>{t("chat.title")}: {project.messageCount || 0}{t("common.count")}</span>
                  </div>
                    <div className="text-xs text-gray-600">
                    {new Date(project.createdAt).toLocaleDateString(
                      language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US'
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 내가 참여 신청한 프로젝트 */}
      <div>
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t("mypage.myApplications")} ({myApplications?.length || 0})</h2>
        {!myApplications || myApplications.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-600 shadow-lg">
            {t("mypage.noAppliedProjects")}
          </div>
        ) : (
            <div className="space-y-4">
            {myApplications.map((application: any) => (
              <Link key={application.id} href={`/projects/${application.project.id}`}>
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1 cursor-pointer">
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
                        {application.status === 'ACCEPTED' && t("project.accepted")}
                        {application.status === 'REJECTED' && t("project.rejected")}
                        {application.status === 'PENDING' && t("mypage.pending")}
                      </span>
                  </div>
                  {application.message && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-sm text-gray-700">
                      {application.message}
                    </div>
                  )}
                    <div className="mt-4 text-xs text-gray-600 space-y-1">
                    <div>{t("project.creator")}: {application.project.creator.nickname}</div>
                    <div>{t("project.apply")}: {new Date(application.createdAt).toLocaleDateString(
                      language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US'
                    )}</div>
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
