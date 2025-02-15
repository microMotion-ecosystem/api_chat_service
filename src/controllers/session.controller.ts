import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import {ApiBearerAuth, ApiOperation, ApiResponse} from "@nestjs/swagger";
import {JwtAuthGuard} from "../core/jwt-auth-guard/jwt-auth.guard";
import { ResponseDto } from '../dtos/response.dto';
import { ChatService } from 'src/services/chat.service';
import { QueryModelDto } from 'src/dtos/query-model-dto';
import { CreateSessionDto } from "src/dtos/create-session.dto";
import { SessionService } from 'src/services/session.service';
import { UpdateSessionAddParticipantDto, UpdateSessionRenameDto } from 'src/dtos/update-session.dto';
import { resolveSoa } from 'dns';
import { RoleGuard } from 'src/core/role/role.guard';
import { Role } from 'src/core/role/role.decorator';

@Controller('session')
export class SessionController {
    constructor(
        private readonly chatService: ChatService,
        private readonly sessionService: SessionService
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

    @Get()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(['manager'])
    async getsessions(
        @Query('filter') filter: any,
        @Query('pageIndex') pageIndex: number = 1,
        @Query('pageSize') pageSize: number = 50,
    ) {
        try{
            if (!filter) {
                filter = {}
            }
            const [sessions, metadata] = await this.sessionService.getSessions(filter, pageIndex, pageSize);
            return ResponseDto.ok(sessions, metadata);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }


    @Get('mySessions')
    @UseGuards(JwtAuthGuard)
    async getUserSessions(
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
            const [sessions, metadata] = await this.sessionService.getUserSessions(filter, pageIndex, pageSize, userId);
            return ResponseDto.ok(sessions, metadata);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Get('myParticipatedSessions')
    @UseGuards(JwtAuthGuard)
    async getUserParticipatedSessions(
        @Request() req: any
    ) {
        try{

            const userId = req.user.userId;
            const sessions = await this.sessionService.getparticipatedSessions(userId);
            return ResponseDto.ok(sessions);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Get('sessionParticipants/:sessionId')
    @UseGuards(JwtAuthGuard)
    async getSessionParticipants(
        @Param('sessionId') sessionId:string,
        @Request() req: any
    ) {
        try{

            const userId = req.user.userId;
            const participants = await this.sessionService.getSessionParticipants(sessionId, userId);
            return ResponseDto.ok(participants);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    async getSession(
        @Param('id') id:string,
        @Request() req: any
    ) {
        try{
            const userId = req.user.userId;
            const session= await this.sessionService.getSession(id, userId);
            return ResponseDto.ok(session);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Post('link/:id')
    @UseGuards(JwtAuthGuard)
    async getShareLink(
        @Param('id') id:string,
        @Request() req: any
    ) {
        try{
            const userId = req.user.userId;
            const session= await this.sessionService.getShareLink(id, userId);
            return ResponseDto.ok(session);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    // no auth required to get session with link
    @Get('share/:code')
    async getSessionWithLink(
        @Param('code') code:string,
    ) {
        try{
            const session= await this.sessionService.getSessionWithLink(code);
            return ResponseDto.ok(session);
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }


    @Post()
    @UseGuards(JwtAuthGuard)
    async createSession(@Body() body:CreateSessionDto, @Request() req: any) {
        try {
            const user = req.user;
            const response = await this.sessionService.createSession(body, user);
            return ResponseDto.ok(response);
        } catch (err) {
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Put('addParticipant/:sessionId')
    @UseGuards(JwtAuthGuard)
    async addParticipant(
        @Param('sessionId') sessionId:string, 
        @Body() body: {email:string},
        @Request() req: any) 
        {
            try{
                const userId = req.user.userId;
                const response = await this.sessionService.addParticipantWithEmail(sessionId, userId, body.email);
                return  ResponseDto.ok(response);
            }catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
    }
    @Delete('removeParticipant/:sessionId')
    @UseGuards(JwtAuthGuard)
    async removePartitpant(
        @Param('sessionId') sessionId:string, 
        @Body() body: {email:string},
        @Request() req: any) 
        {
            try{
                const userId = req.user.userId;
                const response = await this.sessionService.removeParticipantWithEmail(sessionId, userId, body.email);
                return  ResponseDto.ok(response);
            }catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
    }
    @Patch('enable_llm/:sessionId')
    @UseGuards(JwtAuthGuard)
    async enableLLMChat(
        @Param('sessionId') sessionId:string, 
        @Request() req: any) 
        {
            try{
                const userId = req.user.userId;
                const response = await this.sessionService.enableLLM(sessionId, userId);
                return  ResponseDto.ok(response);
            }catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
    }

    @Patch('disable_llm/:sessionId')
    @UseGuards(JwtAuthGuard)
    async disableLLMChat(
        @Param('sessionId') sessionId:string, 
        @Request() req: any) 
        {
            try{
                const userId = req.user.userId;
                const response = await this.sessionService.disableLLM(sessionId, userId);
                return  ResponseDto.ok(response);
            }catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
    }

    @Patch('rename/:sessionId')
    @UseGuards(JwtAuthGuard)
    async renameSession(
        @Param('sessionId') sessionId:string, 
        @Body() body: UpdateSessionRenameDto,
        @Request() req: any) 
        {
            try{
                const userId = req.user.userId;
                const response = await this.sessionService.rename(sessionId, userId, body);
                return  ResponseDto.ok(response);
            }catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
    }


    @Delete(':sessionId')
    @UseGuards(JwtAuthGuard)
    async deleteSession(
        @Param('sessionId') sessionId:string,
        @Request() req: any
    ) {
        try{
            const userId = req.user.userId;
            await this.sessionService.deleteSession(sessionId, userId);
            return ResponseDto.ok('session deletd successfully');
        } catch(err){
            return ResponseDto.throwBadRequest(err.message, err)
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
