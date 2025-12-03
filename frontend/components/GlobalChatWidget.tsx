// 전역 채팅 위젯 컴포넌트 - 모든 페이지에서 접근 가능
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { mypageApi, projectsApi, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import ChatWidget from './ChatWidget';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function GlobalChatWidget() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const notificationSocketRef = useRef<Socket | null>(null);
  const openChatRoomsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (user && !authLoading) {
      loadMyProjects();
    }

    // 다른 컴포넌트에서 채팅창이 열렸을 때 추적
    const handleChatOpen = (event: CustomEvent) => {
      const { projectId } = event.detail;
      if (projectId) {
        openChatRoomsRef.current.add(projectId);
        // 읽지 않은 메시지 수 초기화
        setUnreadCounts(prev => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });
      }
    };

    window.addEventListener('chat-opened' as any, handleChatOpen as EventListener);

    return () => {
      if (notificationSocketRef.current) {
        notificationSocketRef.current.disconnect();
        notificationSocketRef.current = null;
      }
      window.removeEventListener('chat-opened' as any, handleChatOpen as EventListener);
    };
  }, [user, authLoading]);


  const setupNotificationSocket = async () => {
    if (!user) return;

    // 기존 소켓이 있으면 정리
    if (notificationSocketRef.current) {
      notificationSocketRef.current.disconnect();
    }

    // 프로젝트 목록 가져오기
    const [createdProjects, applications] = await Promise.all([
      mypageApi.getMyProjects().catch(() => []),
      mypageApi.getMyApplications().catch(() => []),
    ]);

    const acceptedProjects = applications
      .filter((app: any) => app.status === 'ACCEPTED')
      .map((app: any) => app.project);

    const allProjects = [
      ...(createdProjects || []),
      ...acceptedProjects,
    ];

    const uniqueProjects = Array.from(
      new Map(allProjects.map((p: any) => [p.id, p])).values()
    );

    const socket = io(API_BASE_URL, {
      transports: ['websocket'],
      auth: {
        token: getToken(),
      },
    });

    socket.on('connect', () => {
      console.log('알림 소켓 연결됨');
      // 모든 프로젝트의 채팅방에 조인 (알림 수신용)
      uniqueProjects.forEach((project: any) => {
        socket.emit('join-room', { 
          projectId: project.id,
          userId: user.id,
        });
      });
    });

    socket.on('new-message', (message: any) => {
      // 현재 열려있는 채팅창이 아니면 알림 표시
      const projectId = message.projectId;
      if (!projectId) return;

      const isCurrentChat = selectedProjectId === projectId;
      const isChatOpen = openChatRoomsRef.current.has(projectId);
      
      // window 이벤트를 통해 다른 곳에서 열린 채팅창 확인
      const chatOpenEvent = new CustomEvent('check-chat-open', { detail: { projectId } });
      window.dispatchEvent(chatOpenEvent);
      
      // 약간의 지연 후 알림 표시 (다른 컴포넌트가 채팅창을 열었을 수 있음)
      setTimeout(() => {
        if (!isCurrentChat && !openChatRoomsRef.current.has(projectId)) {
          // 읽지 않은 메시지 수 증가
          setUnreadCounts(prev => ({
            ...prev,
            [projectId]: (prev[projectId] || 0) + 1,
          }));

          // 페이지 타이틀에 알림 표시
          updatePageTitle();
        }
      }, 100);
    });

    socket.on('error', (error: any) => {
      console.error('알림 소켓 에러:', error);
    });

    notificationSocketRef.current = socket;
  };

  const loadMyProjects = async () => {
    try {
      setLoading(true);
      // 내가 생성한 프로젝트와 수락된 신청이 있는 프로젝트 가져오기
      const [createdProjects, applications] = await Promise.all([
        mypageApi.getMyProjects().catch(() => []),
        mypageApi.getMyApplications().catch(() => []),
      ]);

      // 수락된 신청만 필터링
      const acceptedProjects = applications
        .filter((app: any) => app.status === 'ACCEPTED')
        .map((app: any) => app.project);

      // 중복 제거 및 합치기
      const allProjects = [
        ...(createdProjects || []),
        ...acceptedProjects,
      ];

      // 중복 제거 (같은 프로젝트 ID)
      const uniqueProjects = Array.from(
        new Map(allProjects.map((p: any) => [p.id, p])).values()
      );

      setMyProjects(uniqueProjects);
      
      // 프로젝트 목록이 로드된 후 알림 소켓 재설정
      if (user) {
        setupNotificationSocket();
      }
    } catch (err) {
      console.error('프로젝트 목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChat = (projectId: string) => {
    setSelectedProjectId(projectId);
    setIsOpen(true);
    // 읽지 않은 메시지 수 초기화
    setUnreadCounts(prev => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    // 열린 채팅방 추적
    openChatRoomsRef.current.add(projectId);
  };

  const handleClose = () => {
    setIsOpen(false);
    if (selectedProjectId) {
      openChatRoomsRef.current.delete(selectedProjectId);
    }
    setSelectedProjectId(null);
  };

  const handleBackToList = () => {
    if (selectedProjectId) {
      openChatRoomsRef.current.delete(selectedProjectId);
    }
    setSelectedProjectId(null); // 채팅창만 닫고 목록으로 돌아가기
  };

  // 전체 읽지 않은 메시지 수 계산
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // 페이지 타이틀 업데이트
  const updatePageTitle = () => {
    const totalUnread = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 새 메시지 - Sync-Up`;
    } else {
      document.title = 'Sync-Up - 팀 매칭 플랫폼';
    }
  };

  // 읽지 않은 메시지 수가 변경될 때마다 페이지 타이틀 업데이트
  useEffect(() => {
    updatePageTitle();
  }, [unreadCounts]);

  // 로그인하지 않은 경우 버튼 숨김
  if (!user || authLoading) {
    return null;
  }

  return (
    <>
      {/* 플로팅 채팅 버튼 */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center z-[9999] group relative"
        style={{ position: 'fixed' }}
        aria-label="채팅 열기"
      >
        <svg 
          className="w-6 h-6 transition-transform group-hover:scale-110" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
          />
        </svg>
        {totalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
            {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
          </span>
        )}
      </button>

      {/* 프로젝트 선택 모달 */}
      {isOpen && !selectedProjectId && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity"
            style={{ position: 'fixed' }}
            onClick={handleClose}
          />
          <div 
            className="fixed bottom-0 right-0 w-full sm:w-96 h-[500px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl z-[9999] flex flex-col animate-slide-up"
            style={{ position: 'fixed' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">채팅방 선택</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="text-center text-gray-500 py-8">로딩 중...</div>
              ) : myProjects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">참여 중인 프로젝트가 없습니다.</div>
                  <button
                    onClick={() => {
                      handleClose();
                      router.push('/projects');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                  >
                    프로젝트 둘러보기
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {myProjects.map((project: any) => {
                    const unreadCount = unreadCounts[project.id] || 0;
                    return (
                      <button
                        key={project.id}
                        onClick={() => handleOpenChat(project.id)}
                        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">{project.title}</div>
                            <div className="text-sm text-gray-600 line-clamp-2">{project.shortDescription}</div>
                          </div>
                          {unreadCount > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 채팅 위젯 */}
      {selectedProjectId && (
        <ChatWidget 
          projectId={selectedProjectId}
          isOpen={isOpen}
          onClose={handleClose}
          onBack={handleBackToList}
          onOpen={() => {
            if (selectedProjectId) {
              openChatRoomsRef.current.add(selectedProjectId);
            }
          }}
        />
      )}
    </>
  );
}

