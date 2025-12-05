// 인증 서비스 - 회원가입, 로그인, JWT 토큰 생성
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../common/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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
        techStacks: JSON.stringify(registerDto.techStacks || []),
        country: registerDto.country,
        portfolioLinks: JSON.stringify(registerDto.portfolioLinks || []),
        experience: JSON.stringify(registerDto.experience || []),
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

    // GitHub 로그인 사용자는 비밀번호가 없을 수 있음
    if (!user.passwordHash) {
      throw new UnauthorizedException('비밀번호로 로그인할 수 없습니다. GitHub 로그인을 사용해주세요.');
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
        country: true,
        portfolioLinks: true,
        experience: true,
        githubId: true,
        githubUsername: true,
      },
    });
    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    // 닉네임 변경 시 중복 체크
    if (updateUserDto.nickname) {
      const existingNickname = await this.prisma.user.findUnique({
        where: { nickname: updateUserDto.nickname },
      });
      if (existingNickname && existingNickname.id !== userId) {
        throw new ConflictException('이미 존재하는 닉네임입니다.');
      }
    }

    // 비밀번호 변경 시 해시
    let passwordHash: string | undefined;
    if (updateUserDto.password) {
      passwordHash = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 업데이트할 데이터 준비
    const updateData: any = {};
    if (updateUserDto.nickname) {
      updateData.nickname = updateUserDto.nickname;
    }
    if (updateUserDto.techStacks !== undefined) {
      updateData.techStacks = JSON.stringify(updateUserDto.techStacks);
    }
    if (updateUserDto.country !== undefined) {
      updateData.country = updateUserDto.country;
    }
    if (updateUserDto.portfolioLinks !== undefined) {
      updateData.portfolioLinks = JSON.stringify(updateUserDto.portfolioLinks);
    }
    if (updateUserDto.experience !== undefined) {
      updateData.experience = JSON.stringify(updateUserDto.experience);
    }
    if (passwordHash) {
      updateData.passwordHash = passwordHash;
    }

    // 사용자 정보 업데이트
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        techStacks: true,
        country: true,
        portfolioLinks: true,
        experience: true,
        githubId: true,
        githubUsername: true,
      },
    });

    return user;
  }

  // GitHub OAuth 사용자 검증 및 생성/로그인
  async validateGitHubUser(githubData: {
    githubId: string;
    githubUsername: string;
    email: string | null;
    nickname: string;
    accessToken: string;
  }) {
    // GitHub ID로 기존 사용자 찾기
    let user = await this.prisma.user.findUnique({
      where: { githubId: githubData.githubId },
    });

    if (user) {
      // 기존 GitHub 사용자 - 로그인 시 토큰 갱신
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          githubToken: githubData.accessToken, // 토큰 갱신
        },
      });

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

    // 이메일로 기존 사용자 찾기 (일반 회원가입 사용자가 GitHub 연동하는 경우)
    if (githubData.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: githubData.email },
      });

      if (existingUser) {
        // 기존 사용자에 GitHub 정보 연동
        const updatedUser = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            githubId: githubData.githubId,
            githubUsername: githubData.githubUsername,
            githubToken: githubData.accessToken, // GitHub 토큰 저장
          },
          select: {
            id: true,
            email: true,
            nickname: true,
            role: true,
            techStacks: true,
          },
        });

        const accessToken = this.jwtService.sign({
          sub: updatedUser.id,
          email: updatedUser.email,
        });

        return {
          user: updatedUser,
          accessToken,
        };
      }
    }

    // 새 사용자 생성 (GitHub로만 가입)
    // 닉네임 중복 체크 및 처리
    let nickname = githubData.nickname;
    let nicknameExists = await this.prisma.user.findUnique({
      where: { nickname },
    });

    if (nicknameExists) {
      nickname = `${githubData.nickname}_${githubData.githubId.slice(0, 6)}`;
    }

    // 이메일이 없는 경우 임시 이메일 생성
    const email = githubData.email || `github_${githubData.githubId}@github.local`;

    const newUser = await this.prisma.user.create({
      data: {
        email,
        nickname,
        role: 'DEVELOPER', // 기본값
        techStacks: JSON.stringify([]),
        githubId: githubData.githubId,
        githubUsername: githubData.githubUsername,
        githubToken: githubData.accessToken, // GitHub 토큰 저장
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        techStacks: true,
      },
    });

    const accessToken = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
    });

    return {
      user: newUser,
      accessToken,
    };
  }

  // 기존 사용자의 GitHub 연동
  async linkGitHub(userId: string, githubData: {
    githubId: string;
    githubUsername: string;
  }) {
    // GitHub ID가 이미 다른 사용자에게 연결되어 있는지 확인
    const existingGitHubUser = await this.prisma.user.findUnique({
      where: { githubId: githubData.githubId },
    });

    if (existingGitHubUser && existingGitHubUser.id !== userId) {
      throw new ConflictException('이미 다른 계정에 연결된 GitHub 계정입니다.');
    }

    // 현재 사용자에 GitHub 정보 연동
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        githubId: githubData.githubId,
        githubUsername: githubData.githubUsername,
      },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        techStacks: true,
        githubId: true,
        githubUsername: true,
      },
    });

    return user;
  }
}
