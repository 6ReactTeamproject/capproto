// GitHub API 서비스 - GitHub 통계 정보 가져오기
import { Injectable, Logger } from '@nestjs/common';
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
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly githubApiBase = 'https://api.github.com';

  // GitHub 사용자 통계 가져오기
  async getUserStats(username: string): Promise<GitHubStats | null> {
    if (!username) {
      return null;
    }

    try {
      // 사용자 정보 가져오기
      const userResponse = await axios.get(`${this.githubApiBase}/users/${username}`, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const publicRepos = userResponse.data.public_repos || 0;

      // Public repositories 가져오기
      const reposResponse = await axios.get(
        `${this.githubApiBase}/users/${username}/repos?per_page=100&sort=updated`,
        {
          headers: {
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );

      const repos = reposResponse.data || [];
      const languages: Record<string, number> = {};
      let totalCommits = 0;
      const commitDates: string[] = [];

      // 각 repository의 정보 수집
      for (const repo of repos.slice(0, 30)) {
        // Repository 언어 정보
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }

        // Repository의 커밋 수 가져오기 (간단한 추정)
        try {
          const commitsResponse = await axios.get(
            `${this.githubApiBase}/repos/${username}/${repo.name}/commits?per_page=1`,
            {
              headers: {
                Accept: 'application/vnd.github.v3+json',
              },
            }
          );

          // Link 헤더에서 총 커밋 수 추정 (간단한 방법)
          const linkHeader = commitsResponse.headers.link;
          if (linkHeader) {
            const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
            if (lastPageMatch) {
              const lastPage = parseInt(lastPageMatch[1], 10);
              totalCommits += Math.min(lastPage * 30, 1000); // 최대 1000개로 제한
            }
          }

          // 최근 커밋 날짜 수집
          if (commitsResponse.data && commitsResponse.data.length > 0) {
            const commitDate = commitsResponse.data[0].commit.author.date;
            commitDates.push(commitDate);
          }
        } catch (err) {
          // Repository 접근 불가능하거나 에러 발생 시 스킵
          this.logger.warn(`Failed to get commits for ${repo.name}: ${err.message}`);
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

      return {
        totalCommits: totalCommits || commitDates.length * 10, // 추정치
        totalRepositories: repos.length,
        publicRepositories: publicRepos,
        languages,
        commitPattern,
        recentActivity,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get GitHub stats for ${username}: ${error.message}`);
      return null;
    }
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

