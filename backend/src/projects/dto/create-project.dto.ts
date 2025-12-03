// 프로젝트 생성 요청 DTO
import { IsString, IsNotEmpty, IsArray, IsOptional, IsDateString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  shortDescription: string;

  @IsArray()
  @IsString({ each: true })
  neededRoles: string[];

  @IsArray()
  @IsString({ each: true })
  requiredStacks: string[];

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
