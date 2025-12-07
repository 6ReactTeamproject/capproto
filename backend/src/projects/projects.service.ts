// 프로젝트 서비스 - 프로젝트 CRUD 및 추천 기능
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

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

  // 프로젝트 제목과 설명을 사용자 언어로 번역
  private translateProjectText(
    title: string,
    description: string,
    sourceLang: string,
    targetLang: string
  ): { title: string; description: string } {
    // TODO: 실제 번역 API 연동 예정
    // 현재는 더미 번역 사전 사용

    // 프로젝트 제목 및 설명 번역 사전
    const projectTranslations: Record<
      string,
      Record<string, { title: string; description: string }>
    > = {
      "ko-en": {
        "React 기반 웹 애플리케이션": {
          title: "React-based Web Application",
          description:
            "Modern web app development using Next.js and TypeScript",
        },
        "NestJS 백엔드 API 서버": {
          title: "NestJS Backend API Server",
          description: "RESTful API development using PostgreSQL and Prisma",
        },
        "모바일 앱 UI/UX 디자인": {
          title: "Mobile App UI/UX Design",
          description: "Mobile app design project using Figma",
        },
        "풀스택 웹 서비스": {
          title: "Full-stack Web Service",
          description: "Full-stack project using React + Node.js + MongoDB",
        },
        "프로젝트 관리 플랫폼": {
          title: "Project Management Platform",
          description:
            "Collaboration tool development inspired by Notion and Jira",
        },
        "Vue.js 기반 대시보드": {
          title: "Vue.js-based Dashboard",
          description:
            "Admin dashboard development using Vue 3 and Composition API",
        },
        "실시간 채팅 애플리케이션": {
          title: "Real-time Chat Application",
          description: "Real-time messenger development using WebSocket",
        },
        "이커머스 플랫폼 디자인": {
          title: "E-commerce Platform Design",
          description:
            "Online shopping mall UI/UX design and prototype creation",
        },
        "Django 기반 블로그 플랫폼": {
          title: "Django-based Blog Platform",
          description: "Personal blog system developed with Python Django",
        },
        "모바일 게임 UI 디자인": {
          title: "Mobile Game UI Design",
          description: "Interface and character design for mobile games",
        },
        "마이크로서비스 아키텍처 구축": {
          title: "Microservices Architecture Development",
          description:
            "Microservices system development using Docker and Kubernetes",
        },
        "스타트업 제품 기획": {
          title: "Startup Product Planning",
          description:
            "Complete planning and prototype design for a new SaaS service",
        },
        "React Native 모바일 앱": {
          title: "React Native Mobile App",
          description: "Cross-platform mobile application development",
        },
        "AI 기반 추천 시스템": {
          title: "AI-based Recommendation System",
          description:
            "Personalized recommendation engine development using machine learning",
        },
        "브랜드 아이덴티티 디자인": {
          title: "Brand Identity Design",
          description: "Brand logo and visual identity creation for startups",
        },
        "GraphQL API 서버": {
          title: "GraphQL API Server",
          description: "GraphQL backend development using Apollo Server",
        },
        "웹 애니메이션 프로젝트": {
          title: "Web Animation Project",
          description:
            "Interactive web animations using Framer Motion and Lottie",
        },
        "블록체인 기반 NFT 마켓플레이스": {
          title: "Blockchain-based NFT Marketplace",
          description: "NFT trading platform development using Web3 technology",
        },
        "사용자 리서치 및 UX 개선": {
          title: "User Research and UX Improvement",
          description:
            "User experience analysis and improvement proposals for existing services",
        },
        "Flutter 크로스플랫폼 앱": {
          title: "Flutter Cross-platform App",
          description: "iOS/Android native app development using Flutter",
        },
      },
      "en-ko": {
        "React-based Web Application": {
          title: "React 기반 웹 애플리케이션",
          description: "Next.js와 TypeScript를 활용한 모던 웹 앱 개발",
        },
        "NestJS Backend API Server": {
          title: "NestJS 백엔드 API 서버",
          description: "PostgreSQL과 Prisma를 사용한 RESTful API 개발",
        },
        "Mobile App UI/UX Design": {
          title: "모바일 앱 UI/UX 디자인",
          description: "Figma를 활용한 모바일 앱 디자인 프로젝트",
        },
        "Full-stack Web Service": {
          title: "풀스택 웹 서비스",
          description: "React + Node.js + MongoDB 스택의 풀스택 프로젝트",
        },
        "Project Management Platform": {
          title: "프로젝트 관리 플랫폼",
          description: "Notion과 Jira를 활용한 협업 도구 개발",
        },
        "Vue.js-based Dashboard": {
          title: "Vue.js 기반 대시보드",
          description: "Vue 3와 Composition API를 활용한 관리자 대시보드 개발",
        },
        "Real-time Chat Application": {
          title: "실시간 채팅 애플리케이션",
          description: "WebSocket을 활용한 실시간 메신저 개발",
        },
        "E-commerce Platform Design": {
          title: "이커머스 플랫폼 디자인",
          description: "온라인 쇼핑몰 UI/UX 디자인 및 프로토타입 제작",
        },
        "Django-based Blog Platform": {
          title: "Django 기반 블로그 플랫폼",
          description: "Python Django로 개발하는 개인 블로그 시스템",
        },
        "Mobile Game UI Design": {
          title: "모바일 게임 UI 디자인",
          description: "모바일 게임을 위한 인터페이스 및 캐릭터 디자인",
        },
        "Microservices Architecture Development": {
          title: "마이크로서비스 아키텍처 구축",
          description:
            "Docker와 Kubernetes를 활용한 마이크로서비스 시스템 개발",
        },
        "Startup Product Planning": {
          title: "스타트업 제품 기획",
          description: "새로운 SaaS 서비스의 전체 기획 및 프로토타입 설계",
        },
        "React Native Mobile App": {
          title: "React Native 모바일 앱",
          description: "크로스 플랫폼 모바일 애플리케이션 개발",
        },
        "AI-based Recommendation System": {
          title: "AI 기반 추천 시스템",
          description: "머신러닝을 활용한 개인화 추천 엔진 개발",
        },
        "Brand Identity Design": {
          title: "브랜드 아이덴티티 디자인",
          description: "스타트업을 위한 브랜드 로고 및 시각 아이덴티티 제작",
        },
        "GraphQL API Server": {
          title: "GraphQL API 서버",
          description: "Apollo Server를 활용한 GraphQL 백엔드 개발",
        },
        "Web Animation Project": {
          title: "웹 애니메이션 프로젝트",
          description:
            "Framer Motion과 Lottie를 활용한 인터랙티브 웹 애니메이션",
        },
        "Blockchain-based NFT Marketplace": {
          title: "블록체인 기반 NFT 마켓플레이스",
          description: "Web3 기술을 활용한 NFT 거래 플랫폼 개발",
        },
        "User Research and UX Improvement": {
          title: "사용자 리서치 및 UX 개선",
          description: "기존 서비스의 사용자 경험 분석 및 개선안 제시",
        },
        "Flutter Cross-platform App": {
          title: "Flutter 크로스플랫폼 앱",
          description: "Flutter를 활용한 iOS/Android 네이티브 앱 개발",
        },
      },
      "ko-ja": {
        "React 기반 웹 애플리케이션": {
          title: "ReactベースのWebアプリケーション",
          description: "Next.jsとTypeScriptを活用したモダンなWebアプリ開発",
        },
        "NestJS 백엔드 API 서버": {
          title: "NestJSバックエンドAPIサーバー",
          description: "PostgreSQLとPrismaを使用したRESTful API開発",
        },
        "모바일 앱 UI/UX 디자인": {
          title: "モバイルアプリUI/UXデザイン",
          description: "Figmaを活用したモバイルアプリデザインプロジェクト",
        },
        "풀스택 웹 서비스": {
          title: "フルスタックWebサービス",
          description:
            "React + Node.js + MongoDBスタックのフルスタックプロジェクト",
        },
        "프로젝트 관리 플랫폼": {
          title: "プロジェクト管理プラットフォーム",
          description: "NotionとJiraを活用したコラボレーションツール開発",
        },
        "Vue.js 기반 대시보드": {
          title: "Vue.jsベースのダッシュボード",
          description:
            "Vue 3とComposition APIを活用した管理者ダッシュボード開発",
        },
        "실시간 채팅 애플리케이션": {
          title: "リアルタイムチャットアプリケーション",
          description: "WebSocketを活用したリアルタイムメッセンジャー開発",
        },
        "이커머스 플랫폼 디자인": {
          title: "Eコマースプラットフォームデザイン",
          description:
            "オンラインショッピングモールUI/UXデザインとプロトタイプ制作",
        },
        "Django 기반 블로그 플랫폼": {
          title: "Djangoベースのブログプラットフォーム",
          description: "Python Djangoで開発する個人ブログシステム",
        },
        "모바일 게임 UI 디자인": {
          title: "モバイルゲームUIデザイン",
          description:
            "モバイルゲームのためのインターフェースとキャラクターデザイン",
        },
        "마이크로서비스 아키텍처 구축": {
          title: "マイクロサービスアーキテクチャ構築",
          description:
            "DockerとKubernetesを活用したマイクロサービスシステム開発",
        },
        "스타트업 제품 기획": {
          title: "スタートアップ製品企画",
          description: "新しいSaaSサービスの全体企画とプロトタイプ設計",
        },
        "React Native 모바일 앱": {
          title: "React Nativeモバイルアプリ",
          description: "クロスプラットフォームモバイルアプリケーション開発",
        },
        "AI 기반 추천 시스템": {
          title: "AIベースの推薦システム",
          description: "機械学習を活用したパーソナライズ推薦エンジン開発",
        },
        "브랜드 아이덴티티 디자인": {
          title: "ブランドアイデンティティデザイン",
          description:
            "スタートアップのためのブランドロゴとビジュアルアイデンティティ制作",
        },
        "GraphQL API 서버": {
          title: "GraphQL APIサーバー",
          description: "Apollo Serverを活用したGraphQLバックエンド開発",
        },
        "웹 애니메이션 프로젝트": {
          title: "Webアニメーションプロジェクト",
          description:
            "Framer MotionとLottieを活用したインタラクティブWebアニメーション",
        },
        "블록체인 기반 NFT 마켓플레이스": {
          title: "ブロックチェーンベースのNFTマーケットプレイス",
          description: "Web3技術を活用したNFT取引プラットフォーム開発",
        },
        "사용자 리서치 및 UX 개선": {
          title: "ユーザーリサーチとUX改善",
          description: "既存サービスのユーザー体験分析と改善案提示",
        },
        "Flutter 크로스플랫폼 앱": {
          title: "Flutterクロスプラットフォームアプリ",
          description: "Flutterを活用したiOS/Androidネイティブアプリ開発",
        },
      },
      "ja-ko": {
        ReactベースのWebアプリケーション: {
          title: "React 기반 웹 애플리케이션",
          description: "Next.js와 TypeScript를 활용한 모던 웹 앱 개발",
        },
        NestJSバックエンドAPIサーバー: {
          title: "NestJS 백엔드 API 서버",
          description: "PostgreSQL과 Prisma를 사용한 RESTful API 개발",
        },
        "モバイルアプリUI/UXデザイン": {
          title: "모바일 앱 UI/UX 디자인",
          description: "Figma를 활용한 모바일 앱 디자인 프로젝트",
        },
        フルスタックWebサービス: {
          title: "풀스택 웹 서비스",
          description: "React + Node.js + MongoDB 스택의 풀스택 프로젝트",
        },
        プロジェクト管理プラットフォーム: {
          title: "프로젝트 관리 플랫폼",
          description: "Notion과 Jira를 활용한 협업 도구 개발",
        },
        "Vue.jsベースのダッシュボード": {
          title: "Vue.js 기반 대시보드",
          description: "Vue 3와 Composition API를 활용한 관리자 대시보드 개발",
        },
        リアルタイムチャットアプリケーション: {
          title: "실시간 채팅 애플리케이션",
          description: "WebSocket을 활용한 실시간 메신저 개발",
        },
        Eコマースプラットフォームデザイン: {
          title: "이커머스 플랫폼 디자인",
          description: "온라인 쇼핑몰 UI/UX 디자인 및 프로토타입 제작",
        },
        Djangoベースのブログプラットフォーム: {
          title: "Django 기반 블로그 플랫폼",
          description: "Python Django로 개발하는 개인 블로그 시스템",
        },
        モバイルゲームUIデザイン: {
          title: "모바일 게임 UI 디자인",
          description: "모바일 게임을 위한 인터페이스 및 캐릭터 디자인",
        },
        マイクロサービスアーキテクチャ構築: {
          title: "마이크로서비스 아키텍처 구축",
          description:
            "Docker와 Kubernetes를 활용한 마이크로서비스 시스템 개발",
        },
        スタートアップ製品企画: {
          title: "스타트업 제품 기획",
          description: "새로운 SaaS 서비스의 전체 기획 및 프로토타입 설계",
        },
        "React Nativeモバイルアプリ": {
          title: "React Native 모바일 앱",
          description: "크로스 플랫폼 모바일 애플리케이션 개발",
        },
        AIベースの推薦システム: {
          title: "AI 기반 추천 시스템",
          description: "머신러닝을 활용한 개인화 추천 엔진 개발",
        },
        ブランドアイデンティティデザイン: {
          title: "브랜드 아이덴티티 디자인",
          description: "스타트업을 위한 브랜드 로고 및 시각 아이덴티티 제작",
        },
        "GraphQL APIサーバー": {
          title: "GraphQL API 서버",
          description: "Apollo Server를 활용한 GraphQL 백엔드 개발",
        },
        Webアニメーションプロジェクト: {
          title: "웹 애니메이션 프로젝트",
          description:
            "Framer Motion과 Lottie를 활용한 인터랙티브 웹 애니메이션",
        },
        ブロックチェーンベースのNFTマーケットプレイス: {
          title: "블록체인 기반 NFT 마켓플레이스",
          description: "Web3 기술을 활용한 NFT 거래 플랫폼 개발",
        },
        ユーザーリサーチとUX改善: {
          title: "사용자 리서치 및 UX 개선",
          description: "기존 서비스의 사용자 경험 분석 및 개선안 제시",
        },
        Flutterクロスプラットフォームアプリ: {
          title: "Flutter 크로스플랫폼 앱",
          description: "Flutter를 활용한 iOS/Android 네이티브 앱 개발",
        },
      },
      "en-ja": {
        "React-based Web Application": {
          title: "ReactベースのWebアプリケーション",
          description: "Next.jsとTypeScriptを活用したモダンなWebアプリ開発",
        },
        "NestJS Backend API Server": {
          title: "NestJSバックエンドAPIサーバー",
          description: "PostgreSQLとPrismaを使用したRESTful API開発",
        },
        "Mobile App UI/UX Design": {
          title: "モバイルアプリUI/UXデザイン",
          description: "Figmaを活用したモバイルアプリデザインプロジェクト",
        },
        "Full-stack Web Service": {
          title: "フルスタックWebサービス",
          description:
            "React + Node.js + MongoDBスタックのフルスタックプロジェクト",
        },
        "Project Management Platform": {
          title: "プロジェクト管理プラットフォーム",
          description: "NotionとJiraを活用したコラボレーションツール開発",
        },
        "Vue.js-based Dashboard": {
          title: "Vue.jsベースのダッシュボード",
          description:
            "Vue 3とComposition APIを活用した管理者ダッシュボード開発",
        },
        "Real-time Chat Application": {
          title: "リアルタイムチャットアプリケーション",
          description: "WebSocketを活用したリアルタイムメッセンジャー開発",
        },
        "E-commerce Platform Design": {
          title: "Eコマースプラットフォームデザイン",
          description:
            "オンラインショッピングモールUI/UXデザインとプロトタイプ制作",
        },
        "Django-based Blog Platform": {
          title: "Djangoベースのブログプラットフォーム",
          description: "Python Djangoで開発する個人ブログシステム",
        },
        "Mobile Game UI Design": {
          title: "モバイルゲームUIデザイン",
          description:
            "モバイルゲームのためのインターフェースとキャラクターデザイン",
        },
        "Microservices Architecture Development": {
          title: "マイクロサービスアーキテクチャ構築",
          description:
            "DockerとKubernetesを活用したマイクロサービスシステム開発",
        },
        "Startup Product Planning": {
          title: "スタートアップ製品企画",
          description: "新しいSaaSサービスの全体企画とプロトタイプ設計",
        },
        "React Native Mobile App": {
          title: "React Nativeモバイルアプリ",
          description: "クロスプラットフォームモバイルアプリケーション開発",
        },
        "AI-based Recommendation System": {
          title: "AIベースの推薦システム",
          description: "機械学習を活用したパーソナライズ推薦エンジン開発",
        },
        "Brand Identity Design": {
          title: "ブランドアイデンティティデザイン",
          description:
            "スタートアップのためのブランドロゴとビジュアルアイデンティティ制作",
        },
        "GraphQL API Server": {
          title: "GraphQL APIサーバー",
          description: "Apollo Serverを活用したGraphQLバックエンド開発",
        },
        "Web Animation Project": {
          title: "Webアニメーションプロジェクト",
          description:
            "Framer MotionとLottieを活用したインタラクティブWebアニメーション",
        },
        "Blockchain-based NFT Marketplace": {
          title: "ブロックチェーンベースのNFTマーケットプレイス",
          description: "Web3技術を活用したNFT取引プラットフォーム開発",
        },
        "User Research and UX Improvement": {
          title: "ユーザーリサーチとUX改善",
          description: "既存サービスのユーザー体験分析と改善案提示",
        },
        "Flutter Cross-platform App": {
          title: "Flutterクロスプラットフォームアプリ",
          description: "Flutterを活用したiOS/Androidネイティブアプリ開発",
        },
      },
      "ja-en": {
        ReactベースのWebアプリケーション: {
          title: "React-based Web Application",
          description:
            "Modern web app development using Next.js and TypeScript",
        },
        NestJSバックエンドAPIサーバー: {
          title: "NestJS Backend API Server",
          description: "RESTful API development using PostgreSQL and Prisma",
        },
        "モバイルアプリUI/UXデザイン": {
          title: "Mobile App UI/UX Design",
          description: "Mobile app design project using Figma",
        },
        フルスタックWebサービス: {
          title: "Full-stack Web Service",
          description: "Full-stack project using React + Node.js + MongoDB",
        },
        プロジェクト管理プラットフォーム: {
          title: "Project Management Platform",
          description:
            "Collaboration tool development inspired by Notion and Jira",
        },
        "Vue.jsベースのダッシュボード": {
          title: "Vue.js-based Dashboard",
          description:
            "Admin dashboard development using Vue 3 and Composition API",
        },
        リアルタイムチャットアプリケーション: {
          title: "Real-time Chat Application",
          description: "Real-time messenger development using WebSocket",
        },
        Eコマースプラットフォームデザイン: {
          title: "E-commerce Platform Design",
          description:
            "Online shopping mall UI/UX design and prototype creation",
        },
        Djangoベースのブログプラットフォーム: {
          title: "Django-based Blog Platform",
          description: "Personal blog system developed with Python Django",
        },
        モバイルゲームUIデザイン: {
          title: "Mobile Game UI Design",
          description: "Interface and character design for mobile games",
        },
        マイクロサービスアーキテクチャ構築: {
          title: "Microservices Architecture Development",
          description:
            "Microservices system development using Docker and Kubernetes",
        },
        スタートアップ製品企画: {
          title: "Startup Product Planning",
          description:
            "Complete planning and prototype design for a new SaaS service",
        },
        "React Nativeモバイルアプリ": {
          title: "React Native Mobile App",
          description: "Cross-platform mobile application development",
        },
        AIベースの推薦システム: {
          title: "AI-based Recommendation System",
          description:
            "Personalized recommendation engine development using machine learning",
        },
        ブランドアイデンティティデザイン: {
          title: "Brand Identity Design",
          description: "Brand logo and visual identity creation for startups",
        },
        "GraphQL APIサーバー": {
          title: "GraphQL API Server",
          description: "GraphQL backend development using Apollo Server",
        },
        Webアニメーションプロジェクト: {
          title: "Web Animation Project",
          description:
            "Interactive web animations using Framer Motion and Lottie",
        },
        ブロックチェーンベースのNFTマーケットプレイス: {
          title: "Blockchain-based NFT Marketplace",
          description: "NFT trading platform development using Web3 technology",
        },
        ユーザーリサーチとUX改善: {
          title: "User Research and UX Improvement",
          description:
            "User experience analysis and improvement proposals for existing services",
        },
        Flutterクロスプラットフォームアプリ: {
          title: "Flutter Cross-platform App",
          description: "iOS/Android native app development using Flutter",
        },
      },
    };

    const translationKey = `${sourceLang}-${targetLang}`;
    const translations = projectTranslations[translationKey];

    if (translations && translations[title]) {
      return translations[title];
    }

    // 번역이 없으면 원문 반환
    return { title, description };
  }

  // 프로젝트를 사용자 언어로 번역
  private async translateProjectForUser(
    project: any,
    userId?: string
  ): Promise<any> {
    if (!userId) {
      // 로그인하지 않은 사용자는 원문 반환
      return project;
    }

    // 사용자 국가 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { country: true } as any,
    });

    if (!user || !(user as any).country) {
      return project;
    }

    // 프로젝트 생성자 국가 확인
    const creator = await this.prisma.user.findUnique({
      where: { id: project.creatorId },
      select: { country: true } as any,
    });

    if (!creator || !(creator as any).country) {
      return project;
    }

    const sourceLang = this.countryToLanguage((creator as any).country);
    const targetLang = this.countryToLanguage((user as any).country);

    // 같은 언어면 번역 불필요
    if (sourceLang === targetLang) {
      return project;
    }

    // 프로젝트 제목과 설명 번역
    const translated = this.translateProjectText(
      project.title,
      project.shortDescription,
      sourceLang,
      targetLang
    );

    return {
      ...project,
      title: translated.title,
      shortDescription: translated.description,
    };
  }

  async create(createProjectDto: CreateProjectDto, creatorId: string) {
    const project = await this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        shortDescription: createProjectDto.shortDescription,
        neededRoles: JSON.stringify(createProjectDto.neededRoles),
        requiredStacks: JSON.stringify(createProjectDto.requiredStacks),
        startDate: createProjectDto.startDate
          ? new Date(createProjectDto.startDate)
          : null,
        endDate: createProjectDto.endDate
          ? new Date(createProjectDto.endDate)
          : null,
        creatorId,
      } as any,
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
      },
    });

    return {
      ...project,
      neededRoles: JSON.parse(project.neededRoles),
      requiredStacks: JSON.parse(project.requiredStacks),
    };
  }

  async findAll(page: number = 1, limit: number = 10, userId?: string) {
    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          creator: {
            select: {
              id: true,
              nickname: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.project.count(),
    ]);

    // 각 프로젝트를 사용자 언어로 번역
    const translatedProjects = await Promise.all(
      projects.map((project) =>
        this.translateProjectForUser(
          {
            ...project,
            neededRoles: JSON.parse(project.neededRoles),
            requiredStacks: JSON.parse(project.requiredStacks),
            isRecruiting: (project as any).isRecruiting ?? true,
          },
          userId
        )
      )
    );

    return {
      data: translatedProjects,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            role: true,
            techStacks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 현재 사용자의 참여 신청 상태 확인
    let hasApplied = false;
    let isAccepted = false;
    if (userId) {
      const application = await this.prisma.projectApplication.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId,
          },
        },
      });
      hasApplied = !!application;
      isAccepted = application?.status === "ACCEPTED";
    }

    const projectData = {
      ...project,
      neededRoles: JSON.parse(project.neededRoles),
      requiredStacks: JSON.parse(project.requiredStacks),
      isRecruiting: (project as any).isRecruiting ?? true, // 기본값 true
      creator: {
        ...project.creator,
        techStacks: JSON.parse(project.creator.techStacks || "[]"),
      },
      hasApplied,
      isAccepted, // 수락된 신청 여부
    };

    // 사용자 언어로 번역
    return await this.translateProjectForUser(projectData, userId);
  }

  // 추천 팀원 목록 - 전체 유저 대상으로 매칭 점수 계산 (creator만 접근 가능)
  async getRecommendations(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자만 접근 가능
    if (project.creatorId !== userId) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    const requiredStacks = JSON.parse(
      project.requiredStacks || "[]"
    ) as string[];
    const neededRoles = JSON.parse(project.neededRoles || "[]") as string[];

    // 모든 사용자 조회 (전체 유저 대상, 자기 자신 제외)
    const allUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId }, // 자기 자신 제외
      },
      select: {
        id: true,
        nickname: true,
        role: true,
        techStacks: true,
        portfolioLinks: true as any,
        experience: true as any,
      } as any,
    });

    // 매칭 점수 계산 (1~100점) - 역할별로 다른 평가 기준 적용
    const usersWithScores = allUsers
      .map((user: any) => {
        const userStacks = JSON.parse(user.techStacks || "[]") as string[];
        const portfolioLinks = JSON.parse(
          user.portfolioLinks || "[]"
        ) as string[];
        const experience = JSON.parse(user.experience || "[]") as Array<{
          title: string;
          role: string;
          period: string;
          description: string;
        }>;

        let techScore = 0;
        let roleScore = 0;
        let portfolioScore = 0;
        let experienceScore = 0;

        // 역할 매칭 점수 계산 (모든 역할 공통, 0~20점)
        if (neededRoles.length > 0 && neededRoles.includes(user.role)) {
          roleScore = 20;
        }

        // 역할별 평가 로직 분기
        if (user.role === "DEVELOPER") {
          // 개발자: 기술 스택 매칭 (0~80점)
          if (requiredStacks.length > 0) {
            const intersection = requiredStacks.filter((stack) =>
              userStacks.includes(stack)
            );
            techScore = (intersection.length / requiredStacks.length) * 80;
          }
        } else if (user.role === "DESIGNER") {
          // 디자이너: 포트폴리오 링크 (0~30점), 경력 (0~30점), 디자인 도구 경험 (0~20점)
          if (portfolioLinks.length > 0) {
            portfolioScore = Math.min(30, portfolioLinks.length * 10); // 링크 1개당 10점, 최대 30점
          }
          if (experience.length > 0) {
            experienceScore = Math.min(30, experience.length * 10); // 경력 1개당 10점, 최대 30점
          }
          // 디자인 도구 경험 (Figma, Adobe 등)
          const designTools = [
            "Figma",
            "Adobe XD",
            "Sketch",
            "Photoshop",
            "Illustrator",
          ];
          const userDesignTools = userStacks.filter((stack) =>
            designTools.some((tool) => stack.includes(tool))
          );
          if (userDesignTools.length > 0) {
            techScore = (userDesignTools.length / designTools.length) * 20;
          }
        } else if (user.role === "PLANNER") {
          // 기획자: 포트폴리오/문서 링크 (0~30점), 경력 (0~30점), 기획 도구 경험 (0~20점)
          if (portfolioLinks.length > 0) {
            portfolioScore = Math.min(30, portfolioLinks.length * 10); // 링크 1개당 10점, 최대 30점
          }
          if (experience.length > 0) {
            experienceScore = Math.min(30, experience.length * 10); // 경력 1개당 10점, 최대 30점
          }
          // 기획 도구 경험 (Notion, Figma, 문서 도구 등)
          const planningTools = [
            "Notion",
            "Figma",
            "Miro",
            "Confluence",
            "Jira",
          ];
          const userPlanningTools = userStacks.filter((stack) =>
            planningTools.some((tool) => stack.includes(tool))
          );
          if (userPlanningTools.length > 0) {
            techScore = (userPlanningTools.length / planningTools.length) * 20;
          }
        }

        // 총합 점수 계산 (1~100점으로 정규화)
        let totalScore =
          techScore + roleScore + portfolioScore + experienceScore;

        // 최소 1점, 최대 100점으로 제한
        totalScore = Math.max(1, Math.min(100, Math.round(totalScore)));

        // 소수점 둘째 자리까지 반올림
        totalScore = Math.round(totalScore * 100) / 100;

        return {
          userId: user.id,
          nickname: user.nickname,
          role: user.role,
          techStacks: userStacks,
          portfolioLinks: portfolioLinks,
          experience: experience,
          score: totalScore,
          techScore: Math.round(techScore * 100) / 100,
          roleScore: Math.round(roleScore * 100) / 100,
          portfolioScore: Math.round(portfolioScore * 100) / 100,
          experienceScore: Math.round(experienceScore * 100) / 100,
        };
      })
      .filter((user) => user.score > 0) // 점수가 0보다 큰 사용자만
      .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
      .slice(0, 5); // 상위 5명

    return usersWithScores;
  }

  // 모집 종료 (생성자만 가능)
  async closeRecruitment(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자만 모집 종료 가능
    if (project.creatorId !== userId) {
      throw new ForbiddenException("모집을 종료할 권한이 없습니다.");
    }

    // 이미 모집 종료된 경우
    if (!(project as any).isRecruiting) {
      throw new ConflictException("이미 모집이 종료된 프로젝트입니다.");
    }

    // 모집 종료
    await this.prisma.project.update({
      where: { id: projectId },
      data: { isRecruiting: false } as any,
    });

    return { message: "모집이 종료되었습니다." };
  }

  // 프로젝트 삭제 (생성자만 가능)
  async delete(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자만 삭제 가능
    if (project.creatorId !== userId) {
      throw new ForbiddenException("프로젝트를 삭제할 권한이 없습니다.");
    }

    // 프로젝트 삭제 (관련 데이터는 CASCADE로 자동 삭제됨)
    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: "프로젝트가 삭제되었습니다." };
  }
}
