// 릴리즈 정보 페이지 - 언어별 최신 릴리즈 정보
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { releasesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const LANGUAGES = [
  'TypeScript',
  'Node.js',
  'React',
  'Next.js',
  'NestJS',
  'Python',
  'Java',
];

export default function ReleasesPage() {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState('TypeScript');
  const [releases, setReleases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReleases();
  }, [selectedLanguage]);

  const loadReleases = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await releasesApi.getByLanguage(selectedLanguage);
      console.log(`${selectedLanguage} 릴리즈 정보:`, data);
      setReleases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('릴리즈 정보 로드 실패:', err);
      setError(err.message || '릴리즈 정보를 불러오는데 실패했습니다.');
      setReleases([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/projects" style={{ color: '#0070f3' }}>← 프로젝트 목록</Link>
      </div>

      <h1 style={{ marginBottom: '20px' }}>언어별 최신 릴리즈 정보</h1>

      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label style={{ fontWeight: 'bold' }}>언어 선택:</label>
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          style={{
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            minWidth: '200px',
          }}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {lang}
            </option>
          ))}
        </select>
        <button
          onClick={loadReleases}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: loading ? '#ccc' : '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
          }}
        >
          {loading ? '로딩 중...' : '새로고침'}
        </button>
        {user && (
          <button
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                await releasesApi.sync(selectedLanguage);
                await loadReleases();
              } catch (err: any) {
                setError(err.message || '동기화에 실패했습니다. GitHub API rate limit에 걸렸을 수 있습니다.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
            style={{
              padding: '8px 16px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? '동기화 중...' : '수동 동기화'}
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            padding: '15px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            color: '#856404',
            marginBottom: '20px',
          }}
        >
          <strong>알림:</strong> {error}
          {error.includes('rate limit') && (
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              GitHub API 호출 제한에 걸렸습니다. 약 35분 후 다시 시도하거나, 로그인 후 "수동 동기화" 버튼을 사용해주세요.
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>로딩 중...</div>
      ) : releases.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          {error ? (
            <div>
              릴리즈 정보를 불러올 수 없습니다.
              <br />
              <button
                onClick={loadReleases}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#0070f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                다시 시도
              </button>
            </div>
          ) : (
            '릴리즈 정보가 없습니다.'
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {releases.map((release) => (
            <div
              key={release.id}
              style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h2 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>
                    {release.language} {release.version}
                  </h2>
                  <div style={{ color: '#666', fontSize: '14px' }}>
                    릴리즈 날짜: {new Date(release.releaseDate).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <a
                  href={release.officialDocs}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    borderRadius: '4px',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  공식 문서 보기 →
                </a>
              </div>

              {/* 공식 문서 핵심 내용 */}
              <div
                style={{
                  backgroundColor: '#f9f9f9',
                  padding: '15px',
                  borderRadius: '4px',
                  marginBottom: '15px',
                  border: '1px solid #e0e0e0',
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>
                  공식 문서 내용
                </h3>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    color: '#555',
                    fontSize: '14px',
                  }}
                >
                  {release.officialContent}
                </div>
              </div>

              {/* 간략 정리 */}
              <div
                style={{
                  padding: '15px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  border: '1px solid #bbdefb',
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#1976d2' }}>
                  간략 정리
                </h3>
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: '1.6',
                    color: '#424242',
                    fontSize: '14px',
                  }}
                >
                  {release.summary}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

