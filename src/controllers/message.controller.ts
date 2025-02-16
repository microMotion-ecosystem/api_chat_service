import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse} from "@nestjs/swagger";
import {JwtAuthGuard} from "../core/jwt-auth-guard/jwt-auth.guard";
import { ResponseDto } from '../dtos/response.dto';
import { ChatService } from 'src/services/chat.service';
import { QueryModelDto } from 'src/dtos/query-model-dto';
import { MessageService } from 'src/services/message.service';
import { CreateMessageDto } from 'src/dtos/create-message.dto';
import { UpdateMessageBodyDto } from 'src/dtos/update-message.dto';
import { AskLLMDto } from 'src/dtos/ask-llm.dto';

@Controller('message')
export class MessageController {
    constructor(
        private readonly chatService: ChatService,
        private readonly messageService: MessageService
    ) { }


    @Post('llm/:llm_type')
    @ApiOperation({summary: 'Send message to LLM'})
    @ApiParam({
        name: 'llm_type',
        description: 'type of llm you want to respond to the message',
        type: QueryModelDto
    })
    @ApiBody({
        type: AskLLMDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Message sent successfully to llm'
    })
    async sendMessageToLLm(@Param() llm_type: QueryModelDto, @Body() body: AskLLMDto) {
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
    @ApiOperation({summary: 'Get all messages for he session'})
    @ApiQuery({
        name: 'filter',
        description: 'Filter session messages by various criteria',
        required: false,
        type: Object,
    })
    @ApiParam({
        name: 'sessionId',
        description: 'the id of the session to get its messages',
        type: String
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully get session messages'
    })
    async getSessionMessages(
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
    @ApiOperation({summary: 'Create a new message'})
    @ApiBody({
        type: CreateMessageDto,
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully created message'
    })
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
    @ApiOperation({summary: 'Update message by id'})
    @ApiParam({
        name: 'id',
        description: 'id of he message to update',
        type: String
    })
    @ApiBody({
        type: UpdateMessageBodyDto,
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully Updated message'
    })
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
    @ApiOperation({summary: 'delete message by id'})
    @ApiParam({
        name: 'id',
        description: 'id of the message to delete',
        type: String
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully deleted message'
    })
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
}
