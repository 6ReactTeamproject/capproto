// 회원가입 요청 DTO
import { IsEmail, IsString, MinLength, IsEnum, IsArray, IsOptional } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  @MinLength(2)
  nickname: string;

  @IsEnum(UserRole)
  role: UserRole;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStacks?: string[];

  @IsString()
  @IsOptional()
  country?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  portfolioLinks?: string[];

  @IsArray()
  @IsOptional()
  experience?: Array<{
    title: string;
    role: string;
    period: string;
    description: string;
  }>;
}
