// 릴리즈 서비스 - 공식 문서에서 릴리즈 정보 가져오기
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class ReleasesService {
  private readonly logger = new Logger(ReleasesService.name);

  // 언어별 GitHub 저장소 정보
  private readonly languageRepos: Record<string, { owner: string; repo: string; useTags?: boolean }> = {
    TypeScript: { owner: 'microsoft', repo: 'TypeScript' },
    'Node.js': { owner: 'nodejs', repo: 'node' },
    React: { owner: 'facebook', repo: 'react' },
    Python: { owner: 'python', repo: 'cpython', useTags: true }, // Releases 대신 Tags 사용
    Java: { owner: 'openjdk', repo: 'jdk', useTags: true }, // Releases 대신 Tags 사용
    'Next.js': { owner: 'vercel', repo: 'next.js' },
    NestJS: { owner: 'nestjs', repo: 'nestjs' },
  };

  constructor(private prisma: PrismaService) {}

  // 특정 언어의 최신 5개 릴리즈 조회 (자동 갱신 포함)
  async getLatestReleases(language: string) {
    // 먼저 DB에서 기존 데이터 조회 (빠른 응답)
    const existingReleases = await this.prisma.release.findMany({
      where: { language },
      orderBy: { releaseDate: 'desc' },
      take: 5,
    });

    // 기존 데이터가 있으면 즉시 반환하고 백그라운드에서 갱신
    if (existingReleases.length > 0) {
      // 백그라운드에서 최신 정보 확인 및 업데이트 (비동기, 에러 무시)
      setImmediate(() => {
        this.checkAndUpdateReleases(language).catch(() => {
          // 에러는 무시 (이미 기존 데이터 반환했으므로)
        });
      });
      return existingReleases;
    }

    // DB에 데이터가 없으면 동기화 시도 (타임아웃 포함)
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('동기화 타임아웃')), 10000)
      );

      await Promise.race([
        this.syncLanguageReleases(language),
        timeoutPromise,
      ]);

      return this.prisma.release.findMany({
        where: { language },
        orderBy: { releaseDate: 'desc' },
        take: 5,
      });
    } catch (error) {
      this.logger.warn(`초기 릴리즈 정보 동기화 실패 (${language}):`, error.message || error);
      return [];
    }
  }

  // 모든 언어의 최신 릴리즈 조회
  async getAllLatestReleases() {
    const languages = Object.keys(this.languageRepos);
    const allReleases: Record<string, any[]> = {};

    // 병렬 처리하되, rate limit을 피하기 위해 약간의 지연
    for (let i = 0; i < languages.length; i++) {
      const language = languages[i];
      allReleases[language] = await this.getLatestReleases(language);
      // 각 요청 사이에 200ms 지연 (rate limit 방지)
      if (i < languages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    return allReleases;
  }

  // 최신 정보 확인 및 업데이트 (비동기, 에러 무시)
  private async checkAndUpdateReleases(language: string) {
    try {
      // 타임아웃 설정 (5초)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('타임아웃')), 5000)
      );

      const latestFromSource = await Promise.race([
        this.fetchLatestReleases(language),
        timeoutPromise,
      ]) as any[];

      if (!latestFromSource || latestFromSource.length === 0) return;

      const latestInDb = await this.prisma.release.findFirst({
        where: { language },
        orderBy: { releaseDate: 'desc' },
      });

      // 새 버전이 있거나 DB가 비어있으면 동기화
      if (!latestInDb || latestFromSource[0].version !== latestInDb.version) {
        await this.syncLanguageReleases(language);
      }
    } catch (error) {
      // 에러는 로그만 남기고 무시 (사용자 경험에 영향 없음)
      this.logger.warn(`릴리즈 정보 확인 실패 (${language}):`, error.message || error);
    }
  }

  // 특정 언어의 릴리즈 정보 동기화
  async syncLanguageReleases(language: string) {
    try {
      const releases = await this.fetchLatestReleases(language);
      
      if (releases.length === 0) {
        throw new Error('릴리즈 정보를 가져올 수 없습니다. GitHub API rate limit에 걸렸을 수 있습니다.');
      }

      for (const release of releases) {
        const existing = await this.prisma.release.findUnique({
          where: {
            language_version: {
              language,
              version: release.version,
            },
          },
        });

        if (!existing) {
          await this.prisma.release.create({
            data: release,
          });
        } else {
          await this.prisma.release.update({
            where: { id: existing.id },
            data: {
              officialContent: release.officialContent,
              summary: release.summary,
            },
          });
        }
      }

      // 최신 5개만 유지
      await this.keepLatestFive(language);
    } catch (error: any) {
      this.logger.error(`릴리즈 동기화 실패 (${language}):`, error.message || error);
      throw error;
    }
  }

  // GitHub API에서 최신 릴리즈 정보 가져오기
  private async fetchLatestReleases(language: string) {
    const repoInfo = this.languageRepos[language];
    if (!repoInfo) {
      throw new Error(`지원하지 않는 언어: ${language}`);
    }

    try {
      // Releases API 사용 (기본)
      let response;
      if (repoInfo.useTags) {
        // Tags API 사용 (Python, Java 등)
        response = await axios.get(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/tags`,
          {
            params: { per_page: 5 },
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Sync-Up-Release-Bot',
            },
            timeout: 5000,
          }
        );

        // Tags를 Releases 형식으로 변환
        const releases = await Promise.all(
          response.data.slice(0, 5).map(async (tag: any) => {
            // 커밋 정보 가져오기
            const commitResponse = await axios.get(
              tag.commit.url,
              {
                headers: {
                  Accept: 'application/vnd.github.v3+json',
                  'User-Agent': 'Sync-Up-Release-Bot',
                },
                timeout: 3000,
              }
            ).catch(() => ({ data: { commit: { author: { date: new Date().toISOString() } } } }));

            const officialContent = await this.fetchOfficialDocs(
              language,
              tag.name,
              `https://github.com/${repoInfo.owner}/${repoInfo.repo}/releases/tag/${tag.name}`
            );

            return {
              language,
              version: tag.name.replace(/^v/, ''),
              releaseDate: new Date(commitResponse.data.commit?.author?.date || new Date()),
              officialDocs: `https://github.com/${repoInfo.owner}/${repoInfo.repo}/releases/tag/${tag.name}`,
              officialContent,
              summary: `${language} ${tag.name.replace(/^v/, '')} 버전입니다. 자세한 내용은 공식 문서를 참조하세요.`,
            };
          })
        );

        return releases;
      } else {
        // Releases API 사용
        response = await axios.get(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/releases`,
          {
            params: { per_page: 5 },
            headers: {
              Accept: 'application/vnd.github.v3+json',
              'User-Agent': 'Sync-Up-Release-Bot',
            },
            timeout: 5000,
          }
        );

        const releases = await Promise.all(
          response.data.slice(0, 5).map(async (release: any) => {
            const officialContent = await this.fetchOfficialDocs(
              language,
              release.tag_name,
              release.html_url
            );

            const detailedContent = release.body
              ? `${officialContent}\n\n---\n\n## 릴리즈 노트 상세 내용\n\n${release.body}`
              : officialContent;

            return {
              language,
              version: release.tag_name.replace(/^v/, ''),
              releaseDate: new Date(release.published_at),
              officialDocs: release.html_url,
              officialContent: detailedContent,
              summary: this.summarizeRelease(release.body || release.name || ''),
            };
          })
        );

        return releases;
      }
    } catch (error: any) {
      // 403 에러는 rate limit일 수 있으므로 경고만
      if (error.response?.status === 403) {
        const resetTime = error.response?.headers['x-ratelimit-reset'];
        const remaining = error.response?.headers['x-ratelimit-remaining'];
        this.logger.warn(
          `GitHub API Rate Limit (${language}): 남은 호출 ${remaining || 0}회. ` +
          (resetTime ? `리셋 시간: ${new Date(parseInt(resetTime) * 1000).toLocaleString()}` : '')
        );
      } else if (error.response?.status === 404) {
        this.logger.warn(`GitHub 저장소를 찾을 수 없습니다 (${language}): ${repoInfo.owner}/${repoInfo.repo}`);
      } else {
        this.logger.error(`GitHub API 호출 실패 (${language}):`, error.message || error);
      }
      return [];
    }
  }

  // 공식 문서 내용 가져오기
  private async fetchOfficialDocs(
    language: string,
    version: string,
    githubUrl: string
  ): Promise<string> {
    // GitHub 릴리즈 노트의 body를 공식 문서 내용으로 사용
    // 실제로는 각 언어별 공식 문서 사이트에서 내용을 가져와야 하지만,
    // 프로토타입에서는 GitHub 릴리즈 노트를 공식 문서 내용으로 사용
    return `이 릴리즈의 상세 내용은 GitHub 릴리즈 페이지에서 확인할 수 있습니다.\n\n공식 릴리즈 노트: ${githubUrl}\n\n위 링크에서 전체 변경사항, 새로운 기능, 버그 수정 사항 등을 확인하실 수 있습니다.`;
  }

  // 릴리즈 내용 간략 정리
  private summarizeRelease(body: string): string {
    if (!body) return '릴리즈 노트가 없습니다.';

    // 마크다운 제거 및 간략화
    let summary = body
      .replace(/```[\s\S]*?```/g, '') // 코드 블록 제거
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 링크 제거
      .replace(/#{1,6}\s+/g, '') // 헤더 제거
      .replace(/\*\*/g, '') // 볼드 제거
      .replace(/\*/g, '') // 이탤릭 제거
      .trim();

    // 처음 300자만 추출
    if (summary.length > 300) {
      summary = summary.substring(0, 300) + '...';
    }

    return summary || '릴리즈 노트 내용을 확인할 수 없습니다.';
  }

  // 최신 5개만 유지
  private async keepLatestFive(language: string) {
    const allReleases = await this.prisma.release.findMany({
      where: { language },
      orderBy: { releaseDate: 'desc' },
    });

    if (allReleases.length > 5) {
      const toDelete = allReleases.slice(5);
      await this.prisma.release.deleteMany({
        where: {
          id: { in: toDelete.map((r) => r.id) },
        },
      });
    }
  }
}

