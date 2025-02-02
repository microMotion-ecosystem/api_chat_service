import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {JwtAuthGuard} from "../core/jwt-auth-guard/jwt-auth.guard";
import { ResponseDto } from '../dtos/response.dto';
import { ChatService } from 'src/services/chat.service';
import { QueryModelDto } from 'src/dtos/query-model-dto';
import { MessageService } from 'src/services/message.service';
import { CreateMessageDto } from 'src/dtos/create-message.dto';
import { UpdateMessageBodyDto } from 'src/dtos/update-message.dto';

@Controller('message')
export class MessageController {
    constructor(
        private readonly chatService: ChatService,
        private readonly messageService: MessageService
    ) { }

    @Post('llm/:llm_type')
    async sendMessageToLLm(@Param() llm_type: QueryModelDto, @Body() body: {message: string}) {
        const llmType = llm_type.llm_type;
        try{
            console.log('llmType', llmType);
            console.log('message', body.message);
            const response = await this.chatService.sendMessageToLLm(llmType, body.message);
            return ResponseDto.ok(response);
        } catch (err) {
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

        @Get('sessions/:sessionId')
        @UseGuards(JwtAuthGuard)
        async getUserSessions(
            @Param('sessionId') sessionId: string,
            @Query('filter') filter: any,
            @Query('pageIndex') pageIndex: number = 1,
            @Query('pageSize') pageSize: number = 50,
            @Request() req: any
        ) {
            try{
                if (!filter) {
                    filter = {}
                }
                const userId = req.user.userId;
                const [sessions, metadata] = await this.messageService.getsessionMessages(
                    filter, pageIndex, pageSize, userId, sessionId);
                return ResponseDto.ok(sessions, metadata);
            } catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
        }

    @Post()
    @UseGuards(JwtAuthGuard)
    async createMesssage(@Body() body:CreateMessageDto, @Request() req: any) {
        try {
            const user = req.user;
            const response = await this.messageService.createMessage(body, user);
            console.log('response', response);
            return ResponseDto.ok(response);
        } catch (err) {
            console.log('err', err);
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Put(':id')
    @UseGuards(JwtAuthGuard)
    async updateMessage(@Param('id') id: string, @Body() data: UpdateMessageBodyDto, @Request() req: any) {
        try {
            const userId = req.user.userId;
            const response = await this.messageService.updateMessage(id, userId, data);
            return ResponseDto.ok(response);
        } catch (err) {
            console.log('err', err);
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    async deleteMessage(@Param('id') id: string, @Request() req: any) {
        try {
            const userId = req.user.userId;
            await this.messageService.deleteMessage(id, userId);
            return ResponseDto.ok('message deleted successfully');
        } catch (err) {
            console.log('err', err);
            return ResponseDto.throwBadRequest(err.message, err);
        }
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
