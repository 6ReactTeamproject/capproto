// GitHub OAuth 전략
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GitHubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const clientID = configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = configService.get<string>('GITHUB_CLIENT_SECRET');
    
    // GitHub OAuth 설정이 없으면 기본값으로 초기화 (실제 사용 시 에러 발생)
    super({
      clientID: clientID || 'dummy-client-id',
      clientSecret: clientSecret || 'dummy-client-secret',
      callbackURL: configService.get<string>('GITHUB_CALLBACK_URL') || 'http://localhost:4000/auth/github/callback',
      scope: ['user:email', 'read:org', 'repo'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    const { id, username, emails, displayName } = profile;
    const email = emails?.[0]?.value || null;
    const nickname = displayName || username || `github_${id}`;

    const result = await this.authService.validateGitHubUser({
      githubId: id.toString(),
      githubUsername: username,
      email,
      nickname,
      accessToken,
    });

    // Passport는 validate 메서드의 반환값을 req.user에 저장
    // 여기서는 전체 결과 객체를 반환하여 컨트롤러에서 사용할 수 있도록 함
    return result;
  }
}

