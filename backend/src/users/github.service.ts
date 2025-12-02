// GitHub API 서비스 - GitHub 통계 정보 가져오기
import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";

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
  permissionIssue?: boolean; // 권한 문제 (scope 부족 등)
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);
  private readonly githubApiBase = "https://api.github.com";
  private readonly cache = new Map<
    string,
    { data: GitHubStats; expiresAt: number }
  >();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5분 캐시 (개발 중에는 짧게, 프로덕션에서는 길게)

  constructor(private configService: ConfigService) {}

  // GitHub API 요청 헤더 생성
  private getHeaders(userToken?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
    };

    // 우선순위: 사용자 토큰 > 서버 토큰
    const token = userToken || this.configService.get<string>("GITHUB_TOKEN");
    if (token) {
      headers["Authorization"] = `token ${token}`;
      if (userToken) {
        this.logger.log("Using user GitHub OAuth token for API requests");
      } else if (this.configService.get<string>("GITHUB_TOKEN")) {
        this.logger.log(
          "Using server GitHub Personal Access Token for API requests"
        );
      } else {
        this.logger.warn(
          "No GitHub token available - using unauthenticated requests (60 req/hour limit)"
        );
      }
    } else {
      this.logger.warn(
        "No GitHub token available - using unauthenticated requests (60 req/hour limit)"
      );
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
  async getUserStats(
    username: string,
    userToken?: string | null,
    forceRefresh: boolean = false
  ): Promise<GitHubStats | null> {
    if (!username) {
      return null;
    }

    // 디버깅: 토큰 상태 로그
    const hasServerToken = !!this.configService.get<string>("GITHUB_TOKEN");
    this.logger.log(
      `getUserStats called for ${username}. userToken=${
        userToken ? "present" : "missing"
      }, serverToken=${hasServerToken ? "present" : "missing"}`
    );

    // userToken이 없어도 서버 토큰이 있으면 계속 진행 (공개 저장소만)
    // userToken이 있으면 조직/비공개 저장소도 가져올 수 있음

    // 캐시 확인 (강제 새로고침이 아닐 때만)
    if (!forceRefresh) {
      const cached = this.getCached(username);
      if (cached) {
        this.logger.debug(`Returning cached stats for ${username}`);
        return cached;
      }
    } else {
      this.logger.log(
        `Force refresh requested for ${username}, skipping cache`
      );
    }

    let publicRepos = 0;
    let repos: any[] = [];
    let rateLimited = false;
    let permissionIssue = false; // 권한 문제 (scope 부족 등)
    // 실제 GitHub 로그인 아이디 (userToken이 있으면 토큰으로 다시 확인)
    let githubLogin = username;

    try {
      // 저장소 가져오기 (사용자 토큰이 있으면 조직 저장소 포함)
      // 1. user/repos API로 기본 저장소 가져오기
      // 2. /user/orgs API로 사용자가 속한 모든 조직 확인
      // 3. 각 조직의 저장소도 추가로 가져오기 (조직 생성자든 참여자든 모두 포함)
      try {
        repos = [];

        // 먼저 /user/orgs로 사용자가 속한 모든 조직 가져오기
        // 403 에러가 발생하더라도 user/repos API는 계속 진행
        if (userToken) {
          this.logger.log(`Fetching organizations for user ${username}...`);
          try {
            const orgsResponse = await axios.get(
              `${this.githubApiBase}/user/orgs?per_page=100`,
              {
                headers: this.getHeaders(userToken),
                timeout: 5000,
                validateStatus: (status) => status < 500,
              }
            );

            this.logger.debug(
              `Organizations API response status: ${orgsResponse.status}`
            );

            // 403 에러 응답 본문 확인 (rate limit 정보)
            if (orgsResponse.status === 403) {
              const rateLimitRemaining =
                orgsResponse.headers["x-ratelimit-remaining"];
              const rateLimitReset = orgsResponse.headers["x-ratelimit-reset"];
              const errorMessage =
                orgsResponse.data?.message || "Unknown error";
              const errorDocumentation =
                orgsResponse.data?.documentation_url || "";

              this.logger.warn(
                `Organizations API returned 403. Rate limit remaining: ${rateLimitRemaining}, Reset at: ${
                  rateLimitReset
                    ? new Date(parseInt(rateLimitReset) * 1000).toISOString()
                    : "unknown"
                }`
              );
              this.logger.warn(
                `403 Error details: ${errorMessage}${
                  errorDocumentation ? `, docs: ${errorDocumentation}` : ""
                }`
              );
              this.logger.warn(
                `Response body: ${JSON.stringify(orgsResponse.data)}`
              );

              // Rate limit이 충분한데 403이면 권한 문제일 가능성이 높음
              if (parseInt(rateLimitRemaining || "0") > 0) {
                permissionIssue = true;
                this.logger.error(
                  `⚠️  Permission issue detected! The OAuth token likely doesn't have 'read:org' scope.`
                );
                this.logger.error(
                  `User needs to re-authenticate with GitHub. Current scope in strategy: ${JSON.stringify(
                    ["user:email", "read:org", "repo"]
                  )}`
                );
                this.logger.error(
                  `Please log out and log in again with GitHub to get updated scopes.`
                );
              }

              this.logger.warn(
                `Will use repos from user/repos API only. Note: Some organization repos (like 6ReactTeamproject) may not be included if they're not returned by user/repos API.`
              );
            } else if (orgsResponse.status === 200 && orgsResponse.data) {
              const orgs = orgsResponse.data || [];
              this.logger.log(
                `User is member of ${orgs.length} organizations: ${orgs
                  .map((o: any) => o.login)
                  .join(", ")}`
              );

              // 6ReactTeamproject 조직이 있는지 확인
              const targetOrg = orgs.find(
                (o: any) => o.login === "6ReactTeamproject"
              );
              if (targetOrg) {
                this.logger.log(
                  `✓ Found 6ReactTeamproject organization in orgs list`
                );
              } else {
                this.logger.warn(
                  `✗ 6ReactTeamproject organization not found in /user/orgs API`
                );
              }

              // 각 조직의 저장소 가져오기 (조직 생성자든 참여자든 모두 포함)
              for (const org of orgs) {
                try {
                  // 각 조직 페이지를 순회하며 모든 저장소 가져오기
                  let orgPage = 1;
                  let hasOrgMorePages = true;

                  while (hasOrgMorePages && orgPage <= 10) {
                    const orgReposResponse = await axios.get(
                      `${this.githubApiBase}/orgs/${org.login}/repos?per_page=100&page=${orgPage}`,
                      {
                        headers: this.getHeaders(userToken),
                        timeout: 5000,
                        validateStatus: (status) => status < 500,
                      }
                    );

                    if (
                      orgReposResponse.status === 200 &&
                      orgReposResponse.data
                    ) {
                      const orgRepos = orgReposResponse.data || [];

                      // 중복 제거 (이미 가져온 저장소와)
                      const existingRepoNames = new Set(
                        repos.map((r) => r.full_name)
                      );
                      const newOrgRepos = orgRepos.filter(
                        (r: any) => !existingRepoNames.has(r.full_name)
                      );
                      repos.push(...newOrgRepos);

                      this.logger.debug(
                        `Fetched ${orgRepos.length} repos from org ${org.login} page ${orgPage} (${newOrgRepos.length} new, total: ${repos.length})`
                      );

                      // 다음 페이지 확인
                      if (orgRepos.length < 100) {
                        hasOrgMorePages = false;
                      } else {
                        orgPage++;
                      }
                    } else {
                      hasOrgMorePages = false;
                    }
                  }
                } catch (err: any) {
                  this.logger.warn(
                    `Failed to fetch repos from org ${org.login}: ${err.message}`
                  );
                  // 조직 저장소 가져오기 실패는 계속 진행
                }
              }
            } else {
              this.logger.warn(
                `Organizations API returned non-200 status: ${orgsResponse.status}`
              );
            }
          } catch (err: any) {
            this.logger.warn(
              `Failed to fetch organizations: ${err.message}${
                err.response ? `, status: ${err.response.status}` : ""
              }`
            );
            // 조직 목록 가져오기 실패는 계속 진행
          }
        } else {
          this.logger.debug(
            `No user token available, skipping organization fetch`
          );
        }

        // 기본 저장소 가져오기 (개인 + 협력자 + organization_member)
        let page = 1;
        let hasMorePages = true;

        this.logger.log(
          `Starting to fetch repositories from user/repos API for ${username}...`
        );

        while (hasMorePages && page <= 10) {
          // 최대 10페이지 (1000개 저장소)
          // affiliation 파라미터: owner(소유), collaborator(협력자), organization_member(조직 멤버)
          // all 값도 시도해볼 수 있지만, 일부 조직 저장소는 포함되지 않을 수 있음
          // visibility 파라미터 추가 시도: all (public + private)
          const paginatedUrl = userToken
            ? `${this.githubApiBase}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&visibility=all&page=${page}`
            : `${this.githubApiBase}/users/${username}/repos?per_page=100&sort=updated&page=${page}`;

          this.logger.debug(
            `Fetching repos from: ${paginatedUrl.substring(0, 100)}...`
          );

          try {
            const reposResponse = await axios.get(paginatedUrl, {
              headers: this.getHeaders(userToken),
              validateStatus: (status) => status < 500,
            });

            this.logger.debug(`API response status: ${reposResponse.status}`);

            if (reposResponse.status === 403) {
              this.logger.warn(`GitHub API rate limit reached for ${username}`);
              rateLimited = true;
              // rate limit이지만 일단 저장소 정보는 없음
              if (repos.length === 0) {
                this.logger.warn(
                  `No repos fetched due to rate limit, returning basic stats`
                );
                return this.getBasicStats(username, [], {}, true);
              }
              // 이미 가져온 저장소가 있으면 계속 진행
              break;
            }

            if (reposResponse.status === 422) {
              // 422 에러는 잘못된 파라미터 - 에러 응답 로그
              const errorMessage =
                reposResponse.data?.message || "Unknown error";
              this.logger.error(
                `422 Unprocessable Entity when fetching repos: ${errorMessage}. Response: ${JSON.stringify(
                  reposResponse.data
                )}`
              );
              // type 파라미터 없이 재시도
              const retryUrl = userToken
                ? `${this.githubApiBase}/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member&page=${page}`
                : `${this.githubApiBase}/users/${username}/repos?per_page=100&sort=updated&page=${page}`;

              this.logger.log(`Retrying without type parameter...`);
              const retryResponse = await axios.get(retryUrl, {
                headers: this.getHeaders(userToken),
                validateStatus: (status) => status < 500,
              });

              if (retryResponse.status === 200) {
                const pageRepos = retryResponse.data || [];
                repos.push(...pageRepos);
                this.logger.log(
                  `Fetched page ${page}: ${pageRepos.length} repos, total so far: ${repos.length}`
                );
                const linkHeader = retryResponse.headers.link;
                if (!linkHeader || !linkHeader.includes('rel="next"')) {
                  hasMorePages = false;
                } else if (pageRepos.length < 100) {
                  hasMorePages = false;
                }
                page++;
              } else {
                this.logger.error(
                  `Retry also failed with status ${retryResponse.status}`
                );
                hasMorePages = false;
              }
              continue;
            }

            if (reposResponse.status === 200) {
              const pageRepos = reposResponse.data || [];
              repos.push(...pageRepos);

              this.logger.log(
                `Fetched page ${page}: ${pageRepos.length} repos, total so far: ${repos.length}`
              );

              // Link 헤더에서 다음 페이지 확인
              const linkHeader = reposResponse.headers.link;
              if (!linkHeader || !linkHeader.includes('rel="next"')) {
                hasMorePages = false;
              } else if (pageRepos.length < 100) {
                // 100개 미만이면 마지막 페이지
                hasMorePages = false;
              }

              page++;
            } else {
              this.logger.warn(
                `Unexpected status ${
                  reposResponse.status
                } when fetching repos. Response: ${JSON.stringify(
                  reposResponse.data
                )}`
              );
              hasMorePages = false;
            }
          } catch (err: any) {
            this.logger.error(
              `Error fetching repos page ${page}: ${err.message}${
                err.response ? `, status: ${err.response.status}` : ""
              }`
            );
            if (err.response?.status === 403) {
              rateLimited = true;
              if (repos.length === 0) {
                return this.getBasicStats(username, [], {}, true);
              }
            }
            hasMorePages = false;
          }
        }

        if (repos.length > 0) {
          this.logger.log(
            `Fetched ${repos.length} repositories (including organization repos)`
          );
        }

        if (repos.length > 0) {
          this.logger.log(
            `Fetched ${repos.length} repositories (including organization repos)`
          );

          // 디버깅: 저장소 타입별 개수 확인 (실제 GitHub 로그인 기준)
          const personalRepos = repos.filter(
            (r) => !r.owner || r.owner.login === githubLogin
          );
          const orgRepos = repos.filter(
            (r) => r.owner && r.owner.login !== githubLogin
          );
          this.logger.log(
            `Personal repos: ${personalRepos.length}, Organization repos: ${orgRepos.length}`
          );

          // 조직 저장소 목록 출력 (디버깅)
          if (orgRepos.length > 0) {
            const orgNames = orgRepos
              .map((r) => r.owner?.login)
              .filter(Boolean);
            const uniqueOrgs = [...new Set(orgNames)];
            this.logger.log(
              `Organization names found in user/repos API: ${uniqueOrgs.join(
                ", "
              )}`
            );
            // 모든 조직 저장소 출력 (6ReactTeamproject 포함 여부 확인용)
            this.logger.log(
              `All organization repositories from user/repos API (${orgRepos.length} total):`
            );
            orgRepos.forEach((repo) => {
              this.logger.log(
                `  - ${repo.full_name} (org: ${repo.owner?.login}, updated: ${repo.updated_at}, private: ${repo.private})`
              );
            });

            // 조직 저장소 확인 (디버깅용)
            // owner.type이 "Organization"인 것만 실제 조직으로 간주 (사용자 이름 제외)
            const actualOrgRepos = orgRepos.filter(
              (r) => r.owner?.type === "Organization"
            );
            const allOrgNames = [
              ...new Set(
                actualOrgRepos.map((r) => r.owner?.login).filter(Boolean)
              ),
            ];
            this.logger.log(
              `Organization repositories found in user/repos API (actual orgs only): ${allOrgNames.join(
                ", "
              )}`
            );

            // user/repos API에서 발견된 조직들의 모든 저장소를 직접 조회
            // user/repos API는 일부 저장소만 반환할 수 있으므로, 각 조직의 모든 저장소를 직접 조회하여 추가
            if (userToken && allOrgNames.length > 0) {
              this.logger.log(
                `Fetching all repositories from actual organizations found in user/repos API: ${allOrgNames.join(
                  ", "
                )}`
              );

              for (const orgName of allOrgNames) {
                try {
                  const existingRepoNames = new Set(
                    repos.map((r) => r.full_name)
                  );

                  // 각 조직의 모든 저장소 직접 조회 (페이지네이션 처리)
                  let orgPage = 1;
                  let hasMoreOrgRepos = true;
                  let orgReposAdded = 0;

                  while (hasMoreOrgRepos && orgPage <= 10) {
                    const orgReposUrl = `${this.githubApiBase}/orgs/${orgName}/repos?per_page=100&page=${orgPage}`;
                    const orgReposResponse = await axios.get(orgReposUrl, {
                      headers: this.getHeaders(userToken),
                      timeout: 5000,
                      validateStatus: (status) => status < 500,
                    });

                    if (
                      orgReposResponse.status === 200 &&
                      orgReposResponse.data
                    ) {
                      const fetchedOrgRepos = orgReposResponse.data || [];
                      const newOrgRepos = fetchedOrgRepos.filter(
                        (r: any) => !existingRepoNames.has(r.full_name)
                      );

                      if (newOrgRepos.length > 0) {
                        repos.push(...newOrgRepos);
                        orgReposAdded += newOrgRepos.length;
                        // 기존 저장소 이름 집합 업데이트
                        newOrgRepos.forEach((r: any) => {
                          existingRepoNames.add(r.full_name);
                        });
                        this.logger.log(
                          `✓ Added ${newOrgRepos.length} repos from org ${orgName} (page ${orgPage}, total added: ${orgReposAdded})`
                        );
                      }

                      // 다음 페이지 확인
                      if (fetchedOrgRepos.length < 100) {
                        hasMoreOrgRepos = false;
                      } else {
                        orgPage++;
                      }
                    } else if (orgReposResponse.status === 403) {
                      this.logger.warn(
                        `⚠️  403 Forbidden when fetching repos from org ${orgName} (may need additional permissions)`
                      );
                      hasMoreOrgRepos = false;
                    } else if (orgReposResponse.status === 404) {
                      this.logger.warn(
                        `⚠️  404 Not Found: org ${orgName} not found or user doesn't have access`
                      );
                      hasMoreOrgRepos = false;
                    } else {
                      hasMoreOrgRepos = false;
                    }
                  }

                  if (orgReposAdded > 0) {
                    this.logger.log(
                      `✓ Total ${orgReposAdded} additional repos added from org ${orgName}`
                    );
                  }
                } catch (err: any) {
                  this.logger.warn(
                    `Failed to fetch additional repos from org ${orgName}: ${err.message}`
                  );
                  // 실패해도 계속 진행
                }
              }
            }
          } else {
            this.logger.log(`No organization repositories found.`);
          }
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
      // userToken이 있으면 토큰 기준으로 실제 GitHub 로그인 아이디를 다시 확인해서
      // 커밋 조회 및 author 매칭이 항상 올바른 계정 기준으로 동작하도록 함
      try {
        if (userToken) {
          // 인증된 사용자 정보 및 토큰 scope 확인
          const meResponse = await axios.get(`${this.githubApiBase}/user`, {
            headers: this.getHeaders(userToken),
            validateStatus: (status) => status < 500,
          });

          if (meResponse.status === 403) {
            this.logger.warn(
              `GitHub API rate limit reached for ${username} (authenticated user info)`
            );
            rateLimited = true;
            // 저장소 정보는 있으니 계속 진행
          } else if (meResponse.status === 200) {
            githubLogin = meResponse.data.login || username;
            publicRepos = meResponse.data.public_repos || 0;
            this.logger.log(`Authenticated GitHub user: ${githubLogin}`);

            // 토큰의 scope 확인 (GitHub API 응답 헤더에서)
            const tokenScopes =
              meResponse.headers["x-oauth-scopes"]?.split(",") || [];
            const requiredScopes = ["read:org", "repo"];
            const missingScopes = requiredScopes.filter(
              (scope) =>
                !tokenScopes.some((s: string) => s.trim().includes(scope))
            );

            if (missingScopes.length > 0) {
              permissionIssue = true;
              this.logger.error(
                `⚠️  Token missing required scopes: ${missingScopes.join(", ")}`
              );
              this.logger.error(
                `Current token scopes: ${tokenScopes.join(", ")}`
              );
              this.logger.error(
                `User needs to re-authenticate with GitHub to get updated scopes.`
              );
            } else {
              this.logger.log(
                `Token scopes verified: ${tokenScopes.join(", ")}`
              );
            }
          } else {
            this.logger.warn(
              `Unexpected status ${meResponse.status} when getting authenticated user info for ${username}`
            );
          }
        } else {
          // 토큰이 없으면 기존 방식대로 공개 사용자 정보만 조회
          const userResponse = await axios.get(
            `${this.githubApiBase}/users/${username}`,
            {
              headers: this.getHeaders(userToken),
              validateStatus: (status) => status < 500,
            }
          );

          if (userResponse.status === 403) {
            this.logger.warn(
              `GitHub API rate limit reached for ${username} (user info)`
            );
            rateLimited = true;
            // 저장소 정보는 있으니 계속 진행
          } else if (userResponse.status === 200) {
            publicRepos = userResponse.data.public_repos || 0;
          } else {
            this.logger.warn(
              `Unexpected status ${userResponse.status} when getting user info for ${username}`
            );
          }
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          this.logger.warn(
            `GitHub API rate limit reached for ${username} (user info)`
          );
          rateLimited = true;
          // 저장소 정보는 있으니 계속 진행
        } else {
          this.logger.warn(
            `Failed to get user info for ${username}: ${err.message}`
          );
        }
      }

      if (repos.length === 0) {
        // 저장소가 없으면 기본 정보만 반환
        return this.getBasicStats(username, [], {}, rateLimited);
      }

      const languages: Record<string, number> = {};
      let totalCommits = 0;
      const commitDates: string[] = [];

      // 각 repository의 언어 정보 수집 (모든 저장소에서 - 개인 + 조직)
      repos.forEach((repo) => {
        if (repo.language) {
          languages[repo.language] = (languages[repo.language] || 0) + 1;
        }
      });

      // 커밋 정보 수집을 위한 저장소 선택
      // 최근 업데이트된 저장소부터 처리 (최대 20개로 제한하여 로딩 시간 단축)
      // 하지만 조직 저장소는 우선적으로 포함
      const orgRepos = repos.filter(
        (r) => r.owner && r.owner.login !== githubLogin
      );
      const personalRepos = repos.filter(
        (r) => !r.owner || r.owner.login === githubLogin
      );

      // 최근 업데이트된 순으로 정렬 (조직 저장소 우선, 그 다음 최근 업데이트 순)
      const sortedOrgRepos = [...orgRepos].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      const sortedPersonalRepos = [...personalRepos].sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      // 조직 저장소 먼저, 그 다음 개인 저장소 (최대 20개)
      // 최근 업데이트된 저장소를 우선적으로 선택하여 최근 커밋 추적 정확도 향상
      const reposForCommits = [
        ...sortedOrgRepos.slice(0, 10), // 조직 저장소 최대 10개 (최근 업데이트 순)
        ...sortedPersonalRepos.slice(0, 10), // 개인 저장소 최대 10개 (최근 업데이트 순)
      ].slice(0, 20); // 전체 최대 20개

      this.logger.log(
        `Selected ${reposForCommits.length} repos for commit tracking: ${
          orgRepos.slice(0, 10).length
        } org repos, ${Math.min(personalRepos.length, 10)} personal repos`
      );

      this.logger.log(
        `Processing ${reposForCommits.length} repositories for commit data (out of ${repos.length} total repos)`
      );

      // 각 repository의 커밋 정보를 배치로 처리 (rate limit 방지)
      // 5개씩 묶어서 처리하여 병렬 처리 속도 향상 (rate limit 여유 있을 때)
      const batchSize = 5; // 병렬 처리 증가로 속도 향상
      let rateLimitHit = false;

      for (let i = 0; i < reposForCommits.length; i += batchSize) {
        if (rateLimitHit) break;

        const batch = reposForCommits.slice(i, i + batchSize);

        const commitPromises = batch.map(async (repo) => {
          try {
            // 조직 저장소도 포함하기 위해 full_name 사용
            const repoFullName = repo.full_name || `${username}/${repo.name}`;

            // 조직 저장소 여부 확인
            const isOrgRepo = repo.owner && repo.owner.login !== githubLogin;

            // 사용자가 작성한 커밋 가져오기
            // 모든 저장소에서 since 파라미터 없이 최근 커밋 가져오기 (최근 커밋 포함 보장)
            // 개인 저장소에서는 author 파라미터 사용, 조직 저장소는 모든 커밋 가져온 후 필터링
            const commitsUrl = isOrgRepo
              ? `${this.githubApiBase}/repos/${repoFullName}/commits?per_page=100`
              : `${this.githubApiBase}/repos/${repoFullName}/commits?per_page=100&author=${githubLogin}`;

            this.logger.debug(
              `Fetching commits for ${repoFullName} (organization: ${
                isOrgRepo ? "yes" : "no"
              }, using author filter: ${!isOrgRepo})`
            );

            // 디버그 로그 제거 (너무 많은 로그 방지)

            // 최근 1년 커밋 조회 (모든 커밋)
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
              this.logger.debug(
                `Failed to fetch commits for ${repoFullName}: status=${commitsResponse.status}, org=${isOrgRepo}`
              );
              return { repoCommits: 0, commitDates: [], rateLimited: false };
            }

            // 조직 저장소에서 응답 데이터 확인
            if (isOrgRepo) {
              this.logger.debug(
                `Org repo ${repoFullName} response: status=${
                  commitsResponse.status
                }, data length=${commitsResponse.data?.length || 0}`
              );
            }

            // 사용자 커밋 필터링
            // 조직 저장소에서는 모든 커밋을 필터링해야 함
            const commitDates: string[] = [];

            if (commitsResponse.data && commitsResponse.data.length > 0) {
              this.logger.debug(
                `Processing ${
                  commitsResponse.data.length
                } commits from ${repoFullName} (org: ${
                  isOrgRepo ? "yes" : "no"
                })`
              );

              commitsResponse.data.forEach((commit: any) => {
                // 사용자 확인: 여러 방법으로 확인
                const commitAuthorLogin = commit.author?.login?.toLowerCase();
                const commitAuthorName =
                  commit.commit?.author?.name?.toLowerCase();
                const commitAuthorEmail =
                  commit.commit?.author?.email?.toLowerCase();
                const usernameLower = githubLogin.toLowerCase();

                const isUserCommit =
                  commitAuthorLogin === usernameLower ||
                  commitAuthorName === usernameLower ||
                  (commitAuthorEmail &&
                    commitAuthorEmail.includes(usernameLower)) ||
                  (commitAuthorEmail &&
                    commitAuthorEmail.includes("@") &&
                    commitAuthorEmail.split("@")[0] === usernameLower);

                if (isUserCommit && commit.commit?.author?.date) {
                  commitDates.push(commit.commit.author.date);
                }
              });

              // 조직 저장소에서 커밋이 없으면 디버깅 정보 출력
              if (isOrgRepo && commitDates.length === 0) {
                if (commitsResponse.data.length > 0) {
                  const sampleCommit = commitsResponse.data[0];
                  this.logger.debug(
                    `No user commits found in org repo ${repoFullName}. Sample: author.login=${sampleCommit.author?.login}, author.name=${sampleCommit.commit?.author?.name}, author.email=${sampleCommit.commit?.author?.email}, looking for=${githubLogin}`
                  );
                } else {
                  this.logger.debug(
                    `No commits returned from org repo ${repoFullName}. This might be a permissions issue or the repo has no commits.`
                  );
                }
              }

              this.logger.debug(
                `Found ${
                  commitDates.length
                } user commits for ${repoFullName} (org: ${
                  isOrgRepo ? "yes" : "no"
                }, total commits: ${commitsResponse.data.length})`
              );

              // 조직 레포지토리의 경우 최근 커밋 날짜 상세 로그
              if (isOrgRepo && commitDates.length > 0) {
                const sortedCommitDates = [...commitDates]
                  .map((d) => new Date(d))
                  .sort((a, b) => b.getTime() - a.getTime());
                const mostRecentCommit = sortedCommitDates[0];
                const daysAgo = Math.floor(
                  (new Date().getTime() - mostRecentCommit.getTime()) /
                    (24 * 60 * 60 * 1000)
                );
                this.logger.log(
                  `🔍 Org repo ${repoFullName}: Most recent user commit=${mostRecentCommit.toISOString()} (${daysAgo} days ago), total user commits=${
                    commitDates.length
                  }`
                );
              }
            } else {
              // 조직 저장소에서 커밋이 없으면 더 자세한 정보 출력
              if (isOrgRepo) {
                this.logger.debug(
                  `No commits found for org repo ${repoFullName}. Response status: ${
                    commitsResponse.status
                  }, data: ${
                    commitsResponse.data ? "empty array" : "null/undefined"
                  }`
                );
              } else {
                this.logger.debug(
                  `No commits found for ${repoFullName} (org: no)`
                );
              }
            }

            // 총 커밋 수 추정 (간소화 - 추가 API 호출 제거하여 속도 향상)
            // 최근 1년 사용자 커밋 수를 기반으로 전체 커밋 수 추정
            let repoCommits = 0;
            const linkHeader = commitsResponse.headers.link;
            if (linkHeader && commitDates.length > 0) {
              const lastPageMatch = linkHeader.match(/page=(\d+)>; rel="last"/);
              if (lastPageMatch) {
                const lastPage = parseInt(lastPageMatch[1], 10);
                const oneYearUserCommits = lastPage * 100;
                // 최근 1년 사용자 커밋 수를 5배하여 전체 추정 (속도 개선을 위해 추가 API 호출 제거)
                repoCommits = oneYearUserCommits * 5;
              } else {
                repoCommits = commitDates.length * 20;
              }
            } else {
              repoCommits =
                commitDates.length > 0 ? commitDates.length * 20 : 0;
            }

            // 추가 페이지가 있으면 더 가져오기 (최근 1주일/1개월 정확도 향상)
            // 조직 저장소에서는 최근 커밋을 더 많이 가져와야 함
            let allCommitDates = [...commitDates];
            const linkHeader2 = commitsResponse.headers.link;
            // 조직 저장소는 since 파라미터 없이 가져오므로 더 많은 페이지 확인 필요
            const shouldFetchMorePages = isOrgRepo
              ? commitsResponse.data.length >= 100 // 조직 저장소는 100개 이상이면 더 가져오기
              : commitsResponse.data.length === 100; // 개인 저장소는 정확히 100개일 때만
            if (linkHeader2 && shouldFetchMorePages) {
              // 100개를 다 가져왔고 다음 페이지가 있으면 더 조회
              const lastPageMatch = linkHeader2.match(
                /page=(\d+)>; rel="last"/
              );
              if (lastPageMatch) {
                const lastPage = parseInt(lastPageMatch[1], 10);
                // 조직 저장소는 최근 커밋을 더 많이 가져와야 하므로 더 많은 페이지 조회
                const pagesToFetch = isOrgRepo
                  ? Math.min(lastPage, 10) // 조직 저장소: 최대 10페이지 (1000개 커밋)
                  : Math.min(lastPage, 5); // 개인 저장소: 최대 5페이지 (500개 커밋)

                for (let page = 2; page <= pagesToFetch; page++) {
                  try {
                    // 모든 저장소에서 since 파라미터 없이 최근 커밋부터 가져오기
                    const commitsUrlPage = isOrgRepo
                      ? `${this.githubApiBase}/repos/${repoFullName}/commits?per_page=100&page=${page}`
                      : `${this.githubApiBase}/repos/${repoFullName}/commits?per_page=100&author=${githubLogin}&page=${page}`;
                    const commitsResponsePage = await axios.get(
                      commitsUrlPage,
                      {
                        headers: this.getHeaders(userToken),
                        timeout: 5000,
                        validateStatus: (status) => status < 500,
                      }
                    );

                    if (
                      commitsResponsePage.status === 200 &&
                      commitsResponsePage.data &&
                      commitsResponsePage.data.length > 0
                    ) {
                      const beforePageCount = allCommitDates.length;
                      let pageUserCommits = 0;
                      commitsResponsePage.data.forEach((commit: any) => {
                        // 사용자 필터링 (조직 저장소의 경우 모든 커밋 필터링)
                        const commitAuthorLogin =
                          commit.author?.login?.toLowerCase();
                        const commitAuthorName =
                          commit.commit?.author?.name?.toLowerCase();
                        const commitAuthorEmail =
                          commit.commit?.author?.email?.toLowerCase();
                        const usernameLower = githubLogin.toLowerCase();

                        const isUserCommit =
                          commitAuthorLogin === usernameLower ||
                          commitAuthorName === usernameLower ||
                          (commitAuthorEmail &&
                            commitAuthorEmail.includes(usernameLower)) ||
                          (commitAuthorEmail &&
                            commitAuthorEmail.includes("@") &&
                            commitAuthorEmail.split("@")[0] === usernameLower);

                        if (isUserCommit && commit.commit?.author?.date) {
                          allCommitDates.push(commit.commit.author.date);
                          pageUserCommits++;
                        }
                      });

                      if (
                        isOrgRepo &&
                        page === 2 &&
                        pageUserCommits === 0 &&
                        commitsResponsePage.data.length > 0
                      ) {
                        const sampleCommit = commitsResponsePage.data[0];
                        this.logger.debug(
                          `Org repo ${repoFullName} page ${page}: no user commits. Sample: author.login=${sampleCommit.author?.login}, author.name=${sampleCommit.commit?.author?.name}, email=${sampleCommit.commit?.author?.email}, looking for=${githubLogin}`
                        );
                      }

                      // 조직 레포지토리의 각 페이지에서 최근 커밋 날짜 로그
                      if (isOrgRepo && pageUserCommits > 0) {
                        const pageCommitDates =
                          allCommitDates.slice(beforePageCount);
                        const sortedPageDates = pageCommitDates
                          .map((d) => new Date(d))
                          .sort((a, b) => b.getTime() - a.getTime());
                        if (sortedPageDates.length > 0) {
                          const mostRecent = sortedPageDates[0];
                          const daysAgo = Math.floor(
                            (new Date().getTime() - mostRecent.getTime()) /
                              (24 * 60 * 60 * 1000)
                          );
                          this.logger.log(
                            `📄 ${repoFullName} page ${page}: found ${pageUserCommits} user commits, most recent=${mostRecent.toISOString()} (${daysAgo} days ago)`
                          );
                        }
                      }
                    } else {
                      // 데이터가 없으면 중단
                      if (isOrgRepo) {
                        this.logger.debug(
                          `Org repo ${repoFullName} page ${page}: no data (status=${
                            commitsResponsePage.status
                          }, data length=${
                            commitsResponsePage.data?.length || 0
                          })`
                        );
                      }
                      break;
                    }
                  } catch (err: any) {
                    // 페이지 조회 실패는 중단
                    if (isOrgRepo) {
                      this.logger.debug(
                        `Error fetching page ${page} for org repo ${repoFullName}: ${err.message}`
                      );
                    }
                    break;
                  }
                }
              }
            }

            this.logger.debug(
              `Collected ${allCommitDates.length} total commit dates for ${repoFullName} (${commitDates.length} from first page)`
            );

            return {
              repoCommits,
              commitDates: allCommitDates,
              rateLimited: false,
            };
          } catch (err: any) {
            // 403 에러는 rate limit
            if (err.response?.status === 403) {
              rateLimitHit = true;
              this.logger.warn(`Rate limit reached: ${err.message}`);
              return { repoCommits: 0, commitDates: [], rateLimited: true };
            }

            // Repository 접근 불가능하거나 에러 발생 시 스킵
            this.logger.warn(
              `Failed to get commits for ${repo.full_name || repo.name}: ${
                err.message
              }`
            );
            return { repoCommits: 0, commitDates: [], rateLimited: false };
          }
        });

        // 배치 처리
        const batchResults = await Promise.all(commitPromises);
        batchResults.forEach(
          ({ repoCommits, commitDates: repoCommitDates }) => {
            totalCommits += repoCommits;
            // 모든 커밋 날짜 추가
            commitDates.push(...repoCommitDates);
          }
        );

        // Rate limit에 걸리지 않았고 다음 배치가 있으면 약간 대기 (rate limit 방지)
        if (!rateLimitHit && i + batchSize < reposForCommits.length) {
          await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms 대기 (속도 개선)
        }
      }

      // 커밋 패턴 계산 (날짜 문자열을 Date 객체로 변환하여 비교)
      const now = new Date();
      // 현재 시간 기준으로 7일 전 (정확히 7일 = 168시간)
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      // 현재 시간 기준으로 30일 전
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      // 현재 시간 기준으로 365일 전
      const lastYear = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      // 날짜 문자열을 Date 객체로 변환하여 정확한 비교
      // 빈 문자열이나 유효하지 않은 날짜 필터링
      const commitDatesParsed = commitDates
        .map((dateStr) => {
          try {
            const date = new Date(dateStr);
            // 유효한 날짜이고 미래가 아닌지 확인
            if (isNaN(date.getTime()) || date > now) {
              return null;
            }
            return date;
          } catch {
            return null;
          }
        })
        .filter((date): date is Date => date !== null);

      // 날짜를 최신순으로 정렬하여 최근 커밋 확인
      const sortedDates = [...commitDatesParsed].sort(
        (a, b) => b.getTime() - a.getTime()
      );

      // 최근 1주일 커밋 (lastWeek <= date <= now)
      const lastWeekCommits = sortedDates.filter(
        (date) => date >= lastWeek && date <= now
      );
      // 최근 1개월 커밋 (lastMonth <= date <= now)
      const lastMonthCommits = sortedDates.filter(
        (date) => date >= lastMonth && date <= now
      );
      // 최근 1년 커밋 (lastYear <= date <= now)
      const lastYearCommits = sortedDates.filter(
        (date) => date >= lastYear && date <= now
      );

      const commitPattern = {
        lastWeek: lastWeekCommits.length,
        lastMonth: lastMonthCommits.length,
        lastYear: lastYearCommits.length,
      };

      // 디버깅: 최근 커밋 날짜 확인
      if (sortedDates.length > 0) {
        const mostRecent = sortedDates[0];
        const oldest = sortedDates[sortedDates.length - 1];
        const daysSinceMostRecent = Math.floor(
          (now.getTime() - mostRecent.getTime()) / (24 * 60 * 60 * 1000)
        );

        this.logger.log(
          `📊 Commit date analysis: Most recent=${mostRecent.toISOString()} (${daysSinceMostRecent} days ago), Oldest=${oldest.toISOString()}, Total commits=${
            sortedDates.length
          }`
        );
        this.logger.log(
          `📅 Date thresholds: Last week=${lastWeek.toISOString()}, Last month=${lastMonth.toISOString()}, Now=${now.toISOString()}`
        );
        this.logger.log(
          `📈 Commit pattern: week=${commitPattern.lastWeek}, month=${commitPattern.lastMonth}, year=${commitPattern.lastYear}`
        );

        // 최근 1주일 커밋 상세 정보
        if (lastWeekCommits.length > 0) {
          this.logger.log(
            `✅ Found ${
              lastWeekCommits.length
            } commits in last week: ${lastWeekCommits
              .slice(0, 5)
              .map((d) => d.toISOString())
              .join(", ")}${lastWeekCommits.length > 5 ? "..." : ""}`
          );
        } else {
          this.logger.warn(
            `⚠️  No commits in last week. Most recent commit is ${daysSinceMostRecent} days old.`
          );
        }

        // 최근 1개월 커밋 상세 정보
        if (lastMonthCommits.length > 0 && lastWeekCommits.length === 0) {
          this.logger.log(
            `ℹ️  Found ${lastMonthCommits.length} commits in last month (but 0 in last week)`
          );
        }
      } else {
        this.logger.warn(
          `⚠️  No valid commit dates found. Total date strings: ${commitDates.length}`
        );
      }

      // 최근 활동 패턴 (간단한 버전)
      const recentActivity = this.calculateRecentActivity(commitDates);

      // 총 커밋 수 계산
      // totalCommits가 0이면 수집된 커밋 날짜 수를 사용 (최근 활동 기반 추정)
      const result: GitHubStats = {
        totalCommits:
          totalCommits > 0
            ? totalCommits
            : commitDates.length > 0
            ? commitDates.length * 10
            : 0, // 추정된 총 커밋 수
        totalRepositories: repos.length,
        publicRepositories: repos.length, // 실제 접근 가능한 저장소 수 사용
        languages,
        commitPattern,
        recentActivity,
        rateLimited: rateLimitHit || rateLimited, // 커밋 정보 가져올 때 rate limit 발생했는지
        permissionIssue, // 권한 문제 (scope 부족 등)
      };

      this.logger.log(
        `Stats for ${username}: ${totalCommits} total commits, ${commitDates.length} commit dates collected, ${commitPattern.lastWeek} commits last week, ${commitPattern.lastMonth} commits last month`
      );

      // 성공적으로 데이터를 가져왔으면 캐시에 저장
      // 단, rate limit이 발생했거나 에러가 있으면 캐시하지 않음 (다음 요청에서 재시도)
      if (!rateLimitHit && !rateLimited && commitDates.length > 0) {
        this.setCache(username, result);
      } else {
        this.logger.debug(
          `Not caching stats for ${username} due to rate limit or no commits`
        );
      }

      return result;
    } catch (error: any) {
      // 예상치 못한 에러 발생 시 기본 정보라도 반환 (이미 수집한 저장소 정보 활용)
      this.logger.error(
        `Unexpected error getting GitHub stats for ${username}: ${error.message}`
      );
      // 이미 저장소 정보는 수집했을 수 있으므로 그것을 활용
      if (repos.length > 0) {
        return this.getBasicStats(username, repos, {}, false, permissionIssue);
      }
      return this.getBasicStats(username, [], {}, true, permissionIssue);
    }
  }

  // 기본 통계 정보 반환 (에러 발생 시)
  private getBasicStats(
    username: string,
    repos: any[],
    languages: Record<string, number>,
    rateLimited: boolean = true,
    permissionIssue: boolean = false
  ): GitHubStats {
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
      permissionIssue,
    };
  }

  // 최근 활동 패턴 계산
  private calculateRecentActivity(
    commitDates: string[]
  ): Array<{ date: string; commits: number }> {
    const activity: Record<string, number> = {};
    const now = new Date();
    const days = 30; // 최근 30일

    // 최근 30일간의 활동 초기화
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      activity[dateStr] = 0;
    }

    // 커밋 날짜로 활동 계산
    commitDates.forEach((dateStr) => {
      const date = new Date(dateStr).toISOString().split("T")[0];
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
