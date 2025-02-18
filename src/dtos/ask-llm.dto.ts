import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class AskLLMDto {
    
    @ApiProperty({
        description: 'message prompt to send to llm',
        type: String
    })
    @IsString()
    @IsNotEmpty()
    message: string;
}
