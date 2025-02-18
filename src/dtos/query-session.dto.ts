import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class QuerySessionDto {
  @ApiPropertyOptional({
    description: 'page number',
    type:String,
    required: false
  })
  @IsOptional()
  page: string;

  @ApiPropertyOptional({
    description: 'limet of documents for single page',
    type:String,
    required: false
  })
  @IsOptional()
  limit: string;

  @ApiPropertyOptional({
    description: 'keyword to search',
    type:String,
    required: false
  })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'title of the session',
    type:String,
    required: false
  })
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'time of session creation',
    type:String,
    required: false
  })
  @IsOptional()
  createdAt: object;

  @ApiPropertyOptional({
    description: 'id of user that created  the session',
    type:String,
    required: false
  })
  @IsOptional()
  createdBy?: string;


}
