import { IsOptional } from 'class-validator';

export class QueryMessageDto {
  @IsOptional()
  page: string;

  @IsOptional()
  limit: string;

  @IsOptional()
  keyword?: string;

  @IsOptional()
  createdAt: object;

  @IsOptional()
  createdBy?: string;

  @IsOptional()
  body?: string;

  @IsOptional()
  senderId?:string;

  @IsOptional()
  sessionId?:string;

  @IsOptional()
  messageType?:string;

}
