// GitHub API 서비스 - GitHub 통계 정보 가져오기
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface GitHubStats {
  totalCommits: number;
  totalRepositories: number;
  publicRepositories: number;
  languages: Record<string, number>;
  commitPattern: {
    lastWeek: number;
    lastMonth: number;
    lastYear: number;
  };
  recentActivity: Array<{
    date: string;
    commits: number;
  }>;
  rateLimited?: boolean; // Rate limit 상태 표시
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly githubApiBase = 'https://api.github.com';
  private readonly cache = new Map<string, { data: GitHubStats; expiresAt: number }>();
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1시간 캐시

  constructor(private configService: ConfigService) {}

  // GitHub API 요청 헤더 생성
  private getHeaders(userToken?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };

    // 우선순위: 사용자 토큰 > 서버 토큰
    const token = userToken || this.configService.get<string>('GITHUB_TOKEN');
    if (token) {
      headers['Authorization'] = `token ${token}`;
      if (userToken) {
        this.logger.log(`Using user GitHub OAuth token for ${username} API requests`);
      } else if (this.configService.get<string>('GITHUB_TOKEN')) {
        this.logger.log('Using server GitHub Personal Access Token for API requests');
      } else {
        this.logger.warn('No GitHub token available - using unauthenticated requests (60 req/hour limit)');
      }
    } else {
      this.logger.warn('No GitHub token available - using unauthenticated requests (60 req/hour limit)');
    }

    return headers;
  }

  // 캐시에서 데이터 가져오기
  private getCached(username: string): GitHubStats | null {
    const cached = this.cache.get(username);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.debug(`Cache hit for ${username}`);
      return cached.data;
    }
    if (cached) {
      this.cache.delete(username);
    }
    return null;
  }

  // 캐시에 데이터 저장
  private setCache(username: string, data: GitHubStats): void {
    this.cache.set(username, {
      data,
      expiresAt: Date.now() + this.CACHE_DURATION,
    });
    this.logger.debug(`Cached stats for ${username}`);
  }

  // GitHub 사용자 통계 가져오기
  async getUserStats(username: string, userToken?: string | null): Promise<GitHubStats | null> {
    if (!username) {
      return null;
    }

    // 캐시 확인 (토큰별로 캐싱하지 않음 - public 데이터이므로)
    const cached = this.getCached(username);
    if (cached) {
      return cached;
    }

    let publicRepos = 0;
    let repos: any[] = [];
    let rateLimited = false;

    try {
      // 저장소 가져오기 (사용자 토큰이 있으면 조직 저장소 포함)
      try {
        let reposUrl: string;
        if (userToken) {
          // 인증된 사용자의 모든 저장소 (개인 + 조직 포함)
          reposUrl = `${this.githubApiBase}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member`;
          this.logger.log(`Fetching repos with organization support for ${username}`);
        } else {
          // 인증 없이 public 저장소만
          reposUrl = `${this.githubApiBase}/users/${username}/repos?per_page=100&sort=updated`;
        }

        const reposResponse = await axios.get(reposUrl, {
          headers: this.getHeaders(userToken),
          validateStatus: (status) => status < 500,
        });

        if (reposResponse.status === 403) {
          this.logger.warn(`GitHub API rate limit reached for ${username}`);
          rateLimited = true;
          // rate limit이지만 일단 저장소 정보는 없음
          return this.getBasicStats(username, [], {}, true);
        }

        if (reposResponse.status === 200) {
          repos = reposResponse.data || [];
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          this.logger.warn(`GitHub API rate limit reached for ${username}`);
          rateLimited = true;
          return this.getBasicStats(username, [], {}, true);
        }
        this.logger.warn(`Failed to get repos for ${username}: ${err.message}`);
      }

      // 사용자 정보 가져오기 (선택적)
      try {
        const userResponse = await axios.get(`${this.githubApiBase}/users/${username}`, {
          headers: this.getHeaders(userToken),
          validateStatus: (status) => status < 500,
        });

        if (userResponse.status === 403) {
          this.logger.warn(`GitHub API rate limit reached for ${username} (user info)`);
          rateLimited = true;
          // 저장소 정보는 있으니 계속 진행
        } else if (userResponse.status === 200) {
          publicRepos = userResponse.data.public_repos || 0;
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          this.logger.warn(`GitHub API rate limit reached for ${username} (user info)`);
          rateLimited = true;
          // 저장소 정보는 있으니 계속 진행
        } else {
          this.logger.warn(`Failed to get user info for ${username}: ${err.message}`);
        }
      }

      if (repos.length === 0) {
        // 저장소가 없으면 기본 정보만 반환
        return this.getBasicStats(username, [], {}, rateLimited);
      }

      const languages: Record<string, number> = {};
      let totalCommits = 0;
      const commitDates: string[] = [];

      // 각 repository의 언어 정보 수집
      const topRepos = repos.slice(0, 10); // Rate limit을 고려하여 10개로 제한
      
      topRepos.forEach((repo) => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });

      // 각 repository의 커밋 정보를 배치로 처리 (rate limit 방지)
      // 5개씩 묶어서 처리하고 약간의 지연 추가
      const batchSize = 5;
      let rateLimitHit = false;

      for (let i = 0; i < topRepos.length; i += batchSize) {
        if (rateLimitHit) break;

        const batch = topRepos.slice(i, i + batchSize);
        
        const commitPromises = batch.map(async (repo) => {
          try {
            // 조직 저장소도 포함하기 위해 full_name 사용
            const repoFullName = repo.full_name || `${username}/${repo.name}`;
            
            // 사용자가 작성한 커밋 가져오기 (최근 30개 정도)
            // author 파라미터로 사용자가 작성한 커밋만 필터링
            const commitsUrl = `${this.githubApiBase}/repos/${repoFullName}/commits?per_page=30&author=${username}`;
            
            const commitsResponse = await axios.get(commitsUrl, {
              headers: this.getHeaders(userToken),
              timeout: 5000, // 5초 타임아웃
              validateStatus: (status) => status < 500, // 403 등도 처리
            });

            // Rate limit 에러 체크
            if (commitsResponse.status === 403) {
              rateLimitHit = true;
              this.logger.warn(`Rate limit reached for ${repoFullName}`);
              return { repoCommits: 0, commitDates: [], rateLimited: true };
            }

            if (commitsResponse.status !== 200) {
              return { repoCommits: 0, commitDates: [], rateLimited: false };
            }

            // Link 헤더에서 총 커밋 수 추정 (간단한 방법)
            const linkHeader = commitsResponse.headers.link;
            let repoCommits = 0;
            if (linkHeader) {
              const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (lastPageMatch) {
                const lastPage = parseInt(lastPageMatch[1], 10);
                repoCommits = Math.min(lastPage * 30, 1000); // 최대 1000개로 제한
              } else {
                // Link 헤더가 없으면 현재 페이지의 커밋 수 사용
                repoCommits = commitsResponse.data?.length || 0;
              }
            } else {
              repoCommits = commitsResponse.data?.length || 0;
            }

            // 모든 커밋 날짜 수집 (최근 활동 패턴 계산용)
            const commitDates: string[] = [];
            if (commitsResponse.data && commitsResponse.data.length > 0) {
              commitsResponse.data.forEach((commit: any) => {
                if (commit.commit && commit.commit.author && commit.commit.author.date) {
                  commitDates.push(commit.commit.author.date);
                }
              });
            }

            return { repoCommits, commitDates, rateLimited: false };
          } catch (err: any) {
            // 403 에러는 rate limit
            if (err.response?.status === 403) {
              rateLimitHit = true;
              this.logger.warn(`Rate limit reached: ${err.message}`);
              return { repoCommits: 0, commitDates: [], rateLimited: true };
            }
            
            // Repository 접근 불가능하거나 에러 발생 시 스킵
            this.logger.warn(`Failed to get commits for ${repo.full_name || repo.name}: ${err.message}`);
            return { repoCommits: 0, commitDates: [], rateLimited: false };
          }
        });

        // 배치 처리
        const batchResults = await Promise.all(commitPromises);
        batchResults.forEach(({ repoCommits, commitDates: repoCommitDates }) => {
          totalCommits += repoCommits;
          // 모든 커밋 날짜 추가
          commitDates.push(...repoCommitDates);
        });

        // Rate limit에 걸리지 않았고 다음 배치가 있으면 약간 대기 (rate limit 방지)
        if (!rateLimitHit && i + batchSize < topRepos.length) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms 대기
        }
      }

      // 커밋 패턴 계산
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      const commitPattern = {
        lastWeek: commitDates.filter(
          (date) => new Date(date) >= lastWeek
        ).length,
        lastMonth: commitDates.filter(
          (date) => new Date(date) >= lastMonth
        ).length,
        lastYear: commitDates.filter(
          (date) => new Date(date) >= lastYear
        ).length,
      };

      // 최근 활동 패턴 (간단한 버전)
      const recentActivity = this.calculateRecentActivity(commitDates);

      const result: GitHubStats = {
        totalCommits: totalCommits || commitDates.length * 10, // 추정치
        totalRepositories: repos.length,
        publicRepositories: publicRepos || repos.length, // publicRepos가 없으면 repos.length 사용
        languages,
        commitPattern,
        recentActivity,
        rateLimited: rateLimitHit || rateLimited, // 커밋 정보 가져올 때 rate limit 발생했는지
      };

      // 성공적으로 데이터를 가져왔으면 캐시에 저장
      if (!rateLimitHit && !rateLimited) {
        this.setCache(username, result);
      }

      return result;
    } catch (error: any) {
      // 예상치 못한 에러 발생 시 기본 정보라도 반환 (이미 수집한 저장소 정보 활용)
      this.logger.error(`Unexpected error getting GitHub stats for ${username}: ${error.message}`);
      // 이미 저장소 정보는 수집했을 수 있으므로 그것을 활용
      if (repos.length > 0) {
        return this.getBasicStats(username, repos, {}, false);
      }
      return this.getBasicStats(username, [], {}, true);
    }
  }

  // 기본 통계 정보 반환 (에러 발생 시)
  private getBasicStats(username: string, repos: any[], languages: Record<string, number>, rateLimited: boolean = true): GitHubStats {
    // 언어 정보가 없으면 저장소에서 추출 시도
    if (Object.keys(languages).length === 0 && repos.length > 0) {
      repos.slice(0, 10).forEach((repo: any) => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });
    }

    return {
      totalCommits: 0,
      totalRepositories: repos.length,
      publicRepositories: repos.length,
      languages,
      commitPattern: { lastWeek: 0, lastMonth: 0, lastYear: 0 },
      recentActivity: [],
      rateLimited,
    };
  }

  // 최근 활동 패턴 계산
  private calculateRecentActivity(commitDates: string[]): Array<{ date: string; commits: number }> {
    const activity: Record<string, number> = {};
    const now = new Date();
    const days = 30; // 최근 30일

    // 최근 30일간의 활동 초기화
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      activity[dateStr] = 0;
    }

    // 커밋 날짜로 활동 계산
    commitDates.forEach((dateStr) => {
      const date = new Date(dateStr).toISOString().split('T')[0];
      if (activity[date] !== undefined) {
        activity[date]++;
      }
    });

    // 배열로 변환하고 날짜순 정렬
    return Object.entries(activity)
      .map(([date, commits]) => ({ date, commits }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // 최근 30일만
  }
}

