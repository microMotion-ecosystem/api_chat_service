import { Body, Controller, Get, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse} from "@nestjs/swagger";
import { ResponseDto } from '../dtos/response.dto';
import { ChatService } from 'src/services/chat.service';
import { QueryModelDto } from 'src/dtos/query-model-dto';
import { AskLLMDto } from 'src/dtos/ask-llm.dto';

@Controller('chat')
export class ChatController {
    constructor(private readonly chatService: ChatService) { }
    
    @Post('llm/:llm_type')
    @ApiOperation({summary: 'send message to llm'})
    @ApiParam({
        name: 'llm_type',
        description: 'type of llm you want to respond to the message',
        type: QueryModelDto
    })
    @ApiResponse({
        status: 200,
        description: 'successfully get answer from llm',
    })
    async sendMessageToLLm(@Param() llm_type: QueryModelDto, @Body() body: AskLLMDto) {
        const llmType = llm_type.llm_type;
        try{
            console.log('llmType', llmType);
            console.log('message', body.message);
            const response = await this.chatService.callLLM(llmType, body.message);
            return ResponseDto.ok(response);
        } catch (err) {
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }
}
