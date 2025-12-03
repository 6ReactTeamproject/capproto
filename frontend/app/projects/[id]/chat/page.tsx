// 실시간 채팅 페이지 - WebSocket 연결
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { chatApi, getToken, projectsApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('ko');
  const [targetLang, setTargetLang] = useState('en');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading) {
      checkAccess();
    }

    return () => {
      if (socket) {
        socket.off('messages');
        socket.off('new-message');
        socket.off('error');
        socket.off('connect');
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [projectId, authLoading, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // 로그인 체크
      if (!user) {
        setError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      // 프로젝트 정보 가져오기
      const project = await projectsApi.getOne(projectId);
      
      // 프로젝트 생성자이거나 수락된 신청이 있는지 확인
      const isCreator = project.creator?.id === user.id;
      const hasAcceptedApplication = project.isAccepted || false;

      if (!isCreator && !hasAcceptedApplication) {
        setError('프로젝트 참여자만 채팅방에 접근할 수 있습니다.');
        setLoading(false);
        return;
      }

      setHasAccess(true);
      await loadChatRoom();
    } catch (err: any) {
      console.error('접근 권한 확인 실패:', err);
      setError(err.message || '채팅방에 접근할 수 없습니다.');
      setLoading(false);
    }
  };

  const loadChatRoom = async () => {
    try {
      // 기존 소켓이 있으면 정리
      if (socket) {
        socket.off('messages');
        socket.off('new-message');
        socket.off('error');
        socket.off('connect');
        socket.disconnect();
      }

      const room = await chatApi.getRoom(projectId);
      setRoomId(room.id);
      setMessages(room.messages || []);

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
          userId: user?.id,
        });
      });

      newSocket.on('messages', (msgs: any[]) => {
        setMessages(msgs);
        setLoading(false);
      });

      newSocket.on('new-message', (message: any) => {
        setMessages((prev) => {
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) {
            return prev;
          }
          return [...prev, message];
        });
      });

      newSocket.on('error', (error: any) => {
        console.error('WebSocket 에러:', error);
        setError(error.message || '채팅방 접근 권한이 없습니다.');
        setLoading(false);
      });

      setSocket(newSocket);
    } catch (err: any) {
      console.error('채팅방 로드 실패:', err);
      setError(err.message || '채팅방을 불러올 수 없습니다.');
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!socket || !projectId || !user?.id || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage('');

    socket.emit('send-message', {
      projectId,
      senderId: user.id,
      content: messageContent,
      sourceLang,
      targetLang,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">로딩 중...</div>
      </div>
    );
  }

  if (error || !hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-8 text-center">
          <div className="text-red-600 font-semibold mb-4">{error || '접근 권한이 없습니다.'}</div>
          <div className="space-y-3">
            {!user && (
              <Link
                href={`/login?redirect=/projects/${projectId}/chat`}
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md"
              >
                로그인하기
              </Link>
            )}
            <Link
              href={`/projects/${projectId}`}
              className="inline-block px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-medium transition-colors"
            >
              프로젝트로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <Link 
            href={`/projects/${projectId}`} 
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            ← 프로젝트로 돌아가기
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">채팅방</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex-1 overflow-y-auto max-h-96 mb-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">메시지가 없습니다.</div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="border-b border-gray-100 pb-4 last:border-0">
                  <div className="font-semibold text-gray-900 mb-2">
                    {message.sender?.nickname || '알 수 없음'}
                  </div>
                  <div className="mb-2 p-3 bg-gray-50 rounded-xl text-gray-900">
                    {message.content}
                  </div>
                  {message.translatedContent && (
                    <div className="mb-2 p-3 bg-blue-50 rounded-xl text-gray-700 text-sm">
                      {message.translatedContent}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(message.createdAt).toLocaleString('ko-KR')}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-3 mb-4">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
            <span className="flex items-center text-gray-500">→</span>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>

          <div className="flex gap-3">
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
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={sendMessage}
              disabled={!socket || !newMessage.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors shadow-sm hover:shadow-md disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
