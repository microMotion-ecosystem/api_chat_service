import {Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotFoundError } from 'rxjs';
import { AskLLmService} from '../api-services/ask-llm/ask-llm.service';
import { CheckUserService } from '../api-services/check-user/check-user.service';
import { ApiService } from '../core/Api/api.service';
import { CreateSessionDto } from "../dtos/create-session.dto";
import { QuerySessionDto } from '../dtos/query-session.dto';
import { UpdateSessionRenameDto } from '../dtos/update-session.dto';
import { SessionDocument } from '../models/session.model';
import { GateWay } from './gateway.events';
import * as crypto from 'crypto';
import { MailerService } from 'src/nodemailer/nodemailer.service';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class SessionService {

    constructor(
        private readonly llmService: AskLLmService,
        private readonly checkUserService: CheckUserService,
        private readonly gateway: GateWay,
        private readonly mailService: MailerService,
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
            const sessions = await query.exec();
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
            const sessions = await query.exec();
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
        // get sessions that user participated.
        async getparticipatedSessions(userId:string){
            const userObj = new Types.ObjectId(userId)
            const sessions = await this.sessionModel.find({isDelete: false, participants: userObj})
            if(sessions.length === 0){
                throw new NotFoundException('you did,t participate to any session')
            }
            return sessions;
        }
        async getSession(id:string, userId: string,){
            const filter = { isDelete:false, _id:id }
            const session = await this.sessionModel.findOne(filter);
            if(!session){
                throw  new NotFoundException('session not found')
            }
            const userIdObj = new Types.ObjectId(userId);
            if (session.participants.includes(userIdObj) || session.createdBy.toString() === userId) {
                return session;
            }
            throw new UnauthorizedException('user not authorized')
        }

        async getShareLink(id, userId){
            const session = await this.sessionModel.findById(id);
            if(!session) {
                throw new NotFoundException('session not found')
            }
            // only creator can share
            if (session.createdBy.toString() !== userId) {
                throw new UnauthorizedException('user notauthorized')
            }
            const code = String(Math.floor(1000 + Math.random() * 8000));
            const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

            session.metadata = { ...session.metadata, shareCode: hashedCode };
            await session.save();
            const shareLink = `http://localhost:5512/api/v1/session/share/${code}`;
            return shareLink;

        }

        async getSessionWithLink(code:string) {
            const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
            const session = await this.sessionModel.findOne({ 'metadata.shareCode': hashedCode });
            if(!session) {
                throw new NotFoundException('session not found')
            }
            return session;
        }
        async getSessionParticipants(id:string, userId: string){
            const filter = { isDelete:false, _id:id }
            const session = await this.sessionModel.findOne(filter);
            if(!session){
                throw new NotFoundException('session not found')
            }
            const participants = [];
            const userIdObj = new Types.ObjectId(userId);
            if (session.participants.includes(userIdObj) || session.createdBy.toString() === userId) {
                for (const  participant of session.participants ) {
                    const user = await this.checkUserService.checkUser(participant.toString());
                    if (user.success){
                         participants.push(user);
                    }
                }
                return participants;
            }
            throw new UnauthorizedException('user not authorized')
    }

    async createSession(data: CreateSessionDto, user: any) {
        try {
            data = { ...data, createdBy: user.userId };
            const session = await this.sessionModel.create(data);
            // (this.gateway.server as any).emit('session-created', {data: session});
            return session;
        } catch(err) {
            throw new InternalServerErrorException('Failed to create session');
        }

    }
    async addParticipantWithEmail(sessionId: string, userId:string, email: string) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.createdBy.toString() !== userId) {
            throw new UnauthorizedException('user not authorized')
        }
        // validate email
        const userResult = await this.checkUserService.checkEmail(email);
        console.log('userResult', userResult);
        if (!userResult.success) {
            throw new NotFoundException('Participant User not found');
        }
        const code = await this.mailService.resetCode()
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        console.log(`user id type= ${userResult.user._id}`)
        const joinedUser = await this.checkUserService.saveUserHashedCode(userResult.user._id, hashedCode)
        console.log('joinedUser', joinedUser);
        if(!joinedUser.success){
            throw new BadRequestException('Failed to save code');
        }
        console.log(`joined user`, joinedUser);
        try {
            await this.mailService.sendJoinCode({
                mail: email,
                name: userResult.user.userName,
                code: code,
                sessionId: sessionId
            });
          } catch (e) {
            throw new BadRequestException('Failed to send code');
          }
        //   (this.gateway.server as any).to(sessionId).emit('participant-added', {data: user]Result});
          return { message: 'code sent successfully' };
        //   return { message: 'code sent successfully' };
        // // // const participantObject = new Types.ObjectId(userResult.user._id);
        // // if (session.participants.includes(participantObject)) {
        // //     throw new Error('this participant was added before')
        // // }
        // // session.participants.push(participantObject);
        // await session.save();
    }

    async acceptJoinSessionInvitation(code: string, sessionId:string) {
        const session = await this.sessionModel.findById(sessionId);
        if(!session){
            throw new NotFoundException('session not found')
        }
        const hashedCode = crypto.createHash('sha256').update(code).digest('hex');
        const userResult = await this.checkUserService.getUserByCode(hashedCode);
        if(!userResult.success ) {
            throw new NotFoundException(`User not found or code is expired`)
        }
        const participantObject = new Types.ObjectId(userResult.user._id)
        session.participants.push(participantObject);
        (this.gateway.server as any).to(sessionId).emit('participant-added', {data: userResult.user});
        return await session.save();
    }

    async removeParticipantWithEmail(sessionId: string, userId:string, email: string) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        if (session.createdBy.toString() !== userId) {
            throw new UnauthorizedException('user not authorized')
        }
        // validate email
        console.log('email', email);
        const userResult = await this.checkUserService.checkEmail(email);
        if (!userResult.success) {
            throw new NotFoundException('Participant User not found');
        }
        const participantObject = new Types.ObjectId(userResult.user._id);
        if (!session.participants.includes(participantObject)) {
            throw new Error('this participant is not a member of this session')
        }
        session.participants = session.participants.filter(p => p.toString() !== userResult.user._id);
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

    async enableLLM(sessionId: string, userId: string) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        const userObject = new Types.ObjectId(userId);
        if (session.createdBy.toString() !== userId && !session.participants.includes(userObject)) {
            throw new UnauthorizedException('user not authorized')
        }
        if (session.enableLLM) {
            throw new Error('llm is alrady enabled in this session')
        }
        session.enableLLM = true;
        await session.save();
        (this.gateway.server as any).to(sessionId).emit('llm-enabled', {data: session});
        return session;
    }
    async disableLLM(sessionId: string, userId: string) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        const userObject = new Types.ObjectId(userId);
        if (session.createdBy.toString() !== userId && !session.participants.includes(userObject)) {
            throw new UnauthorizedException('user not authorized')
        }
        if (!session.enableLLM) {
            throw new Error('llm is alrady not enabled in this session')
        }
        session.enableLLM = false;
        await session.save();
        (this.gateway.server as any).to(sessionId).emit('llm-disabled', {data: session});
        return session;
    }


    async deleteSession(sessionId, userId) {
        const session = await this.sessionModel.findById(sessionId);
        if (!session){
            throw new NotFoundException('Session not found');
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
