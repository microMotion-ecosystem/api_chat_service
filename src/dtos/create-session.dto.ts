import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { HydratedDocument, Types } from "mongoose";
import { MSG_STATUS, MSG_TYPE } from "../types/enum";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";


@Schema({ timestamps: true })
export class CreateSessionDto{
    
    @ApiProperty({
        description: 'title name of the session',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiPropertyOptional({
        description: 'id of the session creator',
        type: String,
        required: false
    })
    @IsMongoId()
    @IsOptional()
    createdBy?: string;

    @ApiPropertyOptional({
        description: 'metadata of the message',
        type: Object,
        required: false
    })
    @IsOptional()
    @IsObject()
    metadata?: any;

    @ApiPropertyOptional({
        description: 'additional fields of the message',
        type: Object,
        required: false
    })
    @IsOptional()
    @IsObject()
    additionalField?: any;
}
