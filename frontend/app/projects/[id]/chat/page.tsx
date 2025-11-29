// 실시간 채팅 페이지 - WebSocket 연결
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { chatApi, getToken } from '@/lib/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [sourceLang, setSourceLang] = useState('ko');
  const [targetLang, setTargetLang] = useState('en');
  const [userId, setUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 사용자 정보 가져오기 (간단하게 토큰에서 추출하거나 별도 API 호출)
    loadChatRoom();

    return () => {
      if (socket) {
        socket.off('messages');
        socket.off('new-message');
        socket.off('connect');
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatRoom = async () => {
    try {
      // 기존 소켓이 있으면 정리
      if (socket) {
        socket.off('messages');
        socket.off('new-message');
        socket.off('connect');
        socket.disconnect();
      }

      const room = await chatApi.getRoom(projectId);
      setRoomId(room.id);
      setMessages(room.messages || []);

      // WebSocket 연결
      const newSocket = io(API_BASE_URL, {
        transports: ['websocket'],
      });

      newSocket.on('connect', () => {
        console.log('WebSocket 연결됨');
        newSocket.emit('join-room', { projectId });
      });

      newSocket.on('messages', (msgs: any[]) => {
        setMessages(msgs);
      });

      newSocket.on('new-message', (message: any) => {
        setMessages((prev) => {
          // 중복 메시지 체크 (같은 ID가 이미 있으면 추가하지 않음)
          const exists = prev.some((msg) => msg.id === message.id);
          if (exists) {
            return prev;
          }
          return [...prev, message];
        });
      });

      setSocket(newSocket);

      // 간단하게 사용자 ID 가져오기 (실제로는 auth API에서 가져와야 함)
      // 여기서는 임시로 localStorage에서 가져오거나 API 호출
      fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      })
        .then((res) => res.json())
        .then((user) => {
          if (user.id) {
            setUserId(user.id);
          }
        })
        .catch(() => {
          // 로그인하지 않은 경우 처리
        });
    } catch (err) {
      console.error('채팅방 로드 실패:', err);
    }
  };

  const sendMessage = () => {
    if (!socket || !projectId || !userId || !newMessage.trim()) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // 먼저 입력창 비우기

    socket.emit('send-message', {
      projectId,
      senderId: userId,
      content: messageContent,
      sourceLang,
      targetLang,
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => router.push(`/projects/${projectId}`)} style={{ color: '#0070f3' }}>
          ← 프로젝트로 돌아가기
        </button>
        <h1 style={{ marginTop: '10px' }}>채팅방</h1>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #ccc', borderRadius: '8px', padding: '15px', marginBottom: '15px', backgroundColor: '#f9f9f9' }}>
        {messages.map((message) => (
          <div key={message.id} style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{message.sender?.nickname || '알 수 없음'}</div>
            <div style={{ marginBottom: '5px', padding: '8px', backgroundColor: 'white', borderRadius: '4px' }}>
              {message.content}
            </div>
            {message.translatedContent && (
              <div style={{ padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', color: '#666', fontSize: '0.9em' }}>
                {message.translatedContent}
              </div>
            )}
            <div style={{ fontSize: '0.8em', color: '#999', marginTop: '5px' }}>
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        <select
          value={sourceLang}
          onChange={(e) => setSourceLang(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
        <span>→</span>
        <select
          value={targetLang}
          onChange={(e) => setTargetLang(e.target.value)}
          style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
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
          style={{ flex: 1, padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}
        />
        <button
          onClick={sendMessage}
          disabled={!socket || !newMessage.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !socket || !newMessage.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          전송
        </button>
      </div>
    </div>
  );
}

