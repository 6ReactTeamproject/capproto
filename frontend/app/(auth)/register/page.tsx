// 회원가입 페이지
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, setToken } from '@/lib/api';

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

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nickname: '',
    role: 'DEVELOPER',
    techStacks: [] as string[],
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.register(formData);
      setToken(response.accessToken);
      router.push('/projects');
    } catch (err: any) {
      setError(err.message || '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>회원가입</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>이메일</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>비밀번호</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            minLength={6}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>닉네임</label>
          <input
            type="text"
            value={formData.nickname}
            onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
            required
            minLength={2}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>역할</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          >
            <option value="DEVELOPER">개발자</option>
            <option value="DESIGNER">디자이너</option>
            <option value="PLANNER">기획자</option>
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>기술 스택 (복수 선택 가능)</label>
          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
            {AVAILABLE_TECH_STACKS.map((stack) => (
              <label
                key={stack}
                style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}
              >
                <input
                  type="checkbox"
                  checked={formData.techStacks.includes(stack)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        techStacks: [...formData.techStacks, stack],
                      });
                    } else {
                      setFormData({
                        ...formData,
                        techStacks: formData.techStacks.filter((s) => s !== stack),
                      });
                    }
                  }}
                  style={{ marginRight: '8px' }}
                />
                <span>{stack}</span>
              </label>
            ))}
          </div>
          {formData.techStacks.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {formData.techStacks.map((stack) => (
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
          {loading ? '가입 중...' : '회원가입'}
        </button>
      </form>
      <div style={{ marginTop: '15px', textAlign: 'center' }}>
        <a href="/login" style={{ color: '#0070f3' }}>로그인</a>
      </div>
    </div>
  );
}

