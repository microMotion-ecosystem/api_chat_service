import { IsString } from "class-validator";
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryAcceptInvitationDto {
    @ApiPropertyOptional({
        description: 'session id to join after accept invitation',
        type:String
    })
    @IsString()
    sessionId: string;
}
