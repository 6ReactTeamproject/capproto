# Backend Dockerfile - NestJS 애플리케이션
FROM node:20-slim

# OpenSSL 및 procps 설치 (Prisma와 NestJS watch 모드가 필요로 함)
RUN apt-get update && apt-get install -y openssl ca-certificates procps && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm install

# Prisma 클라이언트 생성
COPY prisma ./prisma
RUN npx prisma generate

# 소스 코드 복사
COPY . .

# 빌드
RUN npm run build

# 개발 모드 실행 (실제로는 start:dev 사용)
CMD ["npm", "run", "start:dev"]

