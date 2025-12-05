// 헤더 컴포넌트
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';
import { useI18n } from '@/lib/i18n/context';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const { t } = useI18n();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2 group" onClick={closeMobileMenu}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200 transform group-hover:scale-105">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sync-Up
            </span>
          </Link>

          {/* 데스크톱 네비게이션 */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className={`font-medium transition-colors ${
                pathname === '/'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('header.home')}
            </Link>
            <Link
              href="/projects"
              className={`font-medium transition-colors ${
                pathname?.startsWith('/projects') && pathname !== '/projects/new'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('header.projects')}
            </Link>
            {user && (
              <Link
                href="/mypage"
                className={`font-medium transition-colors ${
                  pathname === '/mypage'
                    ? 'text-blue-600'
                    : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                {t('header.mypage')}
              </Link>
            )}
            <Link
              href="/releases"
              className={`font-medium transition-colors ${
                pathname === '/releases'
                  ? 'text-blue-600'
                  : 'text-gray-700 hover:text-blue-600'
              }`}
            >
              {t('header.releases')}
            </Link>
          </nav>

          {/* 데스크톱 사용자 메뉴 */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600 font-medium">
                  {user.nickname}님
                </span>
                <Link
                  href="/projects/new"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {t('header.createProject')}
                </Link>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all duration-200"
                >
                  {t('header.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-semibold text-sm transition-colors"
                >
                  {t('header.login')}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {t('header.register')}
                </Link>
              </>
            )}
          </div>

          {/* 모바일 햄버거 버튼 */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="메뉴 열기"
          >
            {isMobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top duration-200">
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  pathname === '/'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {t('header.home')}
              </Link>
              <Link
                href="/projects"
                onClick={closeMobileMenu}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  pathname?.startsWith('/projects') && pathname !== '/projects/new'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {t('header.projects')}
              </Link>
              {user && (
                <Link
                  href="/mypage"
                  onClick={closeMobileMenu}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    pathname === '/mypage'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {t('header.mypage')}
                </Link>
              )}
              <Link
                href="/releases"
                onClick={closeMobileMenu}
                className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                  pathname === '/releases'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {t('header.releases')}
              </Link>
              
              {/* 모바일 사용자 메뉴 */}
              <div className="border-t border-gray-200 pt-4 mt-2">
                {user ? (
                  <>
                    <div className="px-4 py-2 text-sm text-gray-600 font-medium mb-3">
                      {user.nickname}님
                    </div>
                    <Link
                      href="/projects/new"
                      onClick={closeMobileMenu}
                      className="block w-full px-4 py-2 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm text-center transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {t('header.createProject')}
                    </Link>
                    <button
                      onClick={() => {
                        closeMobileMenu();
                        logout();
                      }}
                      className="block w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold text-sm transition-all duration-200"
                    >
                      {t('header.logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="block w-full px-4 py-2 mb-2 text-gray-700 hover:text-blue-600 font-semibold text-sm text-center transition-colors"
                    >
                      {t('header.login')}
                    </Link>
                    <Link
                      href="/register"
                      onClick={closeMobileMenu}
                      className="block w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-sm text-center transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {t('header.register')}
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

