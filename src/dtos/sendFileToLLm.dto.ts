import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Model } from "mongoose";
import { MODEL } from "src/types/enum";

export class  UploadFileMessageDto {

    @ApiProperty({
        description: 'message body',
        type:String
      })
    @IsString()
    @IsNotEmpty()
    sessionId: string;
    
    @ApiPropertyOptional({
        description: 'llm type that will respond to the message',
        type: Model,
        required: false
    })
    
    @IsEnum(MODEL)
    @IsOptional()
    llmType?: string;
    
    @ApiPropertyOptional({
        description: 'additional user text with uploaded file',
        type:String,
        required: false
      })
    @IsString()
    @IsOptional(  )
    text?: string;
    
    @ApiPropertyOptional({
        description: 'message body',
        type:String
      })
    @IsString()
    @IsOptional()
    stream?: string;
}
