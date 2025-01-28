import {Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundError } from 'rxjs';
import { AskLLmService} from 'src/api-services/ask-llm/ask-llm.service';
import { CheckUserService } from 'src/api-services/check-user/check-user.service';
import { ApiService } from 'src/core/Api/api.service';
import { CreateSessionDto } from "src/dtos/create-session.dto";
import { QuerySessionDto } from 'src/dtos/query-session.dto';
import { UpdateSessionRenameDto } from 'src/dtos/update-session.dto';
import { SessionDocument } from 'src/models/session.model';
import { GateWay } from './gateway.events';

@Injectable()
export class SessionService {

    constructor(
        private readonly llmService: AskLLmService,
        private readonly checkUserService: CheckUserService,
        private readonly gateway: GateWay,
        private apiService: ApiService<SessionDocument, QuerySessionDto>, 
        @InjectModel('Session')  private  sessionModel: Model<SessionDocument>
    ) {}

    async sendMessageToLLm(llmType: string, message: string) {
        try{
            const response = await this.llmService.sendToLLM({llmType, message});
            if (response.success == true ) {
                return response.data;
            } else {
                throw new Error('Failed to send message to LLM');
            }
        }
        catch (err) {
            throw new InternalServerErrorException('Failed to send message to LLM');
        }
    }

    async getSessions(
        filters:any,
        pageIndex: number,
        pageSize: number) 
        {
            const filter = { isDelete:false }
            const {query, paginationObj} = await this.apiService.getAllDocs(
                this.sessionModel.find(),
                {...filters, ...filter, page: pageIndex, limit: pageSize},
                {},
                ['title']
            );
            const sessions = await query;
            return [
                sessions,
                {
                totalItems: paginationObj.count,
                totalPages: paginationObj.numOfPages,
                skip: paginationObj.skip,
                pageIndex: paginationObj.currentPage,
                pageSize: paginationObj.limit,
                filter: { ...filters, ...filter },
                },
            ];
    }
    
    async getUserSessions(
        filters:any,
        pageIndex: number,
        pageSize: number, 
        userId:string,
    )
        {
            const filter = { isDelete:false, createdBy:userId }
            const {query, paginationObj} = await this.apiService.getAllDocs(
                this.sessionModel.find(),
                {...filters, ...filter, page: pageIndex, limit: pageSize},
                {},
                ['title']
            );
            // populate messages
            const sessions = await query;
            return [
                sessions,
                {
                totalItems: paginationObj.count,
                totalPages: paginationObj.numOfPages,
                skip: paginationObj.skip,
                pageIndex: paginationObj.currentPage,
                pageSize: paginationObj.limit,
                filter: { ...filters, ...filter },
                },
            ];
        }
        async getSession(id:string, userId: string,){
            const filter = { isDelete:false, _id:id }
            const session = await this.sessionModel.findOne(filter);
            const userIdObj = new Types.ObjectId(userId);
            if (session.participants.includes(userIdObj) || session.createdBy.toString() === userId) {
                return session;
            }
            throw new UnauthorizedException('user not authorized')
    }

    async createSession(data: CreateSessionDto, user: any) {
        try {
            data = { ...data, createdBy: user.userId };
            const session = await this.sessionModel.create(data);
            (this.gateway.server as any).emit('session-created', {data: session});
            return session;
        } catch(err) {
            throw new InternalServerErrorException('Failed to create session');
        }

    }
    async addParticipant(sessionId: string, userId:string, participantId: string) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.createdBy.toString() !== userId) {
            throw new UnauthorizedException('user not authorized')
        }
        const participantObject = new Types.ObjectId(participantId);
        if (session.participants.includes(participantObject)) {
            throw new Error('this participant was added before')
        }
        // validate user
        const userResult = await this.checkUserService.checkUser(participantId);
        console.log('userResult', userResult);
        if (!userResult.success) {
            throw new NotFoundException('Participant User not found');
        }
        session.participants.push(participantObject);
        await session.save();

        (this.gateway.server as any).to(sessionId).emit('participant-added', {data: userResult});
        return session;
    }
    async removeParticipant(sessionId: string, userId:string, participantId: string) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.createdBy.toString() !== userId) {
            throw new UnauthorizedException('user not authorized')
        }
        // validate user later
        const userResult = await this.checkUserService.checkUser(participantId);
        console.log('userResult', userResult);
        if (!userResult.success) {
            throw new NotFoundException('Participant User not found');
        }
        const participantObject = new Types.ObjectId(participantId);
        if (!session.participants.includes(participantObject)) {
            throw new Error('this participant is not a member of the session')
        }
        session.participants = session.participants.filter(p => p.toString() !== participantId);
        await session.save();
        (this.gateway.server as any).to(sessionId).emit('participant-removed', {data: userResult});
        return session;
    }
    async rename(sessionId: string, userId: string, body: UpdateSessionRenameDto) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.createdBy.toString() !== userId) {
            throw new UnauthorizedException('user not authorized')
        }
        session.title = body.title;
        await session.save();
        (this.gateway.server as any).to(sessionId).emit('session-renamed', {data: session});
        return session;
    }


    async deleteSession(sessionId, userId) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session){
            throw new NotFoundError('Session not found');
        }
        if (session.createdBy.toString() !== userId) {
            throw new UnauthorizedException('user not authorized')
        }
        // validate user lates
        session.isDelete = true;
        await session.save();
        (this.gateway.server as any).to(sessionId).emit('session-deleted', {data: session});
        return session;
    }
}
