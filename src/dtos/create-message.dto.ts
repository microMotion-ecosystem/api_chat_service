import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { HydratedDocument, Model, Types } from "mongoose";
import { MODEL, MSG_STATUS, MSG_TYPE } from "../types/enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

@Schema({ timestamps: true })
export class CreateMessageDto {
    @ApiProperty({
        description: 'the message body',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiPropertyOptional({
        description: 'the message type',
        type: String,
        required: false
    })
    @IsMongoId()
    @IsOptional()
    senderId?: string;
    
    @ApiPropertyOptional({
        description: 'enable or desable llm',
        type:Boolean,
        required: false
    })
    @IsBoolean()
    @IsOptional()
    enableLLM: boolean;

    @ApiProperty({
        description: 'session id of the message',
        type: String
    })
    @IsMongoId()
    sessionId: string;

    @ApiPropertyOptional({
        description: 'llm type that will respond to the message',
        type: Model,
        required: false
    })
    @IsEnum(MODEL)
    @IsOptional()
    llmType: string;

    @ApiPropertyOptional({
        description: 'metadata of the message',
        type: Object,
        required: false
    })
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({
        description: 'additional fields of the message',
        type: Object,
        required: false
    })
    @IsOptional()
    additionalField?: Record<string, any>;
}
