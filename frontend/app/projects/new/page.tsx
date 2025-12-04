// 프로젝트 생성 페이지
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { getToken } from '@/lib/api';

// 사용 가능한 역할 목록
const AVAILABLE_ROLES = [
  { value: 'DEVELOPER', label: '개발자' },
  { value: 'DESIGNER', label: '디자이너' },
  { value: 'PLANNER', label: '기획자' },
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
      setError(err.message || '프로젝트 생성에 실패했습니다.');
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">프로젝트 생성</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 제목 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="프로젝트 제목을 입력하세요"
          />
        </div>

            {/* 한 줄 소개 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">한 줄 소개</label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            required
            rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="프로젝트를 한 줄로 소개해주세요"
          />
        </div>

            {/* 필요 역할 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">필요 역할 (복수 선택 가능)</label>
              <div className="flex flex-wrap gap-3 mb-3">
            {AVAILABLE_ROLES.map((role) => (
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
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {AVAILABLE_ROLES.find((r) => r.value === role)?.label || role}
                </span>
              ))}
            </div>
          )}
        </div>

            {/* 필요 스택 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">필요 스택 (복수 선택 가능)</label>
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
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {stack}
                </span>
              ))}
            </div>
          )}
        </div>

            {/* 프로젝트 기간 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">프로젝트 기간 (선택사항)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">시작일</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-2">종료일</label>
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
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed"
        >
          {loading ? '생성 중...' : '프로젝트 생성'}
        </button>
      </form>
        </div>
      </div>
    </div>
  );
}
