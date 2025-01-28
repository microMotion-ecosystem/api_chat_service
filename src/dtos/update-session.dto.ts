import { PartialType } from "@nestjs/mapped-types";
import { CreateSessionDto } from "./create-session.dto";
import { IsMongoId, IsString } from "class-validator";

export class UpdateAssetDto extends PartialType(CreateSessionDto) {}

export class UpdateSessionAddParticipantDto {
    @IsMongoId()
    participantId: string;
}

export class UpdateSessionRenameDto {
    @IsString()
    title: string;
}