// 릴리즈 정보 페이지 - 언어별 최신 릴리즈 정보
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { releasesApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n/context';

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
  const { t, language } = useI18n();
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
      console.log(`${selectedLanguage} ${t('releases.title')}:`, data);
      setReleases(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error(`${t('releases.title')} 로드 실패:`, err);
      setError(err.message || t('releases.loadError'));
      setReleases([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/projects" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold mb-6 transition-colors group"
        >
          <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('releases.backToProjects')}
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">{t('releases.languageReleases')}</h1>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="font-semibold text-gray-700 min-w-[100px]">{t('releases.selectLanguage')}</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
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
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? t('releases.loading') : t('releases.refresh')}
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
                    setError(err.message || t('releases.syncError'));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {loading ? t('releases.syncing') : t('releases.sync')}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-6">
            <div className="text-yellow-800 font-semibold mb-2">{t('releases.error')} {error}</div>
            {error.includes('rate limit') && (
              <div className="text-sm text-yellow-700">
                {t('releases.rateLimitMessage')}
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <div className="text-gray-500 text-lg">{t('releases.loading')}</div>
          </div>
        ) : releases.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-600 border border-gray-100">
            {error ? (
              <div>
                <div className="mb-4">{t('releases.loadError')}</div>
                <button
                  onClick={loadReleases}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {t('releases.retry')}
                </button>
              </div>
            ) : (
              t('releases.noReleases')
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {releases.map((release) => (
              <div
                key={release.id}
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {release.language} {release.version}
                    </h2>
                    <div className="text-gray-600 text-sm">
                      {t('releases.releaseDate')} {new Date(release.releaseDate).toLocaleDateString(
                        language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US'
                      )}
                    </div>
                  </div>
                  <a
                    href={release.officialDocs}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {t('releases.officialDocs')}
                  </a>
                </div>

                {/* 공식 문서 핵심 내용 */}
                <div className="bg-gray-50 rounded-xl p-6 mb-4 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('releases.officialContent')}</h3>
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                    {release.officialContent}
                  </div>
                </div>

                {/* 간략 정리 */}
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-blue-900 mb-4">{t('releases.summary')}</h3>
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {release.summary}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
