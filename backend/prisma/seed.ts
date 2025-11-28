// Seed 스크립트 - 더미 데이터 생성
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed 스크립트 시작...");

  // 기존 데이터 삭제 (순서 중요: 외래키 참조 순서)
  await prisma.evaluation.deleteMany();
  await prisma.chatMessage.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.projectApplication.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ 기존 데이터 삭제 완료");

  // 비밀번호 해시
  const passwordHash = await bcrypt.hash("password123", 10);

  // 사용자 생성 (10명)
  const users = await Promise.all([
    // 개발자 5명
    prisma.user.create({
      data: {
        email: "dev1@example.com",
        passwordHash,
        nickname: "개발자1",
        role: UserRole.DEVELOPER,
        techStacks: JSON.stringify(["React", "TypeScript", "Next.js"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "dev2@example.com",
        passwordHash,
        nickname: "개발자2",
        role: UserRole.DEVELOPER,
        techStacks: JSON.stringify(["NestJS", "PostgreSQL", "TypeScript"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "dev3@example.com",
        passwordHash,
        nickname: "개발자3",
        role: UserRole.DEVELOPER,
        techStacks: JSON.stringify(["React", "Node.js", "MongoDB"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "dev4@example.com",
        passwordHash,
        nickname: "개발자4",
        role: UserRole.DEVELOPER,
        techStacks: JSON.stringify(["Vue.js", "Spring", "MySQL"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "dev5@example.com",
        passwordHash,
        nickname: "개발자5",
        role: UserRole.DEVELOPER,
        techStacks: JSON.stringify(["React", "Next.js", "Prisma"]),
      },
    }),
    // 디자이너 3명
    prisma.user.create({
      data: {
        email: "designer1@example.com",
        passwordHash,
        nickname: "디자이너1",
        role: UserRole.DESIGNER,
        techStacks: JSON.stringify(["Figma", "Photoshop", "Illustrator"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "designer2@example.com",
        passwordHash,
        nickname: "디자이너2",
        role: UserRole.DESIGNER,
        techStacks: JSON.stringify(["Figma", "Sketch", "Adobe XD"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "designer3@example.com",
        passwordHash,
        nickname: "디자이너3",
        role: UserRole.DESIGNER,
        techStacks: JSON.stringify(["Figma", "After Effects"]),
      },
    }),
    // 기획자 2명
    prisma.user.create({
      data: {
        email: "planner1@example.com",
        passwordHash,
        nickname: "기획자1",
        role: UserRole.PLANNER,
        techStacks: JSON.stringify(["Notion", "Figma", "Jira"]),
      },
    }),
    prisma.user.create({
      data: {
        email: "planner2@example.com",
        passwordHash,
        nickname: "기획자2",
        role: UserRole.PLANNER,
        techStacks: JSON.stringify(["Notion", "Confluence"]),
      },
    }),
  ]);

  console.log(`✅ ${users.length}명의 사용자 생성 완료`);

  // 프로젝트 생성 (5개)
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        title: "React 기반 웹 애플리케이션",
        shortDescription: "Next.js와 TypeScript를 활용한 모던 웹 앱 개발",
        neededRoles: JSON.stringify(["DEVELOPER", "DESIGNER"]),
        requiredStacks: JSON.stringify(["React", "Next.js", "TypeScript"]),
        creatorId: users[0].id,
      },
    }),
    prisma.project.create({
      data: {
        title: "NestJS 백엔드 API 서버",
        shortDescription: "PostgreSQL과 Prisma를 사용한 RESTful API 개발",
        neededRoles: JSON.stringify(["DEVELOPER"]),
        requiredStacks: JSON.stringify(["NestJS", "PostgreSQL", "TypeScript"]),
        creatorId: users[1].id,
      },
    }),
    prisma.project.create({
      data: {
        title: "모바일 앱 UI/UX 디자인",
        shortDescription: "Figma를 활용한 모바일 앱 디자인 프로젝트",
        neededRoles: JSON.stringify(["DESIGNER", "PLANNER"]),
        requiredStacks: JSON.stringify(["Figma", "Photoshop"]),
        creatorId: users[5].id,
      },
    }),
    prisma.project.create({
      data: {
        title: "풀스택 웹 서비스",
        shortDescription: "React + Node.js + MongoDB 스택의 풀스택 프로젝트",
        neededRoles: JSON.stringify(["DEVELOPER", "DESIGNER", "PLANNER"]),
        requiredStacks: JSON.stringify(["React", "Node.js", "MongoDB"]),
        creatorId: users[2].id,
      },
    }),
    prisma.project.create({
      data: {
        title: "프로젝트 관리 플랫폼",
        shortDescription: "Notion과 Jira를 활용한 협업 도구 개발",
        neededRoles: JSON.stringify(["PLANNER", "DEVELOPER"]),
        requiredStacks: JSON.stringify(["Notion", "Jira", "React"]),
        creatorId: users[8].id,
      },
    }),
  ]);

  console.log(`✅ ${projects.length}개의 프로젝트 생성 완료`);

  // 참여 신청 생성 (2개)
  await prisma.projectApplication.create({
    data: {
      projectId: projects[0].id,
      userId: users[2].id,
      message: "React와 Next.js에 관심이 많습니다. 참여하고 싶습니다!",
    },
  });

  await prisma.projectApplication.create({
    data: {
      projectId: projects[1].id,
      userId: users[4].id,
      message: "NestJS와 Prisma 경험이 있습니다.",
    },
  });

  console.log("✅ 참여 신청 생성 완료");

  // 채팅방 및 메시지 생성
  for (const project of projects) {
    const chatRoom = await prisma.chatRoom.create({
      data: {
        projectId: project.id,
      },
    });

    // 각 방에 2-3개의 예시 메시지 생성
    const messages = [
      {
        roomId: chatRoom.id,
        senderId: project.creatorId,
        content: "안녕하세요! 프로젝트에 관심 가져주셔서 감사합니다.",
        sourceLang: "ko",
        targetLang: "en",
        translatedContent:
          "[번역:en] Hello! Thank you for your interest in the project.",
      },
      {
        roomId: chatRoom.id,
        senderId: project.creatorId,
        content: "질문이 있으시면 언제든지 물어보세요.",
        sourceLang: "ko",
        targetLang: "en",
        translatedContent:
          "[번역:en] Please feel free to ask if you have any questions.",
      },
    ];

    // 프로젝트에 참여 신청한 사용자가 있으면 그 사용자의 메시지도 추가
    const application = await prisma.projectApplication.findFirst({
      where: { projectId: project.id },
    });

    if (application) {
      messages.push({
        roomId: chatRoom.id,
        senderId: application.userId,
        content: "네, 궁금한 점이 있습니다.",
        sourceLang: "ko",
        targetLang: "en",
        translatedContent: "[번역:en] Yes, I have a question.",
      });
    }

    await prisma.chatMessage.createMany({
      data: messages,
    });
  }

  console.log("✅ 채팅방 및 메시지 생성 완료");

  console.log("🎉 Seed 스크립트 완료!");
  console.log("\n📝 테스트 계정:");
  console.log("  - 이메일: dev1@example.com ~ planner2@example.com");
  console.log("  - 비밀번호: password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed 스크립트 실행 중 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
