// API 클라이언트 - 백엔드 API 호출 유틸리티
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

// 인증 토큰 관리
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  // 토큰 변경 이벤트 발생 (같은 탭에서 감지)
  window.dispatchEvent(new Event('token-changed'));
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
};

// API 요청 헬퍼
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '알 수 없는 오류가 발생했습니다.' }));
    throw new Error(error.message || '요청 실패');
  }

  return response.json();
}

// 인증 API
export const authApi = {
  register: async (data: { email: string; password: string; nickname: string; role: string }) => {
    return fetchApi<{ user: any; accessToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  login: async (data: { email: string; password: string }) => {
    return fetchApi<{ user: any; accessToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getMe: async () => {
    return fetchApi<any>('/auth/me');
  },
};

// 프로젝트 API
export const projectsApi = {
  getAll: async (page = 1, limit = 10) => {
    return fetchApi<any>(`/projects?page=${page}&limit=${limit}`);
  },
  getOne: async (id: string) => {
    return fetchApi<any>(`/projects/${id}`);
  },
  create: async (data: {
    title: string;
    shortDescription: string;
    neededRoles: string[];
    requiredStacks: string[];
    startDate?: string;
    endDate?: string;
  }) => {
    return fetchApi<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getRecommendations: async (id: string) => {
    return fetchApi<any[]>(`/projects/${id}/recommendations`);
  },
  closeRecruitment: async (id: string) => {
    return fetchApi<any>(`/projects/${id}/close-recruitment`, {
      method: 'PUT',
    });
  },
  delete: async (id: string) => {
    return fetchApi<any>(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// 참여 신청 API
export const applicationsApi = {
  create: async (projectId: string, message?: string) => {
    return fetchApi<any>(`/projects/${projectId}/applications`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  invite: async (projectId: string, userId: string, message?: string) => {
    return fetchApi<any>(`/projects/${projectId}/applications/invite/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  },
  getByProject: async (projectId: string) => {
    return fetchApi<any[]>(`/projects/${projectId}/applications`);
  },
  accept: async (applicationId: string) => {
    return fetchApi<any>(`/applications/${applicationId}/accept`, {
      method: 'PUT',
    });
  },
  reject: async (applicationId: string) => {
    return fetchApi<any>(`/applications/${applicationId}/reject`, {
      method: 'PUT',
    });
  },
};

// 채팅 API
export const chatApi = {
  getRoom: async (projectId: string) => {
    return fetchApi<any>(`/chat/rooms/project/${projectId}`);
  },
  getDirectRoom: async (userId: string) => {
    return fetchApi<any>(`/chat/rooms/direct/${userId}`);
  },
  getDirectRooms: async () => {
    return fetchApi<any[]>(`/chat/rooms/direct`);
  },
  getMessages: async (roomId: string) => {
    return fetchApi<any[]>(`/chat/messages/${roomId}`);
  },
};

// 릴리즈 API
export const releasesApi = {
  getAll: async () => {
    return fetchApi<Record<string, any[]>>('/releases');
  },
  getByLanguage: async (language: string) => {
    return fetchApi<any[]>(`/releases/${language}`);
  },
  sync: async (language: string) => {
    return fetchApi<any>(`/releases/${language}/sync`, {
      method: 'POST',
    });
  },
};

// 마이페이지 API
export const mypageApi = {
  getMyPageInfo: async () => {
    return fetchApi<any>('/users/me/mypage');
  },
  getMyProjects: async () => {
    return fetchApi<any[]>('/users/me/projects');
  },
  getMyApplications: async () => {
    return fetchApi<any[]>('/users/me/applications');
  },
};

// 유저 API
export const usersApi = {
  getOne: async (id: string) => {
    return fetchApi<any>(`/users/${id}`);
  },
  getProjects: async (id: string) => {
    return fetchApi<any[]>(`/users/${id}/projects`);
  },
};

