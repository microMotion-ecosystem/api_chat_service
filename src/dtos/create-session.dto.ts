import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsEnum, IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString } from "class-validator";
import { HydratedDocument, Types } from "mongoose";
import { MSG_STATUS, MSG_TYPE } from "../types/enum";


@Schema({ timestamps: true })
export class CreateSessionDto{
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsMongoId()
    @IsOptional()
    createdBy?: string;

    @IsOptional()
    @IsObject()
    metadata?: any;

    @IsOptional()
    @IsObject()
    additionalField?: any;
}
