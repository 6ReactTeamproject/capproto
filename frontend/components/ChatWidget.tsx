// 실시간 채팅 위젯 컴포넌트
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { chatApi, getToken, projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

interface ChatWidgetProps {
  projectId?: string;
  userId?: string; // 개인 채팅용
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void; // 채팅 목록으로 돌아가기 (선택사항)
  onOpen?: () => void; // 채팅창이 열렸을 때 호출 (알림 추적용)
}

export default function ChatWidget({ projectId, userId, isOpen, onClose, onBack, onOpen }: ChatWidgetProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatTitle, setChatTitle] = useState<string>('채팅');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const initializedChatRef = useRef<string | null>(null);

  const loadChatInfo = useCallback(async () => {
    try {
      if (projectId) {
        const project = await projectsApi.getOne(projectId);
        setChatTitle(project.title || '프로젝트 채팅');
      } else if (userId) {
        // 개인 채팅의 경우 상대방 이름 표시 (나중에 API로 가져올 수 있음)
        setChatTitle('개인 채팅');
      }
    } catch (err) {
      console.error('채팅 정보 로드 실패:', err);
    }
  }, [projectId, userId]);

  const loadChatRoom = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // 기존 소켓이 있으면 정리
      if (socketRef.current) {
        socketRef.current.off('messages');
        socketRef.current.off('new-message');
        socketRef.current.off('error');
        socketRef.current.off('connect');
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      let room;
      if (projectId) {
        // 프로젝트 채팅방
        room = await chatApi.getRoom(projectId);
      } else if (userId) {
        // 개인 채팅방
        room = await chatApi.getDirectRoom(userId);
        // 상대방 정보 가져오기
        const otherUser = room.userId1 === user.id ? room.user2 : room.user1;
        if (otherUser) {
          setChatTitle(otherUser.nickname || '개인 채팅');
        }
      } else {
        throw new Error('projectId 또는 userId가 필요합니다.');
      }

      setMessages(room.messages || []);
      setLoading(false);

      // WebSocket 연결
      const newSocket = io(API_BASE_URL, {
        transports: ['websocket'],
        auth: {
          token: getToken(),
        },
      });

      newSocket.on('connect', () => {
        console.log('WebSocket 연결됨');
        newSocket.emit('join-room', { 
          projectId,
          userId: userId || undefined,
          currentUserId: user.id,
        });
      });

      newSocket.on('messages', (msgs: any[]) => {
        setMessages(msgs);
        setLoading(false);
      });

      newSocket.on('new-message', (message: any) => {
        console.log('새 메시지 수신:', message);
        setMessages((prev) => {
          // 임시 메시지가 있으면 제거하고 실제 메시지로 교체
          const filtered = prev.filter((msg) => !msg.id?.startsWith('temp-'));
          const exists = filtered.some((msg) => msg.id === message.id);
          if (exists) {
            return filtered;
          }
          return [...filtered, message];
        });
      });

      newSocket.on('error', (error: any) => {
        console.error('WebSocket 에러:', error);
        setLoading(false);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    } catch (err: any) {
      console.error('채팅방 로드 실패:', err);
      setLoading(false);
    }
  }, [projectId, userId, user]);

  useEffect(() => {
    // 채팅방이 변경되었거나 아직 초기화되지 않았을 때만 초기화
    const chatKey = projectId || userId || '';
    const needsInit = isOpen && user && initializedChatRef.current !== chatKey;
    
    if (needsInit) {
      initializedChatRef.current = chatKey;
      loadChatInfo();
      loadChatRoom();
      onOpen?.();
      if (projectId) {
        window.dispatchEvent(new CustomEvent('chat-opened', { detail: { projectId } }));
      } else if (userId) {
        window.dispatchEvent(new CustomEvent('direct-chat-opened', { detail: { userId } }));
      }
    }

    return () => {
      // 채팅창이 닫히거나 채팅방이 변경될 때만 정리
      if (!isOpen || initializedChatRef.current !== chatKey) {
        if (socketRef.current) {
          socketRef.current.off('messages');
          socketRef.current.off('new-message');
          socketRef.current.off('error');
          socketRef.current.off('connect');
          socketRef.current.disconnect();
          socketRef.current = null;
          setSocket(null);
        }
        if (!isOpen) {
          initializedChatRef.current = null;
        }
      }
    };
  }, [isOpen, user, projectId, userId, loadChatInfo, loadChatRoom, onOpen]);

  const sendMessage = () => {
    const currentSocket = socketRef.current || socket;
    if (!currentSocket || !user?.id || !newMessage.trim()) return;
    if (!projectId && !userId) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    // Optimistic update: 메시지 전송 전에 로컬 상태에 임시 메시지 추가
    const tempMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: {
        id: user.id,
        nickname: user.nickname,
      },
      createdAt: new Date().toISOString(),
      translatedContent: messageContent, // 자신의 언어이므로 번역 불필요
      sourceLang: 'ko', // 임시값, 서버에서 실제 값으로 교체됨
      targetLang: 'ko',
    };
    setMessages((prev) => [...prev, tempMessage]);

    currentSocket.emit('send-message', {
      projectId: projectId || undefined,
      userId: userId || undefined,
      senderId: user.id,
      content: messageContent,
    }, (error: any) => {
      if (error) {
        console.error('메시지 전송 실패:', error);
        // 에러 발생 시 임시 메시지 제거
        setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
      }
    });
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, scrollToBottom]);

  // 모든 hooks가 호출된 후에 조건부 return
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* 모달 오버레이 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity"
        style={{ position: 'fixed' }}
        onClick={onClose}
      />
      
      {/* 채팅 모달 */}
      <div 
        className="fixed bottom-0 right-0 w-full sm:w-96 h-[600px] sm:h-[700px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl z-[9999] flex flex-col animate-slide-up border border-gray-100"
        style={{ position: 'fixed' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 transform hover:scale-110"
                aria-label="뒤로가기"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">{chatTitle}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 transform hover:scale-110"
            aria-label="닫기"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white">
          {loading ? (
            <div className="text-center text-gray-500 py-8">로딩 중...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">메시지가 없습니다.</div>
          ) : (
            messages.map((message) => {
              const isMyMessage = message.sender?.id === user?.id;
              return (
                <div 
                  key={message.id} 
                  className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}
                >
                  <div className={`text-xs text-gray-500 mb-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                    {isMyMessage ? '나' : (message.sender?.nickname || '알 수 없음')}
                  </div>
                  <div className={`rounded-2xl p-3 shadow-md max-w-[80%] ${
                    isMyMessage 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                      : 'bg-white text-gray-900 border border-gray-100'
                  }`}>
                    <div className={`text-sm ${isMyMessage ? 'text-white' : 'text-gray-900'}`}>
                      {/* 번역된 내용이 있으면 번역본 표시, 없으면 원문 표시 */}
                      {message.translatedContent || message.content}
                    </div>
                  </div>
                  <div className={`text-xs text-gray-400 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(message.createdAt).toLocaleTimeString('ko-KR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={!socket || !newMessage.trim() || (!projectId && !userId)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed text-sm transform hover:-translate-y-0.5 disabled:transform-none"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

