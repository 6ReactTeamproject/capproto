// 채팅 서비스 - 채팅방 및 메시지 관리, 더미 번역 기능
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";

@Injectable()
export class ChatService {
  private chatGateway: any = null;

  constructor(private prisma: PrismaService) {}

  // ChatGateway 참조 설정 (순환 참조 방지)
  setChatGateway(gateway: any) {
    this.chatGateway = gateway;
  }

  // 국가 코드를 언어 코드로 변환
  private countryToLanguage(country: string | null | undefined): string {
    if (!country) return "en"; // 기본값은 영어
    const countryLangMap: Record<string, string> = {
      KR: "ko",
      US: "en",
      JP: "ja",
    };
    return countryLangMap[country] || "en";
  }

  // 사용자가 프로젝트 참여자인지 확인
  async checkProjectMember(
    projectId: string,
    userId: string
  ): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자는 항상 참여자
    if (project.creatorId === userId) {
      return true;
    }

    // 수락된 참여 신청이 있는지 확인
    const acceptedApplication = await this.prisma.projectApplication.findFirst({
      where: {
        projectId,
        userId,
        status: "ACCEPTED",
      },
    });

    return !!acceptedApplication;
  }

  // 프로젝트 채팅방 조회 또는 생성
  async getOrCreateChatRoom(projectId: string, userId?: string) {
    // userId가 제공된 경우 참여자 확인
    if (userId) {
      const isMember = await this.checkProjectMember(projectId, userId);
      if (!isMember) {
        throw new ForbiddenException(
          "프로젝트 참여자만 채팅방에 접근할 수 있습니다."
        );
      }
    }
    let chatRoom = await this.prisma.chatRoom.findUnique({
      where: { projectId },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                country: true,
              } as any,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!chatRoom) {
      chatRoom = await this.prisma.chatRoom.create({
        data: { projectId },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  nickname: true,
                  country: true,
                } as any,
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    // userId가 제공된 경우, 각 메시지를 현재 사용자의 언어로 번역
    if (userId && chatRoom.messages) {
      const translatedMessages = await Promise.all(
        chatRoom.messages.map((msg) =>
          this.translateMessageForUser(msg, userId)
        )
      );
      return {
        ...chatRoom,
        messages: translatedMessages,
      };
    }

    return chatRoom;
  }

  // 개인 채팅방 조회 또는 생성
  async getOrCreateDirectChatRoom(userId1: string, userId2: string) {
    // 자기 자신과의 채팅은 불가
    if (userId1 === userId2) {
      throw new ForbiddenException("자기 자신과는 채팅할 수 없습니다.");
    }

    // 두 사용자 ID를 정렬하여 중복 방지
    const [sortedId1, sortedId2] = [userId1, userId2].sort();

    // 기존 채팅방 찾기
    let chatRoom = await this.prisma.chatRoom.findFirst({
      where: {
        userId1: sortedId1,
        userId2: sortedId2,
        projectId: null,
      } as any,
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                country: true,
              } as any,
            },
          },
          orderBy: { createdAt: "asc" },
        },
        user1: {
          select: {
            id: true,
            nickname: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
          },
        },
      } as any,
    });

    // 채팅방이 없으면 생성
    if (!chatRoom) {
      chatRoom = await this.prisma.chatRoom.create({
        data: {
          userId1: sortedId1,
          userId2: sortedId2,
        } as any,
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  nickname: true,
                  country: true,
                } as any,
              },
            },
            orderBy: { createdAt: "asc" },
          },
          user1: {
            select: {
              id: true,
              nickname: true,
            },
          },
          user2: {
            select: {
              id: true,
              nickname: true,
            },
          },
        } as any,
      });
    }

    // 각 메시지를 현재 사용자(userId1)의 언어로 번역
    if (chatRoom.messages && chatRoom.messages.length > 0) {
      const translatedMessages = await Promise.all(
        chatRoom.messages.map((msg) =>
          this.translateMessageForUser(msg, userId1)
        )
      );
      return {
        ...chatRoom,
        messages: translatedMessages,
      };
    }

    return {
      ...chatRoom,
      messages: chatRoom.messages || [],
    };
  }

  // 사용자의 모든 개인 채팅방 목록 조회
  async getDirectChatRooms(userId: string) {
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        projectId: null,
        OR: [{ userId1: userId }, { userId2: userId }],
      } as any,
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      } as any,
      orderBy: { updatedAt: "desc" },
    });

    // 각 채팅방의 마지막 메시지를 현재 사용자의 언어로 번역
    const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
    const translatedChats = await Promise.all(
      chatRooms.map(async (room: any) => {
        const otherUser =
          (room.userId1 as string) === userId ? room.user2 : room.user1;
        const isSystemChat =
          otherUser?.id === SYSTEM_USER_ID ||
          (room.userId1 as string) === SYSTEM_USER_ID ||
          (room.userId2 as string) === SYSTEM_USER_ID;

        // 시스템 채팅방인 경우 시스템 사용자 정보 생성
        const finalOtherUser = isSystemChat
          ? {
              id: SYSTEM_USER_ID,
              nickname: "시스템",
            }
          : otherUser;

        let lastMessage = room.messages[0] || null;

        // 마지막 메시지가 있으면 현재 사용자의 언어로 번역
        if (lastMessage) {
          const translated = await this.translateMessageForUser(
            lastMessage,
            userId
          );
          lastMessage = {
            ...lastMessage,
            content: translated.translatedContent || translated.content,
          };
        }

        return {
          id: room.id,
          otherUser: finalOtherUser,
          lastMessage,
          updatedAt: room.updatedAt,
          isSystemChat, // 시스템 채팅방 여부 표시
        };
      })
    );

    return translatedChats;
  }

  // 메시지 저장
  async createMessage(roomId: string, senderId: string, content: string) {
    // 시스템 사용자 ID 처리
    const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000";
    let sourceLang = "ko"; // 기본값

    // 보낸 사람의 국가에서 언어 자동 결정 (시스템 사용자가 아닌 경우)
    if (senderId !== SYSTEM_USER_ID) {
      const sender = await this.prisma.user.findUnique({
        where: { id: senderId },
        select: { country: true } as any,
      });
      sourceLang = this.countryToLanguage((sender as any)?.country);
    } else {
      // 시스템 메시지의 경우 메시지 내용에서 언어 감지 시도
      // JSON 파싱하여 메시지 내용 확인
      try {
        const parsed = JSON.parse(content);
        if (parsed.message) {
          // 메시지 내용이 한국어, 영어, 일본어 중 어느 것인지 간단히 판단
          const msg = parsed.message;
          if (/[가-힣]/.test(msg)) sourceLang = "ko";
          else if (/[ひらがなカタカナ一-龯]/.test(msg)) sourceLang = "ja";
          else sourceLang = "en";
        }
      } catch {
        // JSON 파싱 실패 시 기본값 사용
        sourceLang = "ko";
      }
    }

    // 메시지는 원문으로만 저장 (각 수신자에게는 개별적으로 번역하여 전송)
    // targetLang과 translatedContent는 스키마 기본값 사용
    const message = await this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content,
        sourceLang,
        // targetLang과 translatedContent는 스키마 기본값 사용
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
            country: true,
          } as any,
        },
      },
    });

    return message;
  }

  // 메시지를 특정 언어로 번역 (각 수신자에게 전송할 때 사용)
  async translateMessageForUser(message: any, targetUserId: string) {
    // 수신자의 국가 확인
    const recipient = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { country: true } as any,
    });
    const targetLang = this.countryToLanguage((recipient as any)?.country);

    // 메시지 내용을 분석해서 실제 언어 감지 (보낸 사람의 국적과 무관)
    const detectSourceLang = (text: string): string => {
      // 한국어 체크
      if (/[가-힣]/.test(text)) return "ko";
      // 일본어 체크 (히라가나, 카타카나, 한자)
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return "ja";
      // 기본값은 영어
      return "en";
    };

    // 메시지 내용에서 실제 언어 감지
    const actualSourceLang = detectSourceLang(message.content);

    // 같은 언어면 번역 불필요 - 원문 그대로 표시
    if (actualSourceLang === targetLang) {
      return {
        ...message,
        translatedContent: message.content,
        targetLang,
        sourceLang: actualSourceLang,
      };
    }

    // 다른 언어면 번역 수행
    const translatedContent = this.translateDummy(
      message.content,
      actualSourceLang, // 실제 메시지 언어 사용
      targetLang
    );

    return {
      ...message,
      translatedContent: translatedContent || message.content, // 번역 실패 시 원문 사용
      targetLang,
      sourceLang: actualSourceLang,
    };
  }

  // 더미 번역 함수 - 실제 번역 API로 교체 예정
  private translateDummy(
    content: string,
    sourceLang: string,
    targetLang: string
  ): string {
    // TODO: 실제 번역 API 연동 예정
    // 예: Google Translate API, DeepL API 등

    // 더미 번역 사전 (한국어-영어-일본어 간 모든 번역 쌍)
    // seed 파일의 모든 채팅 메시지 포함
    const translations: Record<string, Record<string, string>> = {
      // 한국어 -> 영어
      "ko-en": {
        // seed 파일의 한국어 메시지들
        "안녕하세요! React와 Node.js를 사용해본 경험이 있어서 참여하고 싶어요. 어떤 기능부터 시작할 예정인가요?":
          "Hello! I have experience with React and Node.js, so I'd like to participate. What features are you planning to start with?",
        "디자이너로 참여 가능할까요? Figma로 UI 디자인 먼저 진행하면 좋을 것 같아요.":
          "Can I participate as a designer? I think it would be good to proceed with UI design first using Figma.",
        "모바일 앱 디자인 프로젝트 시작합니다! Figma로 디자인 시스템부터 구축하려고 해요.":
          "Starting a mobile app design project! I'm planning to build a design system first using Figma.",
        "기획자로 참여할 수 있을까요? 사용자 스토리와 와이어프레임 먼저 정리하면 좋을 것 같아요.":
          "Can I participate as a planner? I think it would be good to organize user stories and wireframes first.",
        "네, 좋아요! 와이어프레임이 나오면 디자인 작업도 수월할 것 같아요. 디자인 컨셉도 같이 논의해봐요.":
          "Yes, sounds good! Once the wireframes are ready, the design work should be easier. Let's also discuss the design concept together.",
        "좋습니다! 애니메이션 작업도 함께 진행하면 더 완성도 높은 결과물이 나올 것 같아요.":
          "Great! If we work on animations together, I think we'll get a more polished result.",
        "React + Node.js + MongoDB 스택으로 풀스택 프로젝트 진행합니다. 실시간 기능도 포함할 예정이에요.":
          "Proceeding with a full-stack project using React + Node.js + MongoDB. I'm also planning to include real-time features.",
        "일단 Context API로 시작하고, 필요하면 Redux나 Zustand로 전환할 수 있어요. MongoDB 스키마 설계도 같이 해야 할 것 같아요.":
          "Let's start with Context API, and we can switch to Redux or Zustand if needed. I think we should also design the MongoDB schema together.",
        "디자인 작업도 필요하면 언제든 말씀해주세요. UI 컴포넌트 디자인부터 시작하면 될 것 같아요.":
          "Please let me know anytime if design work is needed. I think we can start with UI component design.",
        "Notion과 Jira를 참고한 협업 도구를 만들려고 합니다. 기획과 개발 모두 필요해요!":
          "I'm planning to create a collaboration tool inspired by Notion and Jira. We need both planning and development!",
        "좋아요! 백엔드는 어떤 스택으로 할지 논의가 필요할 것 같아요. REST API와 실시간 알림 기능도 중요할 것 같아서요.":
          "Good! I think we need to discuss what stack to use for the backend. REST API and real-time notification features seem important too.",
        "네, 확인해볼게요! 사용자 인증과 권한 관리 부분도 추가로 논의해야 할 것 같아요.":
          "Yes, I'll check it out! I think we also need to discuss user authentication and permission management.",
        "NestJS에 관심이 많아서 참여하고 싶습니다. 백엔드 개발 경험이 있습니다.":
          "I'm very interested in NestJS and would like to participate. I have backend development experience.",
        "안녕하세요!": "Hello!",
        안녕하세요: "Hello",
        네: "Yes",
        좋아요: "Good",
        좋습니다: "Great",
        감사합니다: "Thank you",
        프로젝트: "project",
        "참여하고 싶어요": "I would like to participate",
        "참여 가능할까요": "Can I participate?",
        환영합니다: "Welcome",
        경험이: "experience",
        어떤: "what",
        기능: "feature",
        시작할: "start",
        예정: "planning",
        인가요: "is it",
        인증: "authentication",
        시스템: "system",
        대시보드: "dashboard",
        구현: "implement",
        디자이너로: "as a designer",
        디자인: "design",
        먼저: "first",
        진행하면: "proceed",
        개발도: "development also",
        수월할: "easier",
        "디자인 시스템": "design system",
        정리하면: "organize",
        좋겠습니다: "would be good",
        NestJS: "NestJS",
        Prisma: "Prisma",
        백엔드: "backend",
        서버: "server",
        도메인: "domain",
        시작하나요: "start with",
        유저: "user",
        관리: "management",
        스키마: "schema",
        설계: "design",
        논의하면: "discuss",
        "것 같아요": "I think",
        알겠습니다: "I understand",
        모바일: "mobile",
        앱: "app",
        시작합니다: "starting",
        구축하려고: "build",
        기획자분도: "planner too",
        사용자: "user",
        플로우: "flow",
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
        React: "React",
        "Node.js": "Node.js",
        MongoDB: "MongoDB",
        스택으로: "with stack",
        풀스택: "fullstack",
        "프로젝트 진행합니다": "proceeding with project",
        실시간: "real-time",
        기능도: "feature also",
        포함할: "include",
        예정이에요: "planning to",
        "도와드릴 수": "can help",
        프론트엔드: "frontend",
        작업: "work",
        "상태 관리": "state management",
        라이브러리: "library",
        사용해야: "should use",
        하나요: "should I",
        일단: "first",
        "Context API": "Context API",
        시작하고: "start with",
        필요하면: "if needed",
        "전환할 수": "can switch",
        있어요: "there is",
        설계도: "design also",
        같이: "together",
        "해야 할": "should",
        "디자인 작업도": "design work also",
        언제든: "anytime",
        말씀해주세요: "please let me know",
        UI: "UI",
        컴포넌트: "component",
        시작하면: "start with",
        "될 것": "will be",
        같아요: "I think",
        있습니다: "have",
      },
      // 영어 -> 한국어
      "en-ko": {
        // seed 파일의 영어 메시지들
        "Hello! Thank you for your interest in this project. I'd like to create a modern web app using React and Next.js.":
          "안녕하세요! 이 프로젝트에 관심을 가져주셔서 감사합니다. React와 Next.js를 사용하여 현대적인 웹 앱을 만들고 싶습니다.",
        "Great! I'm planning to implement the authentication system and main dashboard first. I'll also ensure type safety with TypeScript.":
          "좋아요! 먼저 인증 시스템과 메인 대시보드를 구현할 계획입니다. TypeScript로 타입 안정성도 확보하겠습니다.",
        "Yes, welcome! If the design comes out first, development will be easier. It would be good to organize the design system together as well.":
          "네, 환영합니다! 디자인이 먼저 나오면 개발이 더 쉬울 것 같아요. 디자인 시스템도 함께 정리하면 좋을 것 같습니다.",
        "I have experience with Prisma and would like to participate! What domain should we start with?":
          "Prisma 경험이 있어서 참여하고 싶습니다! 어떤 도메인부터 시작하면 될까요?",
        "Understood. I'll also think about the JWT authentication structure and middleware configuration together.":
          "알겠습니다. JWT 인증 구조와 미들웨어 구성도 함께 고민해보겠습니다.",
        "It would be good to have a planner as well. I think we'll need to design the user flow too.":
          "기획자도 있으면 좋을 것 같아요. 사용자 플로우도 설계해야 할 것 같아서요.",
        "I can help with the React frontend work. What state management library should we use?":
          "React 프론트엔드 작업을 도와드릴 수 있습니다. 어떤 상태 관리 라이브러리를 사용해야 할까요?",
        "I can participate as a frontend developer. I have experience using Vue.js and Spring.":
          "프론트엔드 개발자로 참여할 수 있습니다. Vue.js와 Spring 사용 경험이 있습니다.",
        "I've written the initial plan document. I've structured it around kanban board, task management, and comment features. Please take a look.":
          "초기 기획 문서를 작성했습니다. 칸반 보드, 작업 관리, 댓글 기능을 중심으로 구성했습니다. 확인해주세요.",
        Hello: "안녕하세요",
        Yes: "네",
        Good: "좋아요",
        Great: "좋습니다",
        "Thank you": "감사합니다",
        project: "프로젝트",
        "I would like to participate": "참여하고 싶어요",
        "Can I participate?": "참여 가능할까요?",
        Welcome: "환영합니다",
        what: "어떤",
        feature: "기능",
        start: "시작할",
        planning: "예정",
        "is it": "인가요",
        authentication: "인증",
        system: "시스템",
        dashboard: "대시보드",
        implement: "구현",
        "as a designer": "디자이너로",
        first: "먼저",
        proceed: "진행하면",
        "development also": "개발도",
        easier: "수월할",
        "design system": "디자인 시스템",
        organize: "정리하면",
        "would be good": "좋겠습니다",
        NestJS: "NestJS",
        Prisma: "Prisma",
        backend: "백엔드",
        server: "서버",
        domain: "도메인",
        "start with": "시작하나요",
        user: "유저",
        management: "관리",
        schema: "스키마",
        discuss: "논의하면",
        "I think": "것 같아요",
        "I understand": "알겠습니다",
        mobile: "모바일",
        app: "앱",
        starting: "시작합니다",
        build: "구축하려고",
        "planner too": "기획자분도",
        flow: "플로우",
        need: "필요할",
        "can participate": "참여할 수",
        "is it possible": "있을까요",
        story: "스토리",
        wireframe: "와이어프레임",
        "comes out": "나오면",
        "work also": "작업도",
        concept: "컨셉",
        animation: "애니메이션",
        interaction: "인터랙션",
        "can help": "도와드릴 수",
        React: "React",
        "Node.js": "Node.js",
        MongoDB: "MongoDB",
        "with stack": "스택으로",
        fullstack: "풀스택",
        "proceeding with project": "프로젝트 진행합니다",
        "real-time": "실시간",
        "feature also": "기능도",
        include: "포함할",
        "planning to": "예정이에요",
        frontend: "프론트엔드",
        work: "작업",
        "state management": "상태 관리",
        library: "라이브러리",
        "should use": "사용해야",
        "should I": "하나요",
        "Context API": "Context API",
        "if needed": "필요하면",
        "can switch": "전환할 수",
        "there is": "있어요",
        "design also": "설계도",
        together: "같이",
        should: "해야 할",
        "design work also": "디자인 작업도",
        anytime: "언제든",
        "please let me know": "말씀해주세요",
        UI: "UI",
        component: "컴포넌트",
        "will be": "될 것",
        have: "있습니다",
      },
      // 한국어 -> 일본어
      "ko-ja": {
        // seed 파일의 한국어 메시지들
        "안녕하세요! React와 Node.js를 사용해본 경험이 있어서 참여하고 싶어요. 어떤 기능부터 시작할 예정인가요?":
          "こんにちは！ReactとNode.jsの経験があるので参加したいです。どの機能から始める予定ですか？",
        "디자이너로 참여 가능할까요? Figma로 UI 디자인 먼저 진행하면 좋을 것 같아요.":
          "デザイナーとして参加できますか？FigmaでUIデザインを先に進めれば良いと思います。",
        "모바일 앱 디자인 프로젝트 시작합니다! Figma로 디자인 시스템부터 구축하려고 해요.":
          "モバイルアプリデザインプロジェクトを開始します！Figmaでデザインシステムから構築しようと思います。",
        "기획자로 참여할 수 있을까요? 사용자 스토리와 와이어프레임 먼저 정리하면 좋을 것 같아요.":
          "プランナーとして参加できますか？ユーザーストーリーとワイヤーフレームを先に整理すれば良いと思います。",
        "네, 좋아요! 와이어프레임이 나오면 디자인 작업도 수월할 것 같아요. 디자인 컨셉도 같이 논의해봐요.":
          "はい、良いですね！ワイヤーフレームが出ればデザイン作業も容易になると思います。デザインコンセプトも一緒に議論しましょう。",
        "좋습니다! 애니메이션 작업도 함께 진행하면 더 완성도 높은 결과물이 나올 것 같아요.":
          "良いですね！アニメーション作業も一緒に進めれば、より完成度の高い結果物が出ると思います。",
        "React + Node.js + MongoDB 스택으로 풀스택 프로젝트 진행합니다. 실시간 기능도 포함할 예정이에요.":
          "React + Node.js + MongoDBスタックでフルスタックプロジェクトを進めます。リアルタイム機能も含める予定です。",
        "일단 Context API로 시작하고, 필요하면 Redux나 Zustand로 전환할 수 있어요. MongoDB 스키마 설계도 같이 해야 할 것 같아요.":
          "まずContext APIで始めて、必要ならReduxやZustandに切り替えることができます。MongoDBスキーマ設計も一緒にする必要があると思います。",
        "디자인 작업도 필요하면 언제든 말씀해주세요. UI 컴포넌트 디자인부터 시작하면 될 것 같아요.":
          "デザイン作業も必要ならいつでもお知らせください。UIコンポーネントデザインから始めれば良いと思います。",
        "Notion과 Jira를 참고한 협업 도구를 만들려고 합니다. 기획과 개발 모두 필요해요!":
          "NotionとJiraを参考にしたコラボレーションツールを作ろうと思います。企画と開発の両方が必要です！",
        "좋아요! 백엔드는 어떤 스택으로 할지 논의가 필요할 것 같아요. REST API와 실시간 알림 기능도 중요할 것 같아서요.":
          "良いですね！バックエンドはどのスタックにするか議論が必要だと思います。REST APIとリアルタイム通知機能も重要だと思います。",
        "네, 확인해볼게요! 사용자 인증과 권한 관리 부분도 추가로 논의해야 할 것 같아요.":
          "はい、確認してみます！ユーザー認証と権限管理の部分も追加で議論する必要があると思います。",
        "NestJS에 관심이 많아서 참여하고 싶습니다. 백엔드 개발 경험이 있습니다.":
          "NestJSに興味があるので参加したいです。バックエンド開発の経験があります。",
        안녕하세요: "こんにちは",
        네: "はい",
        좋아요: "良い",
        좋습니다: "素晴らしい",
        감사합니다: "ありがとうございます",
        프로젝트: "プロジェクト",
        "참여하고 싶어요": "参加したいです",
        "참여 가능할까요": "参加できますか？",
        환영합니다: "ようこそ",
        경험이: "経験",
        어떤: "どの",
        기능: "機能",
        시작할: "開始",
        예정: "予定",
        인가요: "ですか",
        인증: "認証",
        시스템: "システム",
        대시보드: "ダッシュボード",
        구현: "実装",
        디자이너로: "デザイナーとして",
        디자인: "デザイン",
        먼저: "まず",
        진행하면: "進めれば",
        개발도: "開発も",
        수월할: "容易",
        "디자인 시스템": "デザインシステム",
        정리하면: "整理すれば",
        좋겠습니다: "良いでしょう",
        NestJS: "NestJS",
        Prisma: "Prisma",
        백엔드: "バックエンド",
        서버: "サーバー",
        도메인: "ドメイン",
        시작하나요: "始めますか",
        유저: "ユーザー",
        관리: "管理",
        스키마: "スキーマ",
        설계: "設計",
        논의하면: "議論すれば",
        "것 같아요": "と思います",
        알겠습니다: "わかりました",
        모바일: "モバイル",
        앱: "アプリ",
        시작합니다: "始めます",
        구축하려고: "構築しよう",
        기획자분도: "プランナーも",
        사용자: "ユーザー",
        플로우: "フロー",
        필요할: "必要",
        "참여할 수": "参加できる",
        있을까요: "可能ですか",
        스토리: "ストーリー",
        와이어프레임: "ワイヤーフレーム",
        나오면: "出れば",
        작업도: "作業も",
        컨셉: "コンセプト",
        애니메이션: "アニメーション",
        인터랙션: "インタラクション",
        "담당할 수": "担当できる",
        React: "React",
        "Node.js": "Node.js",
        MongoDB: "MongoDB",
        스택으로: "スタックで",
        풀스택: "フルスタック",
        "프로젝트 진행합니다": "プロジェクトを進めます",
        실시간: "リアルタイム",
        기능도: "機能も",
        포함할: "含める",
        예정이에요: "予定です",
        "도와드릴 수": "手伝えます",
        프론트엔드: "フロントエンド",
        작업: "作業",
        "상태 관리": "状態管理",
        라이브러리: "ライブラリ",
        사용해야: "使用すべき",
        하나요: "ですか",
        일단: "まず",
        "Context API": "Context API",
        시작하고: "始めて",
        필요하면: "必要なら",
        "전환할 수": "切り替えられる",
        있어요: "あります",
        설계도: "設計も",
        같이: "一緒に",
        "해야 할": "すべき",
        "디자인 작업도": "デザイン作業も",
        언제든: "いつでも",
        말씀해주세요: "お知らせください",
        UI: "UI",
        컴포넌트: "コンポーネント",
        부터: "から",
        시작하면: "始めれば",
        "될 것": "なるでしょう",
        같아요: "と思います",
        있습니다: "あります",
      },
      // 일본어 -> 한국어
      "ja-ko": {
        // seed 파일의 일본어 메시지들
        "こんにちは！ReactとTypeScriptの経験があります。フロントエンド開発に参加できますか？":
          "안녕하세요! React와 TypeScript 경험이 있습니다. 프론트엔드 개발에 참여할 수 있을까요?",
        "NestJSとPrismaを使ったバックエンドAPIサーバーのプロジェクトです。RESTful APIとWebSocketの両方をサポートする予定です。":
          "NestJS와 Prisma를 사용한 백엔드 API 서버 프로젝트입니다. RESTful API와 WebSocket 모두 지원할 예정입니다.",
        "ユーザー認証とプロジェクト管理APIから始める予定です。PostgreSQLスキーマの設計も一緒に議論できればと思います。":
          "사용자 인증과 프로젝트 관리 API부터 시작할 예정입니다. PostgreSQL 스키마 설계도 함께 논의할 수 있으면 좋겠습니다.",
        "アニメーションとインタラクションも担当できます。After Effectsでプロトタイプも作成できます。":
          "애니메이션과 인터랙션도 담당할 수 있습니다. After Effects로 프로토타입도 만들 수 있습니다.",
        "バックエンド開発も手伝えます。Node.jsとMongoDBの経験があります。":
          "백엔드 개발도 도와드릴 수 있습니다. Node.js와 MongoDB 경험이 있습니다.",
        "ユーザーストーリーと要件定義も作成しました。確認していただけますか？":
          "사용자 스토리와 요구사항 정의도 작성했습니다. 확인해주실 수 있을까요?",
        "はい、確認してみます！ユーザー認証と権限管理の部分も追加で議論する必要があると思います。":
          "네, 확인해볼게요! 사용자 인증과 권한 관리 부분도 추가로 논의해야 할 것 같아요.",
        こんにちは: "안녕하세요",
        はい: "네",
        良い: "좋아요",
        素晴らしい: "좋습니다",
        ありがとうございます: "감사합니다",
        プロジェクト: "프로젝트",
        参加したいです: "참여하고 싶어요",
        "参加できますか？": "참여 가능할까요?",
        ようこそ: "환영합니다",
        経験: "경험이",
        どの: "어떤",
        機能: "기능",
        開始: "시작할",
        予定: "예정",
        ですか: "인가요",
        認証: "인증",
        システム: "시스템",
        ダッシュボード: "대시보드",
        実装: "구현",
        デザイナーとして: "디자이너로",
        デザイン: "디자인",
        まず: "먼저",
        進めれば: "진행하면",
        開発も: "개발도",
        容易: "수월할",
        デザインシステム: "디자인 시스템",
        整理すれば: "정리하면",
        良いでしょう: "좋겠습니다",
        NestJS: "NestJS",
        Prisma: "Prisma",
        バックエンド: "백엔드",
        サーバー: "서버",
        ドメイン: "도메인",
        始めますか: "시작하나요",
        ユーザー: "유저",
        管理: "관리",
        スキーマ: "스키마",
        設計: "설계",
        議論すれば: "논의하면",
        と思います: "것 같아요",
        わかりました: "알겠습니다",
        モバイル: "모바일",
        アプリ: "앱",
        始めます: "시작합니다",
        構築しよう: "구축하려고",
        プランナーも: "기획자분도",
        フロー: "플로우",
        必要: "필요할",
        参加できる: "참여할 수",
        可能ですか: "있을까요",
        ストーリー: "스토리",
        ワイヤーフレーム: "와이어프레임",
        出れば: "나오면",
        作業も: "작업도",
        コンセプト: "컨셉",
        アニメーション: "애니메이션",
        インタラクション: "인터랙션",
        担当できる: "담당할 수",
        React: "React",
        "Node.js": "Node.js",
        MongoDB: "MongoDB",
        スタックで: "스택으로",
        フルスタック: "풀스택",
        プロジェクトを進めます: "프로젝트 진행합니다",
        リアルタイム: "실시간",
        機能も: "기능도",
        含める: "포함할",
        予定です: "예정이에요",
        手伝えます: "도와드릴 수",
        フロントエンド: "프론트엔드",
        作業: "작업",
        状態管理: "상태 관리",
        ライブラリ: "라이브러리",
        使用すべき: "사용해야",
        "Context API": "Context API",
        始めて: "시작하고",
        必要なら: "필요하면",
        切り替えられる: "전환할 수",
        あります: "있어요",
        設計も: "설계도",
        一緒に: "같이",
        すべき: "해야 할",
        デザイン作業も: "디자인 작업도",
        いつでも: "언제든",
        お知らせください: "말씀해주세요",
        UI: "UI",
        コンポーネント: "컴포넌트",
        から: "부터",
        始めれば: "시작하면",
        なるでしょう: "될 것",
      },
      // 영어 -> 일본어
      "en-ja": {
        // seed 파일의 영어 메시지들
        "Hello! Thank you for your interest in this project. I'd like to create a modern web app using React and Next.js.":
          "こんにちは！このプロジェクトに興味を持っていただきありがとうございます。ReactとNext.jsを使用してモダンなウェブアプリを作成したいと思います。",
        "Great! I'm planning to implement the authentication system and main dashboard first. I'll also ensure type safety with TypeScript.":
          "素晴らしい！まず認証システムとメインダッシュボードを実装する予定です。TypeScriptで型安全性も確保します。",
        "Yes, welcome! If the design comes out first, development will be easier. It would be good to organize the design system together as well.":
          "はい、ようこそ！デザインが先に出れば、開発が容易になります。デザインシステムも一緒に整理できれば良いと思います。",
        "I have experience with Prisma and would like to participate! What domain should we start with?":
          "Prismaの経験があるので参加したいです！どのドメインから始めれば良いですか？",
        "Understood. I'll also think about the JWT authentication structure and middleware configuration together.":
          "了解しました。JWT認証構造とミドルウェア設定も一緒に考えます。",
        "It would be good to have a planner as well. I think we'll need to design the user flow too.":
          "プランナーもいれば良いと思います。ユーザーフローも設計する必要があると思います。",
        "I can help with the React frontend work. What state management library should we use?":
          "Reactフロントエンド作業を手伝えます。どの状態管理ライブラリを使用すべきですか？",
        "I can participate as a frontend developer. I have experience using Vue.js and Spring.":
          "フロントエンド開発者として参加できます。Vue.jsとSpringの使用経験があります。",
        "I've written the initial plan document. I've structured it around kanban board, task management, and comment features. Please take a look.":
          "初期計画文書を作成しました。カンバンボード、タスク管理、コメント機能を中心に構成しました。ご確認ください。",
        Hello: "こんにちは",
        Yes: "はい",
        Good: "良い",
        Great: "素晴らしい",
        "Thank you": "ありがとうございます",
        project: "プロジェクト",
        "I would like to participate": "参加したいです",
        "Can I participate?": "参加できますか？",
        Welcome: "ようこそ",
        experience: "経験",
        what: "どの",
        feature: "機能",
        start: "開始",
        planning: "予定",
        "is it": "ですか",
        authentication: "認証",
        system: "システム",
        dashboard: "ダッシュボード",
        implement: "実装",
        "as a designer": "デザイナーとして",
        design: "デザイン",
        first: "まず",
        proceed: "進めれば",
        "development also": "開発も",
        easier: "容易",
        "design system": "デザインシステム",
        organize: "整理すれば",
        "would be good": "良いでしょう",
        NestJS: "NestJS",
        Prisma: "Prisma",
        backend: "バックエンド",
        server: "サーバー",
        domain: "ドメイン",
        "start with": "始めますか",
        user: "ユーザー",
        management: "管理",
        schema: "スキーマ",
        discuss: "議論すれば",
        "I think": "と思います",
        "I understand": "わかりました",
        mobile: "モバイル",
        app: "アプリ",
        starting: "始めます",
        build: "構築しよう",
        "planner too": "プランナーも",
        flow: "フロー",
        need: "必要",
        "can participate": "参加できる",
        "is it possible": "可能ですか",
        story: "ストーリー",
        wireframe: "ワイヤーフレーム",
        "comes out": "出れば",
        "work also": "作業も",
        concept: "コンセプト",
        animation: "アニメーション",
        interaction: "インタラクション",
        "can help": "手伝えます",
        React: "React",
        "Node.js": "Node.js",
        MongoDB: "MongoDB",
        "with stack": "スタックで",
        fullstack: "フルスタック",
        "proceeding with project": "プロジェクトを進めます",
        "real-time": "リアルタイム",
        "feature also": "機能も",
        include: "含める",
        "planning to": "予定です",
        frontend: "フロントエンド",
        work: "作業",
        "state management": "状態管理",
        library: "ライブラリ",
        "should use": "使用すべき",
        "should I": "ですか",
        "Context API": "Context API",
        "if needed": "必要なら",
        "can switch": "切り替えられる",
        "there is": "あります",
        "design also": "設計も",
        together: "一緒に",
        should: "すべき",
        "design work also": "デザイン作業も",
        anytime: "いつでも",
        "please let me know": "お知らせください",
        UI: "UI",
        component: "コンポーネント",
        "will be": "なるでしょう",
        have: "あります",
      },
      // 일본어 -> 영어
      "ja-en": {
        // seed 파일의 일본어 메시지들
        "こんにちは！ReactとTypeScriptの経験があります。フロントエンド開発に参加できますか？":
          "Hello! I have experience with React and TypeScript. Can I participate in frontend development?",
        "NestJSとPrismaを使ったバックエンドAPIサーバーのプロジェクトです。RESTful APIとWebSocketの両方をサポートする予定です。":
          "This is a backend API server project using NestJS and Prisma. We plan to support both RESTful API and WebSocket.",
        "ユーザー認証とプロジェクト管理APIから始める予定です。PostgreSQLスキーマの設計も一緒に議論できればと思います。":
          "We plan to start with user authentication and project management APIs. I'd like to discuss the PostgreSQL schema design together as well.",
        "アニメーションとインタラクションも担当できます。After Effectsでプロトタイプも作成できます。":
          "I can also handle animations and interactions. I can create prototypes with After Effects as well.",
        "バックエンド開発も手伝えます。Node.jsとMongoDBの経験があります。":
          "I can also help with backend development. I have experience with Node.js and MongoDB.",
        "ユーザーストーリーと要件定義も作成しました。確認していただけますか？":
          "I've also created user stories and requirements definition. Could you please take a look?",
        こんにちは: "Hello",
        はい: "Yes",
        良い: "Good",
        素晴らしい: "Great",
        ありがとうございます: "Thank you",
        プロジェクト: "project",
        参加したいです: "I would like to participate",
        "参加できますか？": "Can I participate?",
        ようこそ: "Welcome",
        経験: "experience",
        どの: "what",
        機能: "feature",
        開始: "start",
        予定: "planning",
        ですか: "is it",
        認証: "authentication",
        システム: "system",
        ダッシュボード: "dashboard",
        実装: "implement",
        デザイナーとして: "as a designer",
        デザイン: "design",
        まず: "first",
        進めれば: "proceed",
        開発も: "development also",
        容易: "easier",
        デザインシステム: "design system",
        整理すれば: "organize",
        良いでしょう: "would be good",
        NestJS: "NestJS",
        Prisma: "Prisma",
        バックエンド: "backend",
        サーバー: "server",
        ドメイン: "domain",
        始めますか: "start with",
        ユーザー: "user",
        管理: "management",
        スキーマ: "schema",
        設計: "design",
        議論すれば: "discuss",
        と思います: "I think",
        わかりました: "I understand",
        モバイル: "mobile",
        アプリ: "app",
        始めます: "starting",
        構築しよう: "build",
        プランナーも: "planner too",
        フロー: "flow",
        必要: "need",
        参加できる: "can participate",
        可能ですか: "is it possible",
        ストーリー: "story",
        ワイヤーフレーム: "wireframe",
        出れば: "comes out",
        作業も: "work also",
        コンセプト: "concept",
        アニメーション: "animation",
        インタラクション: "interaction",
        担当できる: "can help",
        React: "React",
        "Node.js": "Node.js",
        MongoDB: "MongoDB",
        スタックで: "with stack",
        フルスタック: "fullstack",
        プロジェクトを進めます: "proceeding with project",
        リアルタイム: "real-time",
        機能も: "feature also",
        含める: "include",
        予定です: "planning to",
        手伝えます: "can help",
        フロントエンド: "frontend",
        作業: "work",
        状態管理: "state management",
        ライブラリ: "library",
        使用すべき: "should use",
        "Context API": "Context API",
        始めて: "start with",
        必要なら: "if needed",
        切り替えられる: "can switch",
        あります: "there is",
        設計も: "design also",
        一緒に: "together",
        すべき: "should",
        デザイン作業も: "design work also",
        いつでも: "anytime",
        お知らせください: "please let me know",
        UI: "UI",
        コンポーネント: "컴포넌트",
        始めれば: "start with",
        なるでしょう: "will be",
      },
    };

    // 원문에서 sourceLang 추정 (간단한 휴리스틱)
    const detectSourceLang = (text: string): string => {
      // 한국어 체크
      if (/[가-힣]/.test(text)) return "ko";
      // 일본어 체크 (히라가나, 카타카나, 한자)
      if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) return "ja";
      // 기본값은 영어
      return "en";
    };

    // sourceLang 파라미터가 제공되지 않은 경우 자동 감지
    const detectedSourceLang = sourceLang || detectSourceLang(content);
    const translationKey = `${detectedSourceLang}-${targetLang}`;
    const translationDict = translations[translationKey];

    if (!translationDict) {
      return content;
    }

    // 정확한 매칭 시도 (대소문자 무시)
    const normalizedContent = content.trim();
    if (translationDict[normalizedContent]) {
      return translationDict[normalizedContent];
    }

    // 대소문자 무시 매칭 시도 (영어의 경우)
    if (detectedSourceLang === "en" || targetLang === "en") {
      for (const [key, value] of Object.entries(translationDict)) {
        if (key.toLowerCase() === normalizedContent.toLowerCase()) {
          return value;
        }
      }
    }

    // 부분 매칭 시도 (긴 문장의 경우)
    // 모든 단어를 번역하기 위해 긴 키부터 매칭하여 모든 매칭을 교체
    let translatedContent = normalizedContent;
    const sortedKeys = Object.keys(translationDict).sort(
      (a, b) => b.length - a.length
    );

    // 모든 키를 순회하면서 포함된 모든 매칭을 교체
    for (const key of sortedKeys) {
      if (translatedContent.includes(key)) {
        // 모든 매칭을 교체 (replaceAll 대신 정규식 사용)
        const regex = new RegExp(
          key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          "g"
        );
        translatedContent = translatedContent.replace(
          regex,
          translationDict[key]
        );
      }
      // 대소문자 무시 부분 매칭 (영어의 경우)
      if (detectedSourceLang === "en" || targetLang === "en") {
        const lowerContent = translatedContent.toLowerCase();
        const lowerKey = key.toLowerCase();
        if (lowerContent.includes(lowerKey)) {
          // 대소문자 무시하면서 모든 매칭 교체
          const regex = new RegExp(
            key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            "gi"
          );
          translatedContent = translatedContent.replace(
            regex,
            translationDict[key]
          );
        }
      }
    }

    // 번역이 하나라도 이루어졌으면 번역된 내용 반환, 아니면 원문 반환
    return translatedContent !== normalizedContent
      ? translatedContent
      : content;
  }

  // REST API용 번역 엔드포인트 (테스트용)
  async translate(content: string, sourceLang: string, targetLang: string) {
    // TODO: 실제 번역 API 연동 예정
    const translatedContent = this.translateDummy(
      content,
      sourceLang,
      targetLang
    );
    return { translatedContent };
  }

  // 개인 채팅 알림 전송 (외부 서비스에서 호출)
  async sendDirectNotification(recipientId: string, messageData: any) {
    if (!this.chatGateway) {
      console.error("ChatGateway가 설정되지 않았습니다.");
      return;
    }
    await this.chatGateway.sendDirectNotification(recipientId, messageData);
  }

  // 시스템 메시지용 개인 채팅방 조회 또는 생성 (각 사용자에게 개인적으로 시스템 메시지 전송)
  async getOrCreateSystemChatRoom(userId: string) {
    // 시스템 메시지 전용 채팅방: userId1 = userId, userId2 = null (시스템)
    // userId2를 null로 하면 스키마 제약에 걸리므로, 특별한 시스템 사용자 ID 사용
    const SYSTEM_USER_ID = "00000000-0000-0000-0000-000000000000"; // 시스템 사용자 ID

    // 기존 시스템 채팅방 찾기
    let chatRoom = await this.prisma.chatRoom.findFirst({
      where: {
        OR: [
          { userId1: userId, userId2: SYSTEM_USER_ID },
          { userId1: SYSTEM_USER_ID, userId2: userId },
        ],
        projectId: null,
      } as any,
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
                country: true,
              } as any,
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // 채팅방이 없으면 생성
    if (!chatRoom) {
      // 두 사용자 ID를 정렬하여 중복 방지
      const [sortedId1, sortedId2] = [userId, SYSTEM_USER_ID].sort();

      chatRoom = await this.prisma.chatRoom.create({
        data: {
          userId1: sortedId1,
          userId2: sortedId2,
        } as any,
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  nickname: true,
                  country: true,
                } as any,
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return chatRoom;
  }
}
