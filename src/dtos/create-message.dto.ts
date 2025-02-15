import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { HydratedDocument, Model, Types } from "mongoose";
import { MODEL, MSG_STATUS, MSG_TYPE } from "../types/enum";

@Schema({ timestamps: true })
export class CreateMessageDto {
    @IsString()
    @IsNotEmpty()
    body: string;

    @IsMongoId()
    @IsOptional()
    senderId?: string;

    @IsBoolean()
    @IsOptional()
    enableLLM: boolean;

    @IsMongoId()
    sessionId: string;

    @IsEnum(MODEL)
    @IsOptional()
    llmType: string;

    @IsOptional()
    metadata?: Record<string, any>;

    @IsOptional()
    additionalField?: Record<string, any>;
}
