# Sync-Up 프로토타입

사이드 프로젝트 팀원을 찾기 위한 IT 팀 매칭·협업 플랫폼 프로토타입입니다.

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router, TypeScript)
- **백엔드**: NestJS (TypeScript)
- **데이터베이스**: PostgreSQL
- **ORM**: Prisma
- **실시간 통신**: Socket.io (WebSocket)
- **컨테이너**: Docker + Docker Compose

## 주요 기능

1. **회원가입/로그인**: 이메일 기반 인증 (JWT)
2. **프로젝트 관리**: 프로젝트 생성, 조회, 상세 정보
3. **참여 신청**: 프로젝트에 참여 신청
4. **실시간 채팅 + 번역**: 프로젝트별 채팅방, 실시간 메시지, 더미 번역 기능
5. **팀원 추천**: 전체 유저 대상 기술 스택 기반 매칭

## 실행 방법

### 1. 환경 변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 필요한 값들을 수정하세요.

### 2. Docker Compose로 실행

```bash
# 전체 서비스 빌드 및 실행
docker compose up --build

# 백그라운드 실행
docker compose up -d --build
```

### 3. 데이터베이스 마이그레이션 및 Seed 데이터 생성

새 터미널에서:

```bash
# Prisma 마이그레이션 실행 (자동으로 실행되지만 수동 실행도 가능)
docker compose exec backend npx prisma migrate dev

# Seed 데이터 생성
docker compose run backend npm run seed
```

### 4. 접속

- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:4000

## Seed 데이터

Seed 스크립트 실행 후 다음 테스트 계정을 사용할 수 있습니다:

- **이메일**: dev1@example.com ~ planner2@example.com
- **비밀번호**: password123

### 사용자 역할

- 개발자 5명 (다양한 기술 스택)
- 디자이너 3명 (Figma, Photoshop 등)
- 기획자 2명 (Notion, Jira 등)

### 프로젝트

- 5개의 예시 프로젝트 생성
- 각 프로젝트마다 채팅방 및 예시 메시지 포함

## 프로젝트 구조

```
procap/
├── backend/          # NestJS 백엔드
│   ├── src/         # 소스 코드
│   ├── prisma/      # Prisma 스키마 및 seed
│   └── Dockerfile
├── frontend/        # Next.js 프론트엔드
│   ├── app/        # App Router 페이지
│   ├── lib/        # API 클라이언트
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 주요 API 엔드포인트

### 인증
- `POST /auth/register` - 회원가입
- `POST /auth/login` - 로그인
- `GET /auth/me` - 현재 사용자 정보 (JWT 필요)

### 프로젝트
- `GET /projects` - 프로젝트 목록
- `POST /projects` - 프로젝트 생성 (JWT 필요)
- `GET /projects/:id` - 프로젝트 상세
- `GET /projects/:id/recommendations` - 추천 팀원 목록

### 참여 신청
- `POST /projects/:id/applications` - 참여 신청 (JWT 필요)

### 채팅
- `GET /chat/rooms/project/:projectId` - 채팅방 조회/생성
- `GET /chat/messages/:roomId` - 메시지 목록
- WebSocket: `join-room`, `send-message`, `new-message`

## 개발 모드

### 백엔드만 실행

```bash
cd backend
npm install
cp .env.example .env
# .env 파일 수정
npx prisma migrate dev
npm run seed
npm run start:dev
```

### 프론트엔드만 실행

```bash
cd frontend
npm install
cp .env.example .env
# .env 파일 수정 (NEXT_PUBLIC_API_BASE_URL)
npm run dev
```

## 주의사항

1. **번역 기능**: 현재는 더미 번역 로직을 사용합니다. 실제 번역 API 연동은 `backend/src/chat/chat.service.ts`의 `translateDummy` 함수를 수정하세요.

2. **인증**: JWT 토큰은 localStorage에 저장됩니다. 프로덕션 환경에서는 보안을 강화해야 합니다.

3. **데이터베이스**: Docker 볼륨을 사용하여 데이터가 영속화됩니다. 데이터를 초기화하려면 `docker compose down -v`를 실행하세요.

## 문제 해결

### 데이터베이스 연결 오류

```bash
# 데이터베이스 컨테이너 상태 확인
docker compose ps

# 데이터베이스 로그 확인
docker compose logs db
```

### 백엔드 빌드 오류

```bash
# Prisma 클라이언트 재생성
docker compose exec backend npx prisma generate
```

### 포트 충돌

`.env` 파일에서 `BACKEND_PORT`와 `FRONTEND_PORT`를 변경하세요.

## 라이선스

MIT

