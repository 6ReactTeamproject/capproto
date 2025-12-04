// 전역 채팅 위젯 컴포넌트 - 모든 페이지에서 접근 가능
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { mypageApi, projectsApi, chatApi, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import ChatWidget from "./ChatWidget";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

type ChatType = "project" | "direct";

export default function GlobalChatWidget() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [chatType, setChatType] = useState<ChatType>("project");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [myProjects, setMyProjects] = useState<any[]>([]);
  const [directChats, setDirectChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const notificationSocketRef = useRef<Socket | null>(null);
  const openChatRoomsRef = useRef<Set<string>>(new Set());
  const processedMessageIdsRef = useRef<Set<string>>(new Set());
  const selectedProjectIdRef = useRef<string | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;

    // 프로젝트 목록 로드
    const loadMyProjects = async () => {
      try {
        setLoading(true);
        const [createdProjects, applications] = await Promise.all([
          mypageApi.getMyProjects().catch(() => []),
          mypageApi.getMyApplications().catch(() => []),
        ]);

        const acceptedProjects = applications
          .filter((app: any) => app.status === "ACCEPTED")
          .map((app: any) => app.project);

        const allProjects = [...(createdProjects || []), ...acceptedProjects];

        const uniqueProjects = Array.from(
          new Map(allProjects.map((p: any) => [p.id, p])).values()
        );

        setMyProjects(uniqueProjects);
      } catch (err) {
        console.error("프로젝트 목록 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    // 개인 채팅 목록 로드
    const loadDirectChats = async () => {
      try {
        const chats = await chatApi.getDirectRooms();
        setDirectChats(chats);
      } catch (err) {
        console.error("개인 채팅 목록 로드 실패:", err);
      }
    };

    loadMyProjects();
    loadDirectChats();

    // 다른 컴포넌트에서 채팅창이 열렸을 때 추적
    const handleChatOpen = (event: CustomEvent) => {
      const { projectId } = event.detail;
      if (projectId) {
        openChatRoomsRef.current.add(projectId);
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[projectId];
          return next;
        });
        processedMessageIdsRef.current.clear();
      }
    };

    const handleDirectChat = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (userId) {
        setChatType("direct");
        setSelectedUserId(userId);
        selectedUserIdRef.current = userId;
        setIsOpen(true);
        // 개인 채팅방 알림 초기화
        const chatKey = `direct-${userId}`;
        openChatRoomsRef.current.add(chatKey);
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[chatKey];
          return next;
        });
        processedMessageIdsRef.current.clear();
      }
    };

    const handleDirectChatOpen = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (userId) {
        const chatKey = `direct-${userId}`;
        openChatRoomsRef.current.add(chatKey);
        setUnreadCounts((prev) => {
          const next = { ...prev };
          delete next[chatKey];
          return next;
        });
        processedMessageIdsRef.current.clear();
      }
    };

    window.addEventListener(
      "chat-opened" as any,
      handleChatOpen as EventListener
    );
    window.addEventListener(
      "open-direct-chat" as any,
      handleDirectChat as EventListener
    );
    window.addEventListener(
      "direct-chat-opened" as any,
      handleDirectChatOpen as EventListener
    );

    return () => {
      if (notificationSocketRef.current) {
        notificationSocketRef.current.disconnect();
        notificationSocketRef.current = null;
      }
      window.removeEventListener(
        "chat-opened" as any,
        handleChatOpen as EventListener
      );
      window.removeEventListener(
        "open-direct-chat" as any,
        handleDirectChat as EventListener
      );
      window.removeEventListener(
        "direct-chat-opened" as any,
        handleDirectChatOpen as EventListener
      );
    };
  }, [user, authLoading]);

  // 프로젝트 목록이 변경될 때마다 알림 소켓 재설정
  const projectIds = useMemo(() => {
    return myProjects
      .map((p: any) => p.id)
      .sort()
      .join(",");
  }, [myProjects]);

  // 개인 채팅방 목록이 변경될 때마다 알림 소켓 재설정
  const directChatUserIds = useMemo(() => {
    return directChats
      .map((chat: any) => chat.otherUser?.id)
      .filter(Boolean)
      .sort()
      .join(",");
  }, [directChats]);

  useEffect(() => {
    if (!user || (myProjects.length === 0 && directChats.length === 0)) return;

    // 기존 소켓이 있으면 정리
    if (notificationSocketRef.current) {
      notificationSocketRef.current.disconnect();
    }

    const socket = io(API_BASE_URL, {
      transports: ["websocket"],
      auth: {
        token: getToken(),
      },
    });

    socket.on("connect", () => {
      console.log("알림 소켓 연결됨");
      // 프로젝트 채팅방 입장
      myProjects.forEach((project: any) => {
        socket.emit("join-room", {
          projectId: project.id,
          currentUserId: user.id,
        });
      });
      // 개인 채팅방 입장
      directChats.forEach((chat: any) => {
        if (chat.otherUser?.id) {
          socket.emit("join-room", {
            userId: chat.otherUser.id,
            currentUserId: user.id,
          });
        }
      });
    });

    socket.on("new-message", (message: any) => {
      if (message.sender?.id === user.id) {
        return;
      }

      if (message.id && processedMessageIdsRef.current.has(message.id)) {
        return;
      }

      const projectId = message.projectId;
      const userId = message.userId;

      // 프로젝트 채팅 메시지 처리
      if (projectId) {
        const isCurrentChat = selectedProjectIdRef.current === projectId;
        const isChatOpen = openChatRoomsRef.current.has(projectId);

        const chatOpenEvent = new CustomEvent("check-chat-open", {
          detail: { projectId },
        });
        window.dispatchEvent(chatOpenEvent);

        setTimeout(() => {
          if (!isCurrentChat && !openChatRoomsRef.current.has(projectId)) {
            if (message.id) {
              processedMessageIdsRef.current.add(message.id);
            }

            setUnreadCounts((prev) => ({
              ...prev,
              [projectId]: (prev[projectId] || 0) + 1,
            }));
          }
        }, 100);
      }
      // 개인 채팅 메시지 처리
      else if (userId && message.sender?.id) {
        // 개인 채팅의 경우, 상대방 ID를 사용 (메시지를 보낸 사람의 ID)
        const otherUserId = message.sender.id;
        // userId는 채팅방의 상대방 ID이므로, 메시지를 보낸 사람이 상대방인지 확인
        // 만약 userId가 현재 사용자와 다르면, 그 userId를 사용
        const chatUserId = otherUserId === user.id ? userId : otherUserId;
        const isCurrentChat = selectedUserIdRef.current === chatUserId;
        const chatKey = `direct-${chatUserId}`;
        const isChatOpen = openChatRoomsRef.current.has(chatKey);

        // 개인 채팅 목록 업데이트 (최신 메시지 반영)
        setDirectChats((prev) => {
          const existingChat = prev.find(
            (chat: any) => chat.otherUser?.id === chatUserId
          );

          if (existingChat) {
            // 기존 채팅방 업데이트
            const updatedChats = prev.map((chat: any) => {
              if (chat.otherUser?.id === chatUserId) {
                return {
                  ...chat,
                  lastMessage: {
                    content: message.content,
                    createdAt: message.createdAt,
                  },
                  updatedAt: message.createdAt,
                };
              }
              return chat;
            });
            // updatedAt 기준으로 정렬 (최신 메시지가 있는 채팅방이 위로)
            return updatedChats.sort((a: any, b: any) => {
              const aTime = new Date(a.updatedAt || 0).getTime();
              const bTime = new Date(b.updatedAt || 0).getTime();
              return bTime - aTime;
            });
          } else {
            // 새로운 채팅방인 경우 목록 새로고침
            chatApi
              .getDirectRooms()
              .then((chats) => {
                setDirectChats(chats);
              })
              .catch((err) => {
                console.error("개인 채팅 목록 새로고침 실패:", err);
              });
            return prev;
          }
        });

        // 개인 채팅 메시지 알림 처리
        if (!isCurrentChat && !isChatOpen) {
          if (message.id) {
            processedMessageIdsRef.current.add(message.id);
          }

          setUnreadCounts((prev) => ({
            ...prev,
            [chatKey]: (prev[chatKey] || 0) + 1,
          }));
        }
      }
    });

    socket.on("error", (error: any) => {
      console.error("알림 소켓 에러:", error);
    });

    notificationSocketRef.current = socket;

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, projectIds, directChatUserIds]);

  // 전체 읽지 않은 메시지 수 계산
  const totalUnreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  }, [unreadCounts]);

  // 읽지 않은 메시지 수가 변경될 때마다 페이지 타이틀 업데이트
  useEffect(() => {
    const totalUnread = Object.values(unreadCounts).reduce(
      (sum, count) => sum + count,
      0
    );
    if (totalUnread > 0) {
      document.title = `(${totalUnread}) 새 메시지 - Sync-Up`;
    } else {
      document.title = "Sync-Up - 팀 매칭 플랫폼";
    }
  }, [unreadCounts]);

  const handleOpenChat = (projectId: string) => {
    setChatType("project");
    setSelectedProjectId(projectId);
    selectedProjectIdRef.current = projectId;
    setSelectedUserId(null);
    setIsOpen(true);
    // 읽지 않은 메시지 수 초기화
    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[projectId];
      return next;
    });
    // 열린 채팅방 추적
    openChatRoomsRef.current.add(projectId);
    // 처리된 메시지 ID 목록 초기화 (채팅창을 열면 모든 메시지를 읽은 것으로 간주)
    processedMessageIdsRef.current.clear();
  };

  const handleOpenDirectChat = async (userId: string) => {
    setChatType("direct");
    setSelectedUserId(userId);
    selectedUserIdRef.current = userId;
    setSelectedProjectId(null);
    selectedProjectIdRef.current = null;
    setIsOpen(true);
    // 읽지 않은 메시지 수 초기화
    const chatKey = `direct-${userId}`;
    setUnreadCounts((prev) => {
      const next = { ...prev };
      delete next[chatKey];
      return next;
    });
    // 열린 채팅방 추적
    openChatRoomsRef.current.add(chatKey);
    // 처리된 메시지 ID 목록 초기화
    processedMessageIdsRef.current.clear();
    // 개인 채팅 목록 새로고침
    try {
      const chats = await chatApi.getDirectRooms();
      setDirectChats(chats);
    } catch (err) {
      console.error("개인 채팅 목록 로드 실패:", err);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (selectedProjectId) {
      openChatRoomsRef.current.delete(selectedProjectId);
    }
    if (selectedUserId) {
      openChatRoomsRef.current.delete(`direct-${selectedUserId}`);
    }
    setSelectedProjectId(null);
    selectedProjectIdRef.current = null;
    setSelectedUserId(null);
    selectedUserIdRef.current = null;
  };

  const handleBackToList = () => {
    if (selectedProjectId) {
      openChatRoomsRef.current.delete(selectedProjectId);
    }
    if (selectedUserId) {
      openChatRoomsRef.current.delete(`direct-${selectedUserId}`);
    }
    setSelectedProjectId(null);
    selectedProjectIdRef.current = null;
    setSelectedUserId(null);
    selectedUserIdRef.current = null; // 채팅창만 닫고 목록으로 돌아가기
  };

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
        style={{ position: "fixed" }}
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
            {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
          </span>
        )}
      </button>

      {/* 채팅방 선택 모달 */}
      {isOpen && !selectedProjectId && !selectedUserId && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9998] transition-opacity"
            style={{ position: "fixed" }}
            onClick={handleClose}
          />
          <div
            className="fixed bottom-0 right-0 w-full sm:w-96 h-[500px] bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl z-[9999] flex flex-col animate-slide-up"
            style={{ position: "fixed" }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900">채팅방 선택</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 탭 메뉴 */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                onClick={() => setChatType("project")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  chatType === "project"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                프로젝트 채팅
              </button>
              <button
                onClick={() => setChatType("direct")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  chatType === "direct"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                개인 채팅
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {chatType === "project" ? (
                loading ? (
                  <div className="text-center text-gray-500 py-8">
                    로딩 중...
                  </div>
                ) : myProjects.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 mb-4">
                      참여 중인 프로젝트가 없습니다.
                    </div>
                    <button
                      onClick={() => {
                        handleClose();
                        router.push("/projects");
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
                              <div className="font-semibold text-gray-900 mb-1">
                                {project.title}
                              </div>
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {project.shortDescription}
                              </div>
                            </div>
                            {unreadCount > 0 && (
                              <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              ) : loading ? (
                <div className="text-center text-gray-500 py-8">로딩 중...</div>
              ) : directChats.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    개인 채팅방이 없습니다.
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {directChats.map((chat: any) => {
                    if (!chat.otherUser?.id) return null;
                    const chatKey = `direct-${chat.otherUser.id}`;
                    const unreadCount = unreadCounts[chatKey] || 0;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => handleOpenDirectChat(chat.otherUser.id)}
                        className="w-full text-left p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:shadow-md transition-all relative"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 mb-1">
                              {chat.otherUser.nickname}
                            </div>
                            {chat.lastMessage && (
                              <div className="text-sm text-gray-600 line-clamp-1">
                                {chat.lastMessage.content}
                              </div>
                            )}
                          </div>
                          {unreadCount > 0 && (
                            <span className="flex-shrink-0 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                              {unreadCount > 9 ? "9+" : unreadCount}
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

      {/* 채팅 위젯 - 항상 렌더링하여 hooks 순서 일관성 유지 */}
      <ChatWidget
        projectId={selectedProjectId || undefined}
        userId={selectedUserId || undefined}
        isOpen={isOpen && !!(selectedProjectId || selectedUserId)}
        onClose={handleClose}
        onBack={handleBackToList}
        onOpen={() => {
          if (selectedProjectId) {
            openChatRoomsRef.current.add(selectedProjectId);
            // 프로젝트 채팅방 알림 초기화
            setUnreadCounts((prev) => {
              const next = { ...prev };
              delete next[selectedProjectId];
              return next;
            });
          }
          if (selectedUserId) {
            const chatKey = `direct-${selectedUserId}`;
            openChatRoomsRef.current.add(chatKey);
            // 개인 채팅방 알림 초기화
            setUnreadCounts((prev) => {
              const next = { ...prev };
              delete next[chatKey];
              return next;
            });
          }
          processedMessageIdsRef.current.clear();
        }}
      />
    </>
  );
}
