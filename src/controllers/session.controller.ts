import { Body, Controller, Delete, Get, HttpException, Param, Patch, Post, Put, Query, Request, UseGuards } from '@nestjs/common';
import {ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse} from "@nestjs/swagger";
import {JwtAuthGuard} from "../core/jwt-auth-guard/jwt-auth.guard";
import { ResponseDto } from '../dtos/response.dto';
import { ChatService } from 'src/services/chat.service';
import { QueryModelDto } from 'src/dtos/query-model-dto';
import { CreateSessionDto } from "src/dtos/create-session.dto";
import { SessionService } from 'src/services/session.service';
import { UpdateSessionAddParticipantDto, UpdateSessionRemoveParticipantDto, UpdateSessionRenameDto } from 'src/dtos/update-session.dto';
import { resolveSoa } from 'dns';
import { RoleGuard } from 'src/core/role/role.guard';
import { Role } from 'src/core/role/role.decorator';
import { AskLLMDto } from 'src/dtos/ask-llm.dto';
import { QueryAcceptInvitationDto } from 'src/dtos/query-accept-invitation.dto';

@Controller('session')
export class SessionController {
    constructor(
        private readonly chatService: ChatService,
        private readonly sessionService: SessionService
    ) { }

    @Post('llm/:llm_type')
    @ApiOperation({summary: 'send message to llm'})
    @ApiParam({
        name: 'llm_type',
        description: 'type of llm',
        type: String
    })
    @ApiBody({ type: AskLLMDto})
    @ApiResponse({
        status: 200,
        description: 'successfully get sessions'
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

    @Get()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Role(['manager'])
    @ApiOperation({summary: 'Get all sessions'})
    @ApiQuery({
        name: 'filter',
        description: 'Filter session by various criteria',
        required: false,
        type: Object,
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully get sessions'
    })
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
    @ApiOperation({summary: 'Get all user sessions'})
    @ApiBearerAuth('access-token')
    @ApiQuery({
        name: 'filter',
        description: 'Filter session by various criteria',
        required: false,
        type: Object,
    })
    @ApiResponse({
        status: 200,
        description: 'successfully get user sessions'
    })
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
    @ApiOperation({summary: 'Get all sessions that user participated in'})
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully get sessions that user participated in'
    })
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
    @ApiOperation({summary: 'Get all participants for the session'})
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'successfully get participants of the session'
    })
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
    @ApiOperation({summary: 'Get session by id'})
    @ApiParam({
        name: 'id',
        description: 'id of the session',
        type: String 
    })
    @ApiResponse({
        status: 200,
        description: 'successfully get session'
    })
    @ApiBearerAuth('access-token')
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
    @ApiOperation({summary: 'Get share link for the session'})
    @ApiParam({
        name: 'id',
        description: 'id of the session'
    })
    @ApiResponse({
        status: 200,
        description: 'successfully get share link'
    })
    @ApiBearerAuth('access-token')
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
    @ApiOperation({summary: 'Get all sessions'})
    @ApiParam({
        name: 'code',
        description: 'code to get session by its code',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully get session by code'
    })
    @ApiBearerAuth('access-token')
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
    @ApiOperation({summary: 'Create new session'})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: CreateSessionDto})
    @ApiResponse({
        status: 201,
        description: 'successfully create sessions'
    })
    async createSession(@Body() body:CreateSessionDto, @Request() req: any) {
        try {
            const user = req.user;
            const response = await this.sessionService.createSession(body, user);
            return ResponseDto.ok(response);
        } catch (err) {
            return ResponseDto.throwBadRequest(err.message, err);
        }
    }

    @Patch('addParticipant/:sessionId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Add participant to the session'})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: UpdateSessionAddParticipantDto})
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully add participant to the session'
    })
    async addParticipant(
        @Param('sessionId') sessionId:string, 
        @Body() body: UpdateSessionAddParticipantDto,
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

    @Patch('acceptInvitation/:code')
    @ApiOperation({summary: 'Accept invitation to session'})
    @ApiParam({
        name: 'code',
        description: 'code that sent to email',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully joined user to the session'
    })
    async acceptInvitationCode(
        @Param('code') code:string, 
    ) 
        {
            try{
                const response = await this.sessionService.acceptJoinSessionInvitation(code)
                return  ResponseDto.ok(response);
            }catch(err){
                return ResponseDto.throwBadRequest(err.message, err);
            }
    }
    
    @Patch('removeParticipant/:sessionId')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({summary: 'Remove participant from the session'})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: UpdateSessionRemoveParticipantDto})
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully remove  participant from the session'
    })
    async removePartitpant(
        @Param('sessionId') sessionId:string, 
        @Body() body: UpdateSessionRemoveParticipantDto,
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
    @ApiOperation({summary: 'Enable llm rsponse for the session'})
    @ApiBearerAuth('access-token')
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully enable llm response for the session'
    })
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
    @ApiOperation({summary: 'Disable llm rsponse for the session'})
    @ApiBearerAuth('access-token')
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully disable llm response for the session'
    })
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
    @ApiOperation({summary: 'Update name of the session'})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: UpdateSessionRenameDto})
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully update name of the session'
    })
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
    @ApiOperation({summary: 'Delete session'})
    @ApiBearerAuth('access-token')
    @ApiBody({ type: UpdateSessionRemoveParticipantDto})
    @ApiParam({
        name: 'sessionId',
        description: 'id of the session',
        type: String
    })
    @ApiResponse({
        status: 200,
        description: 'successfully delete session'
    })
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
