// 사용자 정보 수정 요청 DTO
import { IsString, MinLength, IsArray, IsOptional } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  nickname?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  techStacks?: string[];

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}

