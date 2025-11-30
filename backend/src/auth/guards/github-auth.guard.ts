// GitHub OAuth 가드 - 환경 변수 확인 후 GitHub 인증 진행
import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GitHubAuthGuard extends AuthGuard('github') {
  constructor(private configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // GitHub OAuth 설정 확인
    const clientID = this.configService.get<string>('GITHUB_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GITHUB_CLIENT_SECRET');
    
    // 예시 값이나 더미 값 체크
    const isInvalidClientID = !clientID || 
      clientID === 'dummy-client-id' || 
      clientID === 'your_github_client_id_here' ||
      clientID.trim() === '';
    
    const isInvalidClientSecret = !clientSecret || 
      clientSecret === 'dummy-client-secret' || 
      clientSecret === 'your_github_client_secret_here' ||
      clientSecret.trim() === '';
    
    if (isInvalidClientID || isInvalidClientSecret) {
      throw new BadRequestException(
        'GitHub OAuth가 설정되지 않았습니다. .env 파일에 실제 GITHUB_CLIENT_ID와 GITHUB_CLIENT_SECRET을 설정해주세요. GitHub에서 OAuth App을 생성하여 Client ID와 Secret을 받아야 합니다.'
      );
    }

    // 환경 변수가 설정되어 있으면 부모 클래스의 canActivate 호출
    return super.canActivate(context);
  }
}

