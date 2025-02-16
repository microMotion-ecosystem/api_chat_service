import { PartialType } from "@nestjs/mapped-types";
import { CreateSessionDto } from "./create-session.dto";
import { IsEmail, IsMongoId, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateAssetDto extends PartialType(CreateSessionDto) {}


export class UpdateSessionRenameDto {
    @ApiProperty({
        description: 'title of the session',
        type:String
        })
    @IsString()
    title: string;
}
export class UpdateSessionAddParticipantDto {
    @ApiProperty({
        description: 'participant email to add',
        type:String
      })
    @IsEmail()
    email:string;
}

export class UpdateSessionRemoveParticipantDto {
    @ApiProperty({
        description: 'participant email to remove',
        type:String
      })
    @IsEmail()
    email:string;
}
