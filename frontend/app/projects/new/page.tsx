// 프로젝트 생성 페이지
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { getToken } from '@/lib/api';

export default function NewProjectPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    shortDescription: '',
    neededRoles: [] as string[],
    requiredStacks: [] as string[],
  });
  const [roleInput, setRoleInput] = useState('');
  const [stackInput, setStackInput] = useState('');
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

  const addRole = () => {
    if (roleInput.trim()) {
      setFormData({
        ...formData,
        neededRoles: [...formData.neededRoles, roleInput.trim()],
      });
      setRoleInput('');
    }
  };

  const removeRole = (index: number) => {
    setFormData({
      ...formData,
      neededRoles: formData.neededRoles.filter((_, i) => i !== index),
    });
  };

  const addStack = () => {
    if (stackInput.trim()) {
      setFormData({
        ...formData,
        requiredStacks: [...formData.requiredStacks, stackInput.trim()],
      });
      setStackInput('');
    }
  };

  const removeStack = (index: number) => {
    setFormData({
      ...formData,
      requiredStacks: formData.requiredStacks.filter((_, i) => i !== index),
    });
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
          <label style={{ display: 'block', marginBottom: '5px' }}>필요 역할</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addRole();
                }
              }}
              placeholder="예: DEVELOPER"
              style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button type="button" onClick={addRole} style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px' }}>
              추가
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {formData.neededRoles.map((role, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {role}
                <button type="button" onClick={() => removeRole(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>필요 스택</label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addStack();
                }
              }}
              placeholder="예: React"
              style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button type="button" onClick={addStack} style={{ padding: '8px 16px', backgroundColor: '#0070f3', color: 'white', borderRadius: '4px' }}>
              추가
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {formData.requiredStacks.map((stack, index) => (
              <span
                key={index}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {stack}
                <button type="button" onClick={() => removeStack(index)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  ×
                </button>
              </span>
            ))}
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

