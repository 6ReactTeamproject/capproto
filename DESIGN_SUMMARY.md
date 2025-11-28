# Sync-Up 프로토타입 설계 요약 (Docker 환경)

## 1. 전체 디렉터리 구조

```
procap/
├── backend/                    # NestJS 백엔드
│   ├── src/
│   │   ├── auth/              # 인증 모듈
│   │   ├── users/             # 사용자 관리
│   │   ├── projects/           # 프로젝트 관리
│   │   ├── applications/      # 참여 신청
│   │   ├── chat/              # 실시간 채팅
│   │   ├── common/            # 공통 모듈
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # Next.js 프론트엔드
│   ├── app/                   # App Router
│   │   ├── (auth)/
│   │   ├── projects/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml          # Docker Compose 설정
├── .env.example                # 루트 환경변수 예시
└── README.md                   # 실행 가이드
```

## 2. 핵심 엔티티/테이블 정의

### User (사용자)

- `id`: UUID (PK)
- `email`: String (Unique)
- `passwordHash`: String
- `nickname`: String (Unique)
- `role`: Enum (DEVELOPER, DESIGNER, PLANNER)
- `techStacks`: String (JSON 배열 문자열)
- `createdAt`, `updatedAt`: DateTime

### Project (프로젝트)

- `id`: UUID (PK)
- `title`: String
- `shortDescription`: String
- `neededRoles`: String (JSON 배열 문자열)
- `requiredStacks`: String (JSON 배열 문자열)
- `creatorId`: UUID (FK → User)
- `createdAt`, `updatedAt`: DateTime

### ProjectApplication (참여 신청)

- `id`: UUID (PK)
- `projectId`: UUID (FK → Project)
- `userId`: UUID (FK → User)
- `message`: String? (자기 PR)
- `createdAt`: DateTime
- Unique constraint: (projectId, userId)

### ChatRoom (채팅방)

- `id`: UUID (PK)
- `projectId`: UUID (FK → Project, Unique)
- `createdAt`, `updatedAt`: DateTime

### ChatMessage (채팅 메시지)

- `id`: UUID (PK)
- `roomId`: UUID (FK → ChatRoom)
- `senderId`: UUID (FK → User)
- `content`: String (원문)
- `sourceLang`: String
- `targetLang`: String
- `translatedContent`: String? (더미 번역 결과)
- `createdAt`: DateTime

### Evaluation (평가 - 뼈대만)

- `id`: UUID (PK)
- `projectId`: UUID (FK → Project)
- `evaluatorId`: UUID (FK → User)
- `evaluateeId`: UUID (FK → User)
- `sincerity`: Int (1-5)
- `communication`: Int (1-5)
- `contribution`: Int (1-5)
- `createdAt`: DateTime
- TODO: 실제 구현 예정

## 3. 실제 구현할 API 목록

### 인증 (Auth)

- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /auth/me` - 현재 사용자 정보 (JWT 필요)

### 사용자 (Users)

- `GET /users/:id` - 사용자 정보 조회

### 프로젝트 (Projects)

- `GET /projects` - 프로젝트 목록 조회
- `POST /projects` - 프로젝트 생성 (JWT 필요)
- `GET /projects/:id` - 프로젝트 상세 조회
- `GET /projects/:id/recommendations` - 추천 팀원 목록 (전체 유저 대상)

### 참여 신청 (Applications)

- `POST /projects/:id/applications` - 참여 신청 (JWT 필요)

### 채팅 (Chat)

- `GET /chat/rooms/project/:projectId` - 채팅방 조회/생성
- `GET /chat/messages/:roomId` - 메시지 목록 조회
- WebSocket Gateway:
  - `join-room` - 채팅방 입장
  - `send-message` - 메시지 전송
  - `new-message` - 새 메시지 브로드캐스트

## 4. Docker Compose 서비스 구성

### db (PostgreSQL)

- Image: postgres:15-alpine
- Environment: POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD
- Volume: postgres_data (데이터 영속화)
- Port: 5432
- Healthcheck: 간단한 pg_isready 체크

### backend (NestJS)

- Build: ./backend
- Depends_on: db (healthcheck 조건)
- Environment: DATABASE_URL, JWT_SECRET, PORT 등
- Port: 4000:4000
- Command: npm run start:dev

### frontend (Next.js)

- Build: ./frontend
- Depends_on: backend
- Environment: NEXT_PUBLIC_API_BASE_URL
- Port: 3000:3000
- Command: npm run dev

## 5. 매칭 로직 (추천 기능)

- 프로젝트의 `requiredStacks`와 사용자의 `techStacks` 비교
- 교집합 개수 계산: `score = 교집합 개수`
- 점수 내림차순 정렬
- 상위 5명 반환
- **전체 유저 대상**으로 계산

## 6. 실시간 채팅 + 번역 흐름

1. 클라이언트가 `/projects/[id]/chat` 접속
2. WebSocket으로 `join-room` 이벤트 전송
3. 서버가 기존 메시지 목록 전송
4. 클라이언트가 메시지 입력 후 `send-message` 전송
5. 서버가 더미 번역 로직 실행
6. 서버가 `new-message` 이벤트로 브로드캐스트
7. 클라이언트가 UI 업데이트

### 더미 번역 로직

```typescript
// TODO: 실제 번역 API 연동 예정
function translateDummy(content: string, targetLang: string): string {
  return `[번역:${targetLang}] ${content}`;
}
```
