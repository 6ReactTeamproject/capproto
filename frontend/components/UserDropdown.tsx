// 사용자 이름 클릭 시 드롭다운 메뉴 컴포넌트
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { chatApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface UserDropdownProps {
  userId: string;
  nickname: string;
  onDirectChat?: (userId: string) => void;
}

export default function UserDropdown({ userId, nickname, onDirectChat }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // 자기 자신은 드롭다운 표시 안 함 - 모든 hooks 호출 후에 조건부 return
  if (user?.id === userId) {
    return (
      <Link
        href={`/users/${userId}`}
        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        {nickname}
      </Link>
    );
  }

  const handleDirectChat = async () => {
    setIsOpen(false);
    if (onDirectChat) {
      onDirectChat(userId);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
      >
        {nickname}
      </button>
      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
          <Link
            href={`/users/${userId}`}
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            마이페이지로 가기
          </Link>
          <button
            onClick={handleDirectChat}
            className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            1대1 채팅 보내기
          </button>
        </div>
      )}
    </div>
  );
}

