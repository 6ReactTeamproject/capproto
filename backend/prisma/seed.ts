// Seed 스크립트 - 더미 데이터 생성
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

// 더미 번역 함수 - 한글을 영어로 번역 (더미)
function translateDummyKoToEn(content: string): string {
  // 실제 번역 API 대신 더미 번역 텍스트 생성
  const translations: Record<string, string> = {
    "안녕하세요!": "Hello!",
    안녕하세요: "Hello",
    네: "Yes",
    좋아요: "Good",
    좋습니다: "Great",
    감사합니다: "Thank you",
    프로젝트: "project",
    프로젝트에: "to the project",
    관심: "interest",
    참여: "participate",
    참여하고: "participate",
    "참여하고 싶어요": "would like to participate",
    "참여 가능할까요": "can I participate",
    환영합니다: "Welcome",
    경험이: "experience",
    있어서: "have",
    어떤: "what",
    기능: "feature",
    시작할: "start",
    예정: "planning",
    인가요: "is it",
    인증: "authentication",
    시스템: "system",
    메인: "main",
    대시보드: "dashboard",
    구현: "implement",
    하려고: "try to",
    해요: "do",
    TypeScript: "TypeScript",
    타입: "type",
    안정성: "stability",
    챙기고요: "maintain",
    디자이너로: "as a designer",
    Figma: "Figma",
    UI: "UI",
    디자인: "design",
    먼저: "first",
    진행하면: "proceed",
    개발도: "development also",
    수월할: "easier",
    "디자인 시스템": "design system",
    정리하면: "organize",
    좋겠습니다: "would be good",
    질문: "question",
    있으시면: "if you have",
    물어보세요: "please ask",
    NestJS: "NestJS",
    Prisma: "Prisma",
    백엔드: "backend",
    API: "API",
    서버: "server",
    RESTful: "RESTful",
    WebSocket: "WebSocket",
    지원할: "support",
    도메인: "domain",
    시작하나요: "start with",
    유저: "user",
    관리: "management",
    PostgreSQL: "PostgreSQL",
    스키마: "schema",
    설계: "design",
    논의하면: "discuss",
    좋을: "good",
    "것 같아요": "I think",
    알겠습니다: "I understand",
    JWT: "JWT",
    미들웨어: "middleware",
    구성도: "composition",
    고민해볼게요: "think about",
    모바일: "mobile",
    앱: "app",
    시작합니다: "starting",
    시스템부터: "from the system",
    구축하려고: "build",
    기획자분도: "planner too",
    사용자: "user",
    플로우: "flow",
    설계도: "design",
    필요할: "need",
    "참여할 수": "can participate",
    있을까요: "is it possible",
    스토리: "story",
    와이어프레임: "wireframe",
    나오면: "comes out",
    작업도: "work also",
    컨셉: "concept",
    애니메이션: "animation",
    인터랙션: "interaction",
    "담당할 수": "can handle",
    "After Effects": "After Effects",
    프로토타입: "prototype",
    "만들 수": "can make",
    있습니다: "have",
    풀스택: "fullstack",
    실시간: "real-time",
    포함할: "include",
    작업: "work",
    "도와드릴 수": "can help",
    "상태 관리": "state management",
    라이브러리: "library",
    일단: "first",
    "Context API": "Context API",
    필요하면: "if needed",
    Redux: "Redux",
    Zustand: "Zustand",
    "전환할 수": "switch",
    "스키마 설계도": "schema design",
    "함께 해야 할": "need to do together",
    언제든: "anytime",
    말씀해주세요: "please tell me",
    컴포넌트: "component",
    참고한: "referenced",
    협업: "collaboration",
    도구: "tool",
    만들려고: "trying to make",
    기획과: "planning and",
    "개발 모두": "development both",
    필요해요: "need",
    프론트엔드: "frontend",
    개발자로: "as a developer",
    사용한: "used",
    스택으로: "stack",
    할지: "what to do",
    알림: "notification",
    중요할: "important",
    기획서: "plan document",
    초안: "draft",
    작성했어요: "wrote",
    칸반: "kanban",
    보드: "board",
    태스크: "task",
    댓글: "comment",
    중심으로: "centered",
    구성했는데: "composed",
    봐주세요: "please look",
    확인해볼게요: "will check",
    권한: "permission",
    추가로: "additionally",
    "해야 할": "need to",
  };

  // 간단한 번역 (실제로는 더 복잡한 로직 필요)
  let translated = content;

  // 일반적인 문장 패턴 번역
  if (translated.includes("안녕하세요")) {
    translated = translated.replace(/안녕하세요/g, "Hello");
  }
  if (translated.includes("네")) {
    translated = translated.replace(/네/g, "Yes");
  }
  if (translated.includes("좋습니다") || translated.includes("좋아요")) {
    translated = translated
      .replace(/좋습니다/g, "Good")
      .replace(/좋아요/g, "Good");
  }
  if (translated.includes("감사합니다")) {
    translated = translated.replace(/감사합니다/g, "Thank you");
  }

  // 더미 번역 - 실제 내용을 영어로 번역한 것처럼 보이도록
  // 실제로는 의미 있는 번역이 아니지만, 영어로 된 텍스트 생성
  return `Hello! Thank you for your interest in this project. ${content.substring(
    0,
    50
  )}...`;
}

// 더미 번역 함수 - 일본어를 영어로 번역 (더미)
function translateDummyJaToEn(content: string): string {
  return `[Translation] ${content}`;
}

// 더미 번역 함수 - 영어를 한글로 번역 (더미)
function translateDummyEnToKo(content: string): string {
  return `[번역] ${content}`;
}

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

  // 채팅방 및 메시지 생성 (더 현실적인 대화로 구성)
  const chatConversations = [
    // 프로젝트 0: React 기반 웹 애플리케이션
    {
      projectIndex: 0,
      messages: [
        {
          senderIndex: 0, // creator (개발자1)
          content:
            "안녕하세요! 이 프로젝트에 관심 가져주셔서 감사합니다. React와 Next.js로 모던한 웹 앱을 만들어보고 싶습니다.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Hello! Thank you for your interest in this project. I'd like to create a modern web app using React and Next.js.",
          minutesAgo: 120,
        },
        {
          senderIndex: 2, // dev3 (참여 신청자)
          content:
            "안녕하세요! React와 Node.js를 사용해본 경험이 있어서 참여하고 싶어요. 어떤 기능부터 시작할 예정인가요?",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Hello! I have experience with React and Node.js, so I'd like to participate. What features are you planning to start with?",
          minutesAgo: 90,
        },
        {
          senderIndex: 0,
          content:
            "좋습니다! 일단 인증 시스템과 메인 대시보드를 먼저 구현하려고 해요. TypeScript로 타입 안정성도 챙기고요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Great! I'm planning to implement the authentication system and main dashboard first. I'll also ensure type safety with TypeScript.",
          minutesAgo: 75,
        },
        {
          senderIndex: 5, // designer1
          content:
            "디자이너로 참여 가능할까요? Figma로 UI 디자인 먼저 진행하면 좋을 것 같아요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Can I participate as a designer? I think it would be good to proceed with UI design in Figma first.",
          minutesAgo: 60,
        },
        {
          senderIndex: 0,
          content:
            "네, 환영합니다! 디자인이 먼저 나오면 개발도 수월할 것 같아요. 디자인 시스템도 같이 정리하면 좋겠습니다.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Yes, welcome! If the design comes out first, development will be easier. It would be good to organize the design system together as well.",
          minutesAgo: 45,
        },
      ],
    },
    // 프로젝트 1: NestJS 백엔드 API 서버
    {
      projectIndex: 1,
      messages: [
        {
          senderIndex: 1, // creator (개발자2)
          content:
            "NestJS와 Prisma를 활용한 백엔드 API 서버 프로젝트입니다. RESTful API와 WebSocket을 모두 지원할 예정이에요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] This is a backend API server project using NestJS and Prisma. We plan to support both RESTful API and WebSocket.",
          minutesAgo: 180,
        },
        {
          senderIndex: 4, // dev5 (참여 신청자)
          content:
            "Prisma 경험이 있어서 참여하고 싶습니다! 어떤 도메인으로 시작하나요?",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] I have experience with Prisma and would like to participate! What domain should we start with?",
          minutesAgo: 150,
        },
        {
          senderIndex: 1,
          content:
            "유저 인증과 프로젝트 관리 API부터 시작할 예정입니다. PostgreSQL 스키마 설계도 같이 논의하면 좋을 것 같아요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] We plan to start with user authentication and project management APIs. It would be good to discuss the PostgreSQL schema design together as well.",
          minutesAgo: 120,
        },
        {
          senderIndex: 4,
          content:
            "알겠습니다. JWT 인증 구조와 미들웨어 구성도 같이 고민해볼게요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Understood. I'll also think about the JWT authentication structure and middleware configuration together.",
          minutesAgo: 90,
        },
      ],
    },
    // 프로젝트 2: 모바일 앱 UI/UX 디자인
    {
      projectIndex: 2,
      messages: [
        {
          senderIndex: 5, // creator (디자이너1)
          content:
            "모바일 앱 디자인 프로젝트 시작합니다! Figma로 디자인 시스템부터 구축하려고 해요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Starting the mobile app design project! I'm planning to build the design system first using Figma.",
          minutesAgo: 240,
        },
        {
          senderIndex: 6, // designer2
          content:
            "기획자분도 있으시면 좋을 것 같아요. 사용자 플로우 설계도 필요할 것 같아서요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] It would be good to have a planner as well. I think we'll need to design the user flow too.",
          minutesAgo: 210,
        },
        {
          senderIndex: 8, // planner1
          content:
            "기획자로 참여할 수 있을까요? 사용자 스토리와 와이어프레임 먼저 정리하면 좋을 것 같아요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Can I participate as a planner? I think it would be good to organize user stories and wireframes first.",
          minutesAgo: 180,
        },
        {
          senderIndex: 5,
          content:
            "네, 좋아요! 와이어프레임이 나오면 디자인 작업도 수월할 것 같아요. 디자인 컨셉도 같이 논의해봐요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Yes, good! Once the wireframes are ready, the design work should be easier. Let's also discuss the design concept together.",
          minutesAgo: 150,
        },
        {
          senderIndex: 7, // designer3
          content:
            "애니메이션과 인터랙션도 제가 담당할 수 있어요. After Effects로 프로토타입도 만들 수 있습니다.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] I can also handle animations and interactions. I can create prototypes using After Effects as well.",
          minutesAgo: 120,
        },
      ],
    },
    // 프로젝트 3: 풀스택 웹 서비스
    {
      projectIndex: 3,
      messages: [
        {
          senderIndex: 2, // creator (개발자3)
          content:
            "React + Node.js + MongoDB 스택으로 풀스택 프로젝트 진행합니다. 실시간 기능도 포함할 예정이에요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] We're proceeding with a full-stack project using React + Node.js + MongoDB stack. We plan to include real-time features as well.",
          minutesAgo: 100,
        },
        {
          senderIndex: 0, // dev1
          content:
            "React 쪽 프론트엔드 작업 도와드릴 수 있어요. 상태 관리 라이브러리는 어떤 걸 사용할까요?",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] I can help with the React frontend work. What state management library should we use?",
          minutesAgo: 80,
        },
        {
          senderIndex: 2,
          content:
            "일단 Context API로 시작하고, 필요하면 Redux나 Zustand로 전환할 수 있어요. MongoDB 스키마 설계도 같이 해야 할 것 같아요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Let's start with Context API first, and we can switch to Redux or Zustand if needed. We'll also need to design the MongoDB schema together.",
          minutesAgo: 60,
        },
        {
          senderIndex: 5, // designer1
          content:
            "디자인 작업도 필요하면 언제든 말씀해주세요. UI 컴포넌트 디자인부터 시작하면 될 것 같아요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] If design work is needed, please let me know anytime. I think we can start with UI component design.",
          minutesAgo: 40,
        },
      ],
    },
    // 프로젝트 4: 프로젝트 관리 플랫폼
    {
      projectIndex: 4,
      messages: [
        {
          senderIndex: 8, // creator (기획자1)
          content:
            "Notion과 Jira를 참고한 협업 도구를 만들려고 합니다. 기획과 개발 모두 필요해요!",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] We're planning to create a collaboration tool inspired by Notion and Jira. We need both planning and development!",
          minutesAgo: 300,
        },
        {
          senderIndex: 3, // dev4
          content:
            "프론트엔드 개발자로 참여 가능합니다. Vue.js와 Spring을 사용한 경험이 있어요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] I can participate as a frontend developer. I have experience using Vue.js and Spring.",
          minutesAgo: 270,
        },
        {
          senderIndex: 8,
          content:
            "좋아요! 백엔드는 어떤 스택으로 할지 논의가 필요할 것 같아요. REST API와 실시간 알림 기능도 중요할 것 같아서요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Good! I think we need to discuss which stack to use for the backend. REST API and real-time notification features also seem important.",
          minutesAgo: 240,
        },
        {
          senderIndex: 9, // planner2
          content:
            "기획서 초안 작성했어요. 칸반 보드, 태스크 관리, 댓글 기능을 중심으로 구성했는데 한번 봐주세요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] I've written the initial plan document. I've structured it around kanban board, task management, and comment features. Please take a look.",
          minutesAgo: 210,
        },
        {
          senderIndex: 8,
          content:
            "네, 확인해볼게요! 사용자 인증과 권한 관리 부분도 추가로 논의해야 할 것 같아요.",
          sourceLang: "ko",
          targetLang: "en",
          translatedContent:
            "[번역:en] Yes, I'll check it out! I think we also need to discuss user authentication and permission management separately.",
          minutesAgo: 180,
        },
      ],
    },
  ];

  for (const conversation of chatConversations) {
    const project = projects[conversation.projectIndex];
    const chatRoom = await prisma.chatRoom.create({
      data: {
        projectId: project.id,
      },
    });

    // 메시지를 시간순으로 정렬하여 생성 (가장 오래된 것부터)
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => b.minutesAgo - a.minutesAgo
    );

    for (const msg of sortedMessages) {
      const now = new Date();
      const createdAt = new Date(now.getTime() - msg.minutesAgo * 60 * 1000);
      const senderId = users[msg.senderIndex].id;

      // 번역된 내용이 이미 제공되었는지 확인, 없으면 더미 번역 생성
      let translatedContent = msg.translatedContent;
      if (!translatedContent) {
        // 더미 번역 생성 (한글 → 영어)
        if (msg.sourceLang === "ko" && msg.targetLang === "en") {
          translatedContent = translateDummyKoToEn(msg.content);
        } else if (msg.sourceLang === "ja" && msg.targetLang === "en") {
          translatedContent = translateDummyJaToEn(msg.content);
        } else if (msg.sourceLang === "en" && msg.targetLang === "ko") {
          translatedContent = translateDummyEnToKo(msg.content);
        } else {
          translatedContent = `[번역:${msg.targetLang}] ${msg.content}`;
        }
      }

      await prisma.chatMessage.create({
        data: {
          roomId: chatRoom.id,
          senderId,
          content: msg.content,
          sourceLang: msg.sourceLang,
          targetLang: msg.targetLang,
          translatedContent,
          createdAt,
        },
      });
    }
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
