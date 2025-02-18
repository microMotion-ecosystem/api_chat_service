import { PartialType } from "@nestjs/mapped-types";
import { CreateMessageDto } from "./create-message.dto";
import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAssetDto extends PartialType(CreateMessageDto) {} 


export class  UpdateMessageBodyDto {

    @ApiProperty({
        description: 'message body',
        type:String
      })
    @IsString()
    body: string;
}
