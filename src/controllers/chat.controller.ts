import { Body, Controller, Get, HttpException, Param, Post, UseGuards } from '@nestjs/common';
import {AppService} from '../services/app.service';
import {ApiBearerAuth, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {JwtAuthGuard} from "../core/jwt-auth-guard/jwt-auth.guard";
import { ResponseDto } from '../dtos/response.dto';
import { ChatService } from 'src/services/chat.service';

@Controller('chat')
export class ChatController {
    constructor(private readonly appService: AppService,
        private readonly chatService: ChatService,
    ) { }
    @Post('llm/:llm_type')
    async sendMessageToLLm(@Param('llm_type') llmType: string, @Body() body: {message: string}) {
        try{
            console.log('llmType', llmType);
            console.log('message', body.message);
            const response = await this.chatService.sendMessageToLLm(llmType, body.message);
            return ResponseDto.ok(response);
        } catch (err) {
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }
    @Get()
    // @ApiBearerAuth('access-token')
    // @ApiOperation({summary: 'Check if the API is working'})
    // @ApiResponse({status: 200, description: 'API is working correctly.'})
    isWorking(): ResponseDto<string> {
      return ResponseDto.ok(this.appService.isWorking());
      // return ResponseDto.throwError(this.appService.isWorking());
    }


    @UseGuards(JwtAuthGuard)
    @Get('api/v1/demo')
    @ApiBearerAuth('access-token')
    @ApiOperation({summary: 'Demo route'})
    @ApiResponse({status: 200, description: 'Returns a demo text.'})
    demo(): ResponseDto {
        return ResponseDto.msg('demo');
    }
}
