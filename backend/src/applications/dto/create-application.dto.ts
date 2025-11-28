// 참여 신청 요청 DTO
import { IsString, IsOptional } from 'class-validator';

export class CreateApplicationDto {
  @IsString()
  @IsOptional()
  message?: string;
}
