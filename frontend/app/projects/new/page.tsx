// 프로젝트 생성 페이지
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { getToken } from '@/lib/api';
import { useI18n } from '@/lib/i18n/context';

// 사용 가능한 역할 목록 (다국어 지원)
const getAvailableRoles = (t: (key: string) => string) => [
  { value: 'DEVELOPER', label: t('role.developer') },
  { value: 'DESIGNER', label: t('role.designer') },
  { value: 'PLANNER', label: t('role.planner') },
];

// 사용 가능한 기술 스택 목록
const AVAILABLE_TECH_STACKS = [
  // Frontend
  'React', 'Vue.js', 'Next.js', 'Angular', 'TypeScript', 'JavaScript', 'HTML/CSS',
  // Backend
  'Node.js', 'NestJS', 'Express', 'Spring', 'Django', 'FastAPI', 'Python', 'Java',
  // Database
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  // Design
  'Figma', 'Photoshop', 'Illustrator', 'Sketch', 'Adobe XD',
  // Tools
  'Docker', 'Git', 'Kubernetes', 'AWS', 'Firebase', 'Prisma', 'TypeORM',
];

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    neededRoles: [] as string[],
    requiredStacks: [] as string[],
    startDate: '',
    endDate: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 로그인 체크
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await projectsApi.create(formData);
      router.push('/projects');
    } catch (err: any) {
      setError(err.message || t('project.createError'));
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = (role: string) => {
    if (formData.neededRoles.includes(role)) {
      setFormData({
        ...formData,
        neededRoles: formData.neededRoles.filter((r) => r !== role),
      });
    } else {
      setFormData({
        ...formData,
        neededRoles: [...formData.neededRoles, role],
      });
    }
  };

  const toggleStack = (stack: string) => {
    if (formData.requiredStacks.includes(stack)) {
      setFormData({
        ...formData,
        requiredStacks: formData.requiredStacks.filter((s) => s !== stack),
      });
    } else {
      setFormData({
        ...formData,
        requiredStacks: [...formData.requiredStacks, stack],
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{t('project.create')}</h1>
            <p className="text-gray-600">{t('project.createDescription')}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('project.title')}</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('project.titlePlaceholder')}
          />
        </div>

            {/* 한 줄 소개 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('project.description')}</label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            required
            rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder={t('project.descriptionPlaceholder')}
          />
        </div>

            {/* 필요 역할 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('project.roles')} ({t('common.multipleSelect')})</label>
              <div className="flex flex-wrap gap-3 mb-3">
            {getAvailableRoles(t).map((role) => (
              <label
                key={role.value}
                    className="flex items-center cursor-pointer px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.neededRoles.includes(role.value)}
                  onChange={() => toggleRole(role.value)}
                      className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                    <span className="text-sm font-medium text-gray-700">{role.label}</span>
              </label>
            ))}
          </div>
          {formData.neededRoles.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
              {formData.neededRoles.map((role) => (
                <span
                  key={role}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold"
                >
                  {getAvailableRoles(t).find((r) => r.value === role)?.label || role}
                </span>
              ))}
            </div>
          )}
        </div>

            {/* 필요 스택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('project.stacks')} ({t('common.multipleSelect')})</label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-xl p-4 space-y-2">
            {AVAILABLE_TECH_STACKS.map((stack) => (
              <label
                key={stack}
                    className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <input
                  type="checkbox"
                  checked={formData.requiredStacks.includes(stack)}
                  onChange={() => toggleStack(stack)}
                      className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                    <span className="text-sm text-gray-700">{stack}</span>
              </label>
            ))}
          </div>
          {formData.requiredStacks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
              {formData.requiredStacks.map((stack) => (
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

            {/* 프로젝트 기간 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('project.duration')} ({t('common.optional')})</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">{t('project.startDate')}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">{t('project.endDate')}</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate || undefined}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
        >
          {loading ? t('project.creating') : t('project.create')}
        </button>
      </form>
        </div>
      </div>
    </div>
  );
}
