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
    <div style={{ maxWidth: '600px', margin: '50px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>프로젝트 생성</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>한 줄 소개</label>
          <textarea
            value={formData.shortDescription}
            onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            required
            rows={3}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>필요 역할 (복수 선택 가능)</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            {AVAILABLE_ROLES.map((role) => (
              <label
                key={role.value}
                style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={formData.neededRoles.includes(role.value)}
                  onChange={() => toggleRole(role.value)}
                  style={{ marginRight: '5px' }}
                />
                <span>{role.label}</span>
              </label>
            ))}
          </div>
          {formData.neededRoles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
              {formData.neededRoles.map((role) => (
                <span
                  key={role}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {AVAILABLE_ROLES.find((r) => r.value === role)?.label || role}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>필요 스택 (복수 선택 가능)</label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
            {AVAILABLE_TECH_STACKS.map((stack) => (
              <label
                key={stack}
                style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={formData.requiredStacks.includes(stack)}
                  onChange={() => toggleStack(stack)}
                  style={{ marginRight: '8px' }}
                />
                <span>{stack}</span>
              </label>
            ))}
          </div>
          {formData.requiredStacks.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '10px' }}>
              {formData.requiredStacks.map((stack) => (
                <span
                  key={stack}
                  style={{
                    padding: '4px 8px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  {stack}
                </span>
              ))}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>프로젝트 기간 (선택사항)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>시작일</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>종료일</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                min={formData.startDate || undefined}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
        {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? '생성 중...' : '프로젝트 생성'}
        </button>
      </form>
    </div>
  );
}

