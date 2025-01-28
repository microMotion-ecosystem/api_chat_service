import { PartialType } from "@nestjs/mapped-types";
import { CreateMessageDto } from "./create-message.dto";
import { IsString } from "class-validator";

export class UpdateAssetDto extends PartialType(CreateMessageDto) {} 


export class  UpdateMessageBodyDto {

    @IsString()
    body: string;
}