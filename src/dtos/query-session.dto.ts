import { IsOptional } from 'class-validator';

export class QuerySessionDto {
  @IsOptional()
  page: string;

  @IsOptional()
  limit: string;

  @IsOptional()
  keyword?: string;

  @IsOptional()
  title?: string;


  @IsOptional()
  createdAt: object;

  @IsOptional()
  createdBy?: string;


}
