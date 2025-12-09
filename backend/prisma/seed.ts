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

  // 시스템 사용자 생성 (알림 메시지용)
  const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
  await prisma.user.upsert({
    where: { id: SYSTEM_USER_ID },
    update: {},
    create: {
      id: SYSTEM_USER_ID,
      email: "system@procap.com",
      passwordHash: await bcrypt.hash("system", 10),
      nickname: "시스템",
      role: UserRole.DEVELOPER,
      techStacks: "[]",
      country: "KR",
    } as any,
  });
  console.log("✅ 시스템 사용자 생성 완료");

  // 비밀번호 해시
  const passwordHash = await bcrypt.hash("password123", 10);

  // 사용자 생성 (55명)
  const users: any[] = [];

  // 개발자 닉네임 목록 (국가별로 분리)
  const developerNicknamesKR = [
    "민수",
    "김코더",
    "이개발",
    "박클라우드",
    "최백엔드",
    "정모바일",
    "홍게임",
    "강보안",
    "문개발",
    "윤블록체인",
  ];
  const developerNicknamesUS = [
    "james123",
    "sarah99",
    "alex_dev",
    "coffee",
    "react_lover",
    "david2024",
    "emily_dev",
    "mike_coder",
    "lisa_tech",
    "tom_dev",
  ];
  const developerNicknamesJP = [
    "たろう",
    "さくら",
    "けんじ",
    "ゆき",
    "ひろし",
    "みき",
    "だいすけ",
    "あや",
    "まさき",
    "なつき",
  ];

  // 디자이너 닉네임 목록 (국가별로 분리)
  const designerNicknamesKR = ["지영", "서연", "수진", "영희", "미나"];
  const designerNicknamesUS = [
    "emily_design",
    "sophia_ui",
    "olivia_ux",
    "ava_creative",
    "isabella_art",
  ];
  const designerNicknamesJP = ["みゆき", "あかり", "みお", "ゆい", "りん"];

  // 기획자 닉네임 목록 (국가별로 분리)
  const plannerNicknamesKR = ["현우", "준호", "민준", "태현", "준영"];
  const plannerNicknamesUS = [
    "sarah_planner",
    "alex_manager",
    "james_pm",
    "emily_strategy",
    "mike_planner",
  ];
  const plannerNicknamesJP = ["たかし", "ゆうき", "あきら", "まさと", "ひろき"];

  // 개발자 스택 목록
  const developerStacks = [
    ["React", "TypeScript", "Next.js"],
    ["NestJS", "PostgreSQL", "TypeScript"],
    ["React", "Node.js", "MongoDB"],
    ["Vue.js", "Spring", "MySQL"],
    ["React", "Next.js", "Prisma"],
    ["Angular", "TypeScript", "RxJS"],
    ["Express", "MongoDB", "Node.js"],
    ["Django", "Python", "PostgreSQL"],
    ["Flask", "Python", "SQLite"],
    ["Laravel", "PHP", "MySQL"],
    ["Ruby on Rails", "Ruby", "PostgreSQL"],
    ["ASP.NET", "C#", "SQL Server"],
    ["Go", "Gin", "PostgreSQL"],
    ["Rust", "Actix", "Docker"],
    ["Kotlin", "Spring Boot", "PostgreSQL"],
    ["Swift", "iOS", "Core Data"],
    ["React Native", "TypeScript", "Firebase"],
    ["Flutter", "Dart", "Firebase"],
    ["GraphQL", "Apollo", "MongoDB"],
    ["Microservices", "Docker", "Kubernetes"],
    ["AWS", "Lambda", "DynamoDB"],
    ["GCP", "Cloud Functions", "Firestore"],
    ["Azure", "Functions", "Cosmos DB"],
    ["Redis", "Node.js", "Socket.io"],
    ["Elasticsearch", "Kibana", "Logstash"],
    ["TensorFlow", "Python", "Jupyter"],
    ["PyTorch", "Python", "NumPy"],
    ["Blockchain", "Solidity", "Web3"],
    ["WebAssembly", "Rust", "C++"],
    ["Deno", "TypeScript", "Oak"],
  ];

  // 디자이너 스택 목록
  const designerStacks = [
    ["Figma", "Photoshop", "Illustrator"],
    ["Figma", "Sketch", "Adobe XD"],
    ["Figma", "After Effects"],
    ["Figma", "Principle", "Framer"],
    ["Sketch", "InVision", "Zeplin"],
    ["Adobe XD", "Illustrator", "Photoshop"],
    ["Figma", "Protopie", "Lottie"],
    ["Blender", "Cinema 4D", "After Effects"],
    ["Figma", "Webflow", "Framer"],
    ["Sketch", "Abstract", "InVision"],
    ["Figma", "Miro", "Whimsical"],
    ["Adobe Creative Suite", "Figma", "Principle"],
    ["Figma", "Origami", "Flinto"],
    ["Sketch", "Figma", "Zeplin"],
    ["Figma", "Notion", "Miro"],
  ];

  // 기획자 스택 목록
  const plannerStacks = [
    ["Notion", "Figma", "Jira"],
    ["Notion", "Confluence"],
    ["Notion", "Miro", "Figma"],
    ["Jira", "Confluence", "Trello"],
    ["Notion", "Airtable", "Figma"],
    ["Miro", "Figma", "Notion"],
    ["Confluence", "Jira", "Slack"],
    ["Notion", "Google Workspace", "Figma"],
    ["Airtable", "Notion", "Figma"],
    ["Notion", "Miro", "Whimsical"],
  ];

  // 개발자 30명 생성 (국가별로 닉네임 배정)
  for (let i = 1; i <= 30; i++) {
    const stacks = developerStacks[(i - 1) % developerStacks.length];
    // 국가 할당 (30명 개발자를 3개 국가에 분배: KR 10, US 10, JP 10)
    const countries = ["KR", "US", "JP"];
    const country = countries[(i - 1) % 3];

    // 국가에 맞는 닉네임 선택
    let nickname: string;
    if (country === "KR") {
      // KR: i=1,4,7,10,13,16,19,22,25,28 -> index 0,1,2,3,4,5,6,7,8,9
      const index = Math.floor((i - 1) / 3) % developerNicknamesKR.length;
      nickname = developerNicknamesKR[index];
    } else if (country === "US") {
      // US: i=2,5,8,11,14,17,20,23,26,29 -> index 0,1,2,3,4,5,6,7,8,9
      const index = Math.floor((i - 1) / 3) % developerNicknamesUS.length;
      nickname = developerNicknamesUS[index];
    } else {
      // JP: i=3,6,9,12,15,18,21,24,27,30 -> index 0,1,2,3,4,5,6,7,8,9
      const index = Math.floor((i - 1) / 3) % developerNicknamesJP.length;
      nickname = developerNicknamesJP[index];
    }

    users.push(
      await prisma.user.create({
        data: {
          email: `dev${i}@example.com`,
          passwordHash,
          nickname: nickname,
          role: UserRole.DEVELOPER,
          techStacks: JSON.stringify(stacks),
          country: country,
        } as any,
      })
    );
  }

  // 디자이너 15명 생성 (국가별로 닉네임 배정)
  for (let i = 1; i <= 15; i++) {
    const stacks = designerStacks[(i - 1) % designerStacks.length];
    // 국가 할당 (15명 디자이너를 3개 국가에 분배: KR 5, US 5, JP 5)
    const countries = ["KR", "US", "JP"];
    const country = countries[(i - 1) % 3];

    // 국가에 맞는 닉네임 선택
    let nickname: string;
    if (country === "KR") {
      const index = (i - 1) % designerNicknamesKR.length;
      nickname = designerNicknamesKR[index];
    } else if (country === "US") {
      const index = (i - 1) % designerNicknamesUS.length;
      nickname = designerNicknamesUS[index];
    } else {
      const index = (i - 1) % designerNicknamesJP.length;
      nickname = designerNicknamesJP[index];
    }

    users.push(
      await prisma.user.create({
        data: {
          email: `designer${i}@example.com`,
          passwordHash,
          nickname: nickname,
          role: UserRole.DESIGNER,
          techStacks: JSON.stringify(stacks),
          country: country,
        } as any,
      })
    );
  }

  // 기획자 10명 생성 (국가별로 닉네임 배정)
  for (let i = 1; i <= 10; i++) {
    const stacks = plannerStacks[(i - 1) % plannerStacks.length];
    // 국가 할당 (10명 기획자를 3개 국가에 분배: KR 4, US 3, JP 3)
    const countries = ["KR", "US", "JP"];
    const country = countries[(i - 1) % 3];

    // 국가에 맞는 닉네임 선택
    let nickname: string;
    if (country === "KR") {
      const index = (i - 1) % plannerNicknamesKR.length;
      nickname = plannerNicknamesKR[index];
    } else if (country === "US") {
      const index = (i - 1) % plannerNicknamesUS.length;
      nickname = plannerNicknamesUS[index];
    } else {
      const index = (i - 1) % plannerNicknamesJP.length;
      nickname = plannerNicknamesJP[index];
    }

    users.push(
      await prisma.user.create({
        data: {
          email: `planner${i}@example.com`,
          passwordHash,
          nickname: nickname,
          role: UserRole.PLANNER,
          techStacks: JSON.stringify(stacks),
          country: country,
        } as any,
      })
    );
  }

  console.log(`✅ ${users.length}명의 사용자 생성 완료`);

  // 프로젝트 데이터 (국가별 번역)
  const projectData = [
    {
      // 프로젝트 1: users[0] (KR)
      ko: {
        title: "React 기반 웹 애플리케이션",
        shortDescription: "Next.js와 TypeScript를 활용한 모던 웹 앱 개발",
      },
      en: {
        title: "React-based Web Application",
        shortDescription:
          "Modern web app development using Next.js and TypeScript",
      },
      ja: {
        title: "ReactベースのWebアプリケーション",
        shortDescription: "Next.jsとTypeScriptを活用したモダンなWebアプリ開発",
      },
      creatorIndex: 0,
      neededRoles: ["DEVELOPER", "DESIGNER"],
      requiredStacks: ["React", "Next.js", "TypeScript"],
      startDays: 7,
      endDays: 90,
      isRecruiting: false,
    },
    {
      // 프로젝트 2: users[1] (US)
      ko: {
        title: "NestJS 백엔드 API 서버",
        shortDescription: "PostgreSQL과 Prisma를 사용한 RESTful API 개발",
      },
      en: {
        title: "NestJS Backend API Server",
        shortDescription: "RESTful API development using PostgreSQL and Prisma",
      },
      ja: {
        title: "NestJSバックエンドAPIサーバー",
        shortDescription: "PostgreSQLとPrismaを使用したRESTful API開発",
      },
      creatorIndex: 1,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["NestJS", "PostgreSQL", "TypeScript"],
      startDays: 14,
      endDays: 75,
      isRecruiting: false,
    },
    {
      // 프로젝트 3: users[30] (KR) - designer1
      ko: {
        title: "모바일 앱 UI/UX 디자인",
        shortDescription: "Figma를 활용한 모바일 앱 디자인 프로젝트",
      },
      en: {
        title: "Mobile App UI/UX Design",
        shortDescription: "Mobile app design project using Figma",
      },
      ja: {
        title: "モバイルアプリUI/UXデザイン",
        shortDescription: "Figmaを活用したモバイルアプリデザインプロジェクト",
      },
      creatorIndex: 30,
      neededRoles: ["DESIGNER", "PLANNER"],
      requiredStacks: ["Figma", "Photoshop"],
      startDays: 3,
      endDays: 60,
      isRecruiting: false,
    },
    {
      // 프로젝트 4: users[2] (JP)
      ko: {
        title: "풀스택 웹 서비스",
        shortDescription: "React + Node.js + MongoDB 스택의 풀스택 프로젝트",
      },
      en: {
        title: "Full-stack Web Service",
        shortDescription: "Full-stack project using React + Node.js + MongoDB",
      },
      ja: {
        title: "フルスタックWebサービス",
        shortDescription:
          "React + Node.js + MongoDBスタックのフルスタックプロジェクト",
      },
      creatorIndex: 2,
      neededRoles: ["DEVELOPER", "DESIGNER", "PLANNER"],
      requiredStacks: ["React", "Node.js", "MongoDB"],
      startDays: 10,
      endDays: 120,
      isRecruiting: true,
    },
    {
      // 프로젝트 5: users[45] (KR) - planner1
      ko: {
        title: "프로젝트 관리 플랫폼",
        shortDescription: "Notion과 Jira를 활용한 협업 도구 개발",
      },
      en: {
        title: "Project Management Platform",
        shortDescription:
          "Collaboration tool development inspired by Notion and Jira",
      },
      ja: {
        title: "プロジェクト管理プラットフォーム",
        shortDescription: "NotionとJiraを活用したコラボレーションツール開発",
      },
      creatorIndex: 45,
      neededRoles: ["PLANNER", "DEVELOPER"],
      requiredStacks: ["Notion", "Jira", "React"],
      startDays: 5,
      endDays: 100,
      isRecruiting: true,
    },
    {
      // 프로젝트 6: users[3] (KR)
      ko: {
        title: "Vue.js 기반 대시보드",
        shortDescription:
          "Vue 3와 Composition API를 활용한 관리자 대시보드 개발",
      },
      en: {
        title: "Vue.js-based Dashboard",
        shortDescription:
          "Admin dashboard development using Vue 3 and Composition API",
      },
      ja: {
        title: "Vue.jsベースのダッシュボード",
        shortDescription:
          "Vue 3とComposition APIを活用した管理者ダッシュボード開発",
      },
      creatorIndex: 3,
      neededRoles: ["DEVELOPER", "DESIGNER"],
      requiredStacks: ["Vue.js", "TypeScript", "Pinia"],
      startDays: 6,
      endDays: 80,
      isRecruiting: true,
    },
    {
      // 프로젝트 7: users[4] (US)
      ko: {
        title: "실시간 채팅 애플리케이션",
        shortDescription: "WebSocket을 활용한 실시간 메신저 개발",
      },
      en: {
        title: "Real-time Chat Application",
        shortDescription: "Real-time messenger development using WebSocket",
      },
      ja: {
        title: "リアルタイムチャットアプリケーション",
        shortDescription: "WebSocketを活用したリアルタイムメッセンジャー開発",
      },
      creatorIndex: 4,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["Node.js", "Socket.io", "React"],
      startDays: 8,
      endDays: 70,
      isRecruiting: true,
    },
    {
      // 프로젝트 8: users[31] (US) - designer2
      ko: {
        title: "이커머스 플랫폼 디자인",
        shortDescription: "온라인 쇼핑몰 UI/UX 디자인 및 프로토타입 제작",
      },
      en: {
        title: "E-commerce Platform Design",
        shortDescription:
          "Online shopping mall UI/UX design and prototype creation",
      },
      ja: {
        title: "Eコマースプラットフォームデザイン",
        shortDescription:
          "オンラインショッピングモールUI/UXデザインとプロトタイプ制作",
      },
      creatorIndex: 31,
      neededRoles: ["DESIGNER", "PLANNER"],
      requiredStacks: ["Figma", "Adobe XD", "Principle"],
      startDays: 4,
      endDays: 65,
      isRecruiting: true,
    },
    {
      // 프로젝트 9: users[5] (JP)
      ko: {
        title: "Django 기반 블로그 플랫폼",
        shortDescription: "Python Django로 개발하는 개인 블로그 시스템",
      },
      en: {
        title: "Django-based Blog Platform",
        shortDescription: "Personal blog system developed with Python Django",
      },
      ja: {
        title: "Djangoベースのブログプラットフォーム",
        shortDescription: "Python Djangoで開発する個人ブログシステム",
      },
      creatorIndex: 5,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["Django", "Python", "PostgreSQL"],
      startDays: 12,
      endDays: 85,
      isRecruiting: true,
    },
    {
      // 프로젝트 10: users[32] (JP) - designer3
      ko: {
        title: "모바일 게임 UI 디자인",
        shortDescription: "모바일 게임을 위한 인터페이스 및 캐릭터 디자인",
      },
      en: {
        title: "Mobile Game UI Design",
        shortDescription: "Interface and character design for mobile games",
      },
      ja: {
        title: "モバイルゲームUIデザイン",
        shortDescription:
          "モバイルゲームのためのインターフェースとキャラクターデザイン",
      },
      creatorIndex: 32,
      neededRoles: ["DESIGNER"],
      requiredStacks: ["Figma", "Illustrator", "After Effects"],
      startDays: 2,
      endDays: 55,
      isRecruiting: true,
    },
    {
      // 프로젝트 11: users[6] (KR)
      ko: {
        title: "마이크로서비스 아키텍처 구축",
        shortDescription:
          "Docker와 Kubernetes를 활용한 마이크로서비스 시스템 개발",
      },
      en: {
        title: "Microservices Architecture Development",
        shortDescription:
          "Microservices system development using Docker and Kubernetes",
      },
      ja: {
        title: "マイクロサービスアーキテクチャ構築",
        shortDescription:
          "DockerとKubernetesを活用したマイクロサービスシステム開発",
      },
      creatorIndex: 6,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["Docker", "Kubernetes", "Go", "gRPC"],
      startDays: 20,
      endDays: 150,
      isRecruiting: true,
    },
    {
      // 프로젝트 12: users[46] (US) - planner2
      ko: {
        title: "스타트업 제품 기획",
        shortDescription: "새로운 SaaS 서비스의 전체 기획 및 프로토타입 설계",
      },
      en: {
        title: "Startup Product Planning",
        shortDescription:
          "Complete planning and prototype design for a new SaaS service",
      },
      ja: {
        title: "スタートアップ製品企画",
        shortDescription: "新しいSaaSサービスの全体企画とプロトタイプ設計",
      },
      creatorIndex: 46,
      neededRoles: ["PLANNER", "DESIGNER"],
      requiredStacks: ["Notion", "Figma", "Miro"],
      startDays: 1,
      endDays: 50,
      isRecruiting: true,
    },
    {
      // 프로젝트 13: users[7] (US)
      ko: {
        title: "React Native 모바일 앱",
        shortDescription: "크로스 플랫폼 모바일 애플리케이션 개발",
      },
      en: {
        title: "React Native Mobile App",
        shortDescription: "Cross-platform mobile application development",
      },
      ja: {
        title: "React Nativeモバイルアプリ",
        shortDescription: "クロスプラットフォームモバイルアプリケーション開発",
      },
      creatorIndex: 7,
      neededRoles: ["DEVELOPER", "DESIGNER"],
      requiredStacks: ["React Native", "TypeScript", "Firebase"],
      startDays: 9,
      endDays: 110,
      isRecruiting: true,
    },
    {
      // 프로젝트 14: users[8] (JP)
      ko: {
        title: "AI 기반 추천 시스템",
        shortDescription: "머신러닝을 활용한 개인화 추천 엔진 개발",
      },
      en: {
        title: "AI-based Recommendation System",
        shortDescription:
          "Personalized recommendation engine development using machine learning",
      },
      ja: {
        title: "AIベースの推薦システム",
        shortDescription: "機械学習を活用したパーソナライズ推薦エンジン開発",
      },
      creatorIndex: 8,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["Python", "TensorFlow", "FastAPI"],
      startDays: 15,
      endDays: 130,
      isRecruiting: true,
    },
    {
      // 프로젝트 15: users[33] (KR) - designer4
      ko: {
        title: "브랜드 아이덴티티 디자인",
        shortDescription: "스타트업을 위한 브랜드 로고 및 시각 아이덴티티 제작",
      },
      en: {
        title: "Brand Identity Design",
        shortDescription:
          "Brand logo and visual identity creation for startups",
      },
      ja: {
        title: "ブランドアイデンティティデザイン",
        shortDescription:
          "スタートアップのためのブランドロゴとビジュアルアイデンティティ制作",
      },
      creatorIndex: 33,
      neededRoles: ["DESIGNER"],
      requiredStacks: ["Illustrator", "Photoshop", "Figma"],
      startDays: 3,
      endDays: 45,
      isRecruiting: true,
    },
    {
      // 프로젝트 16: users[9] (KR)
      ko: {
        title: "GraphQL API 서버",
        shortDescription: "Apollo Server를 활용한 GraphQL 백엔드 개발",
      },
      en: {
        title: "GraphQL API Server",
        shortDescription: "GraphQL backend development using Apollo Server",
      },
      ja: {
        title: "GraphQL APIサーバー",
        shortDescription: "Apollo Serverを活用したGraphQLバックエンド開発",
      },
      creatorIndex: 9,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["GraphQL", "Apollo", "Node.js", "MongoDB"],
      startDays: 11,
      endDays: 95,
      isRecruiting: true,
    },
    {
      // 프로젝트 17: users[34] (US) - designer5
      ko: {
        title: "웹 애니메이션 프로젝트",
        shortDescription:
          "Framer Motion과 Lottie를 활용한 인터랙티브 웹 애니메이션",
      },
      en: {
        title: "Web Animation Project",
        shortDescription:
          "Interactive web animations using Framer Motion and Lottie",
      },
      ja: {
        title: "Webアニメーションプロジェクト",
        shortDescription:
          "Framer MotionとLottieを活用したインタラクティブWebアニメーション",
      },
      creatorIndex: 34,
      neededRoles: ["DESIGNER", "DEVELOPER"],
      requiredStacks: ["Framer", "Lottie", "React"],
      startDays: 5,
      endDays: 60,
      isRecruiting: true,
    },
    {
      // 프로젝트 18: users[10] (US)
      ko: {
        title: "블록체인 기반 NFT 마켓플레이스",
        shortDescription: "Web3 기술을 활용한 NFT 거래 플랫폼 개발",
      },
      en: {
        title: "Blockchain-based NFT Marketplace",
        shortDescription:
          "NFT trading platform development using Web3 technology",
      },
      ja: {
        title: "ブロックチェーンベースのNFTマーケットプレイス",
        shortDescription: "Web3技術を活用したNFT取引プラットフォーム開発",
      },
      creatorIndex: 10,
      neededRoles: ["DEVELOPER"],
      requiredStacks: ["Solidity", "Web3", "React", "Ethereum"],
      startDays: 18,
      endDays: 140,
      isRecruiting: true,
    },
    {
      // 프로젝트 19: users[47] (JP) - planner3
      ko: {
        title: "사용자 리서치 및 UX 개선",
        shortDescription: "기존 서비스의 사용자 경험 분석 및 개선안 제시",
      },
      en: {
        title: "User Research and UX Improvement",
        shortDescription:
          "User experience analysis and improvement proposals for existing services",
      },
      ja: {
        title: "ユーザーリサーチとUX改善",
        shortDescription: "既存サービスのユーザー体験分析と改善案提示",
      },
      creatorIndex: 47,
      neededRoles: ["PLANNER", "DESIGNER"],
      requiredStacks: ["Notion", "Figma", "Miro", "UserTesting"],
      startDays: 7,
      endDays: 70,
      isRecruiting: true,
    },
    {
      // 프로젝트 20: users[11] (JP)
      ko: {
        title: "Flutter 크로스플랫폼 앱",
        shortDescription: "Flutter를 활용한 iOS/Android 네이티브 앱 개발",
      },
      en: {
        title: "Flutter Cross-platform App",
        shortDescription: "iOS/Android native app development using Flutter",
      },
      ja: {
        title: "Flutterクロスプラットフォームアプリ",
        shortDescription: "Flutterを活用したiOS/Androidネイティブアプリ開発",
      },
      creatorIndex: 11,
      neededRoles: ["DEVELOPER", "DESIGNER"],
      requiredStacks: ["Flutter", "Dart", "Firebase"],
      startDays: 13,
      endDays: 105,
      isRecruiting: true,
    },
  ];

  // 프로젝트 생성 (20개)
  const now = new Date();
  const projects = await Promise.all(
    projectData.map(async (data) => {
      const creator = users[data.creatorIndex];
      const creatorCountry = creator.country || "KR";
      const lang =
        creatorCountry === "KR" ? "ko" : creatorCountry === "US" ? "en" : "ja";
      const projectText = data[lang as keyof typeof data] as {
        title: string;
        shortDescription: string;
      };

      return prisma.project.create({
        data: {
          title: projectText.title,
          shortDescription: projectText.shortDescription,
          neededRoles: JSON.stringify(data.neededRoles),
          requiredStacks: JSON.stringify(data.requiredStacks),
          startDate: new Date(
            now.getTime() + data.startDays * 24 * 60 * 60 * 1000
          ),
          endDate: new Date(now.getTime() + data.endDays * 24 * 60 * 60 * 1000),
          isRecruiting: data.isRecruiting,
          creatorId: creator.id,
        } as any,
      });
    })
  );

  console.log(`✅ ${projects.length}개의 프로젝트 생성 완료`);

  // 참여 신청 생성 (2개)
  await prisma.projectApplication.create({
    data: {
      projectId: projects[0].id,
      userId: users[10].id,
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
  // 보낸 사람의 국가에 맞게 메시지 언어 설정 (KR→ko, US→en, JP→ja)
  const chatConversationsDetailed = [
    // 프로젝트 0: React 기반 웹 애플리케이션
    {
      projectIndex: 0,
      messages: [
        {
          senderIndex: 1, // creator (개발자2, US) - users[1] = dev2 = US
          content:
            "Hello! Thank you for your interest in this project. I'd like to create a modern web app using React and Next.js.",
          minutesAgo: 120,
        },
        {
          senderIndex: 0, // dev1 (참여 신청자, KR) - users[0] = dev1 = KR
          content:
            "안녕하세요! React와 Node.js를 사용해본 경험이 있어서 참여하고 싶어요. 어떤 기능부터 시작할 예정인가요?",
          minutesAgo: 90,
        },
        {
          senderIndex: 1, // US
          content:
            "Great! I'm planning to implement the authentication system and main dashboard first. I'll also ensure type safety with TypeScript.",
          minutesAgo: 75,
        },
        {
          senderIndex: 30, // designer1 (KR) - users[30] = designer1 = KR
          content:
            "디자이너로 참여 가능할까요? Figma로 UI 디자인 먼저 진행하면 좋을 것 같아요.",
          minutesAgo: 60,
        },
        {
          senderIndex: 1, // US
          content:
            "Yes, welcome! If the design comes out first, development will be easier. It would be good to organize the design system together as well.",
          minutesAgo: 45,
        },
        {
          senderIndex: 2, // dev3 (JP) - users[2] = dev3 = JP
          content:
            "こんにちは！ReactとTypeScriptの経験があります。フロントエンド開発に参加できますか？",
          minutesAgo: 30,
        },
      ],
    },
    // 프로젝트 1: NestJS 백엔드 API 서버
    {
      projectIndex: 1,
      messages: [
        {
          senderIndex: 2, // creator (개발자3, JP) - users[2] = dev3 = JP
          content:
            "NestJSとPrismaを使ったバックエンドAPIサーバーのプロジェクトです。RESTful APIとWebSocketの両方をサポートする予定です。",
          minutesAgo: 180,
        },
        {
          senderIndex: 4, // dev5 (참여 신청자, US) - users[4] = dev5 = US (i=5, (5-1)%3=1)
          content:
            "I have experience with Prisma and would like to participate! What domain should we start with?",
          minutesAgo: 150,
        },
        {
          senderIndex: 2, // JP
          content:
            "ユーザー認証とプロジェクト管理APIから始める予定です。PostgreSQLスキーマの設計も一緒に議論できればと思います。",
          minutesAgo: 120,
        },
        {
          senderIndex: 4, // US
          content:
            "Understood. I'll also think about the JWT authentication structure and middleware configuration together.",
          minutesAgo: 90,
        },
        {
          senderIndex: 0, // dev1 (KR) - users[0] = dev1 = KR
          content:
            "NestJS에 관심이 많아서 참여하고 싶습니다. 백엔드 개발 경험이 있습니다.",
          minutesAgo: 60,
        },
      ],
    },
    // 프로젝트 2: 모바일 앱 UI/UX 디자인
    {
      projectIndex: 2,
      messages: [
        {
          senderIndex: 30, // creator (디자이너1, KR)
          content:
            "모바일 앱 디자인 프로젝트 시작합니다! Figma로 디자인 시스템부터 구축하려고 해요.",
          minutesAgo: 240,
        },
        {
          senderIndex: 31, // designer2 (US)
          content:
            "It would be good to have a planner as well. I think we'll need to design the user flow too.",
          minutesAgo: 210,
        },
        {
          senderIndex: 45, // planner1 (KR)
          content:
            "기획자로 참여할 수 있을까요? 사용자 스토리와 와이어프레임 먼저 정리하면 좋을 것 같아요.",
          minutesAgo: 180,
        },
        {
          senderIndex: 30, // KR
          content:
            "네, 좋아요! 와이어프레임이 나오면 디자인 작업도 수월할 것 같아요. 디자인 컨셉도 같이 논의해봐요.",
          minutesAgo: 150,
        },
        {
          senderIndex: 32, // designer3 (JP)
          content:
            "アニメーションとインタラクションも担当できます。After Effectsでプロトタイプも作成できます。",
          minutesAgo: 120,
        },
        {
          senderIndex: 30, // KR
          content:
            "좋습니다! 애니메이션 작업도 함께 진행하면 더 완성도 높은 결과물이 나올 것 같아요.",
          minutesAgo: 90,
        },
      ],
    },
    // 프로젝트 3: 풀스택 웹 서비스
    {
      projectIndex: 3,
      messages: [
        {
          senderIndex: 0, // creator (개발자1, KR) - users[0] = dev1 = KR
          content:
            "React + Node.js + MongoDB 스택으로 풀스택 프로젝트 진행합니다. 실시간 기능도 포함할 예정이에요.",
          minutesAgo: 100,
        },
        {
          senderIndex: 1, // dev2 (US) - users[1] = dev2 = US
          content:
            "I can help with the React frontend work. What state management library should we use?",
          minutesAgo: 80,
        },
        {
          senderIndex: 0, // KR
          content:
            "일단 Context API로 시작하고, 필요하면 Redux나 Zustand로 전환할 수 있어요. MongoDB 스키마 설계도 같이 해야 할 것 같아요.",
          minutesAgo: 60,
        },
        {
          senderIndex: 30, // designer1 (KR) - users[30] = designer1 = KR
          content:
            "디자인 작업도 필요하면 언제든 말씀해주세요. UI 컴포넌트 디자인부터 시작하면 될 것 같아요.",
          minutesAgo: 40,
        },
        {
          senderIndex: 2, // dev3 (JP) - users[2] = dev3 = JP
          content:
            "バックエンド開発も手伝えます。Node.jsとMongoDBの経験があります。",
          minutesAgo: 20,
        },
      ],
    },
    // 프로젝트 4: 프로젝트 관리 플랫폼
    {
      projectIndex: 4,
      messages: [
        {
          senderIndex: 45, // creator (기획자1, KR)
          content:
            "Notion과 Jira를 참고한 협업 도구를 만들려고 합니다. 기획과 개발 모두 필요해요!",
          minutesAgo: 300,
        },
        {
          senderIndex: 3, // dev4 (US)
          content:
            "I can participate as a frontend developer. I have experience using Vue.js and Spring.",
          minutesAgo: 270,
        },
        {
          senderIndex: 45, // KR
          content:
            "좋아요! 백엔드는 어떤 스택으로 할지 논의가 필요할 것 같아요. REST API와 실시간 알림 기능도 중요할 것 같아서요.",
          minutesAgo: 240,
        },
        {
          senderIndex: 46, // planner2 (US)
          content:
            "I've written the initial plan document. I've structured it around kanban board, task management, and comment features. Please take a look.",
          minutesAgo: 210,
        },
        {
          senderIndex: 45, // KR
          content:
            "네, 확인해볼게요! 사용자 인증과 권한 관리 부분도 추가로 논의해야 할 것 같아요.",
          minutesAgo: 180,
        },
        {
          senderIndex: 47, // planner3 (JP)
          content:
            "ユーザーストーリーと要件定義も作成しました。確認していただけますか？",
          minutesAgo: 150,
        },
      ],
    },
  ];

  for (const conversation of chatConversationsDetailed) {
    const project = projects[conversation.projectIndex];
    if (!project) continue;

    // 채팅방 조회 또는 생성
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { projectId: project.id },
    });

    if (!chatRoom) {
      chatRoom = await prisma.chatRoom.create({
        data: { projectId: project.id },
      });
    }

    // 메시지를 시간순으로 정렬하여 생성 (가장 오래된 것부터)
    const sortedMessages = [...conversation.messages].sort(
      (a, b) => b.minutesAgo - a.minutesAgo
    );

    for (const msg of sortedMessages) {
      const now = new Date();
      const createdAt = new Date(now.getTime() - msg.minutesAgo * 60 * 1000);
      const sender = users[msg.senderIndex];

      // sender가 존재하지 않으면 건너뛰기
      if (!sender) {
        console.warn(
          `⚠️  Sender at index ${msg.senderIndex} not found, skipping message`
        );
        continue;
      }

      // chatRoom이 존재하지 않으면 건너뛰기
      if (!chatRoom) {
        console.warn(
          `⚠️  ChatRoom for project ${project.id} not found, skipping message`
        );
        continue;
      }

      const senderId = sender.id;

      // 보낸 사람의 국가에 따라 sourceLang 자동 결정
      // 채팅 서비스의 translateMessageForUser가 실시간으로 번역하므로,
      // seed에서는 원문과 sourceLang만 저장하고 targetLang/translatedContent는 null로 설정
      let sourceLang = "en"; // 기본값
      if (sender.country) {
        const countryLangMap: Record<string, string> = {
          KR: "ko",
          US: "en",
          JP: "ja",
        };
        sourceLang = countryLangMap[sender.country] || "en";
      }

      await prisma.chatMessage.create({
        data: {
          roomId: chatRoom.id,
          senderId,
          content: msg.content,
          sourceLang,
          targetLang: null, // 실시간 번역 시스템이 각 사용자별로 동적으로 생성
          translatedContent: null, // 실시간 번역 시스템이 각 사용자별로 동적으로 생성
          createdAt,
        } as any, // Prisma 타입 오류 방지
      });
    }
  }

  console.log("✅ 채팅방 및 메시지 생성 완료");

  console.log("🎉 Seed 스크립트 완료!");
  console.log("\n📝 테스트 계정:");
  console.log("  - 이메일: dev1@example.com ~ planner10@example.com");
  console.log("  - 비밀번호: password123");
  console.log(
    `  - 총 ${users.length}명의 사용자 생성됨 (개발자 30명, 디자이너 15명, 기획자 10명)`
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed 스크립트 실행 중 오류:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
