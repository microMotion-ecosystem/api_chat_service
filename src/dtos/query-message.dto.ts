import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { MSG_TYPE } from 'src/types/enum';

export class QueryMessageDto {
  @ApiPropertyOptional({
    description: 'page number',
    type: String,
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
    type: String,
    required: false
  })
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'time of createion issue',
    type: String,
    required: false
  })
  @IsOptional()
  createdAt: object;

  @ApiPropertyOptional({
    description: 'id of the user that created message',
    type: String,
    required: false
  })
  @IsOptional()
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'message body',
    type: String,
    required: false
  })
  @IsOptional()
  body?: string;

  @ApiPropertyOptional({
    description: 'id of the sender user',
    type: String,
    required: false
  })
  @IsOptional()
  senderId?:string;

  @ApiPropertyOptional({
    description: 'id of the session for the messages',
    type: String,
    required: false
  })
  @IsOptional()
  sessionId?:string;

  @ApiPropertyOptional({
    description: 'type of the message user | assistant | system',
    type: MSG_TYPE,
    required: false
  })
  @IsOptional()
  messageType?: MSG_TYPE;

}
