// 인증 서비스 - 회원가입, 로그인, JWT 토큰 생성
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // 이메일 중복 체크
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 닉네임 중복 체크
    const existingNickname = await this.prisma.user.findUnique({
      where: { nickname: registerDto.nickname },
    });
    if (existingNickname) {
      throw new ConflictException('이미 존재하는 닉네임입니다.');
    }

    // 비밀번호 해시
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // 사용자 생성
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        nickname: registerDto.nickname,
        role: registerDto.role,
        techStacks: '[]',
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        techStacks: true,
      },
    });

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user,
      accessToken,
    };
  }

  async login(loginDto: LoginDto) {
    // 사용자 찾기
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 비밀번호 검증
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // JWT 토큰 생성
    const accessToken = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        role: user.role,
        techStacks: user.techStacks,
      },
      accessToken,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        techStacks: true,
      },
    });
    return user;
  }
}
