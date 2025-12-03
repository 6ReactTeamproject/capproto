// 옵셔널 JWT 인증 가드 - 인증이 있으면 사용자 정보 설정, 없으면 통과
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 인증이 없어도 통과하도록 설정
    const result = super.canActivate(context);
    
    if (result instanceof Promise) {
      return result.catch(() => true);
    }
    
    if (result instanceof Observable) {
      return result.pipe(catchError(() => of(true)));
    }
    
    return result;
  }

  handleRequest(err: any, user: any) {
    // 에러가 있어도 사용자가 없으면 null 반환
    return user || null;
  }
}

