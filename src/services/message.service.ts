import {Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { AskLLmService} from 'src/api-services/ask-llm/ask-llm.service';
import { ApiService } from 'src/core/Api/api.service';
import { CreateMessageDto } from 'src/dtos/create-message.dto';
import { QueryMessageDto } from 'src/dtos/query-message.dto';
import { UpdateMessageBodyDto } from 'src/dtos/update-message.dto';
import { MessageDocument } from 'src/models/message.model';
import { SessionDocument } from 'src/models/session.model';
import { GateWay } from './gateway.events';
import { ChatService } from './chat.service';
import { BullSevice } from './bull.service';

@Injectable()
export class MessageService {

    constructor(
        @InjectModel('Message')  private  messageModel: Model<MessageDocument>,
        @InjectModel('Session') private sessionModel:Model<SessionDocument>,
        private readonly llmService: AskLLmService,
        private readonly chatService: ChatService,
        private readonly bullService: BullSevice,
        private apiService: ApiService<MessageDocument, QueryMessageDto>,
        private readonly gateway: GateWay,
    ) { }
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

    async getsessionMessages(
        filters:any,
        pageIndex: number,
        pageSize: number, 
        userId:string,
        sessionId: string,
    )
        {
            const userIdObject = new Types.ObjectId(userId)
            const filter = { isDelete:false, sessionId: sessionId };
            const {query, paginationObj} = await this.apiService.getAllDocs(
                this.messageModel.find(),
                {...filters, ...filter, page: pageIndex, limit: pageSize, sort: 'createdAt'},
                {},
            );
            // populate messages
            const messages = await query;
            const session = await this.sessionModel.findById(sessionId);
            if (session.createdBy.toString() === userId || session.participants.includes(userIdObject)) {

                return [
                    messages,
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
            throw new UnauthorizedException('user not authorized')
        }
    
    // use this.bullService
    async createMessage(data: CreateMessageDto, user: any) {
        data = { ...data, senderId: user.userId };
        const session = await this.sessionModel.findById(data.sessionId);
        console.log('session', session);
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        if (session.createdBy.toString() !== user.userId && 
            !session.participants.includes(new Types.ObjectId(user.userId))) {
            throw new UnauthorizedException('User not authorized');
        }
        const message = await this.messageModel.create(data);
        console.log('message', message);

        (this.gateway.server as any).to(data.sessionId).emit('user-message-created', {data: message});
        session.messages.push(message.id);
        await session.save();
        const stream = message?.metadata?.stream === true ? true : false;
        console.log(`stream is ${stream}`)
        await this.bullService.addMessageToQueue({
            sessionId: data.sessionId,
            llmType: message.llmType,
            stream: stream
        });
        return message;
        // const sessionMessages = 
        //     await this.messageModel.find({sessionId: data.sessionId})
        //                             .sort({createdAt:1});
        // // console.log('newSession', newSession);
        // console.log('sessionMessages', sessionMessages);
        // const llmMessages = sessionMessages.map((msg)=>({
        //     role: msg.senderType === 'user' ? 'user' : 'assistant',
        //     content: msg.senderType === 'user' ? msg.body : msg.metadata.chatResponse
        // }))
        // let llmResponse;
        // if (message.llmType === 'gemini-1.5-flash') {
        //     llmResponse = await this.chatService.sendMessageToLLm(message.llmType, llmMessages, data.sessionId);
        // }
        // llmResponse = await this.chatService.sendMessageToLLm(message.llmType, llmMessages);
        // const chatMessage = {
        //     sessionId: data.sessionId,
        //     body: "llm response",
        //     senderType: 'assistant',
        //     llmType: message.llmType,
        //     metadata: llmResponse
        // }
        // const llmMessage = await this.messageModel.create(chatMessage);
        // (this.gateway.server as any).to(data.sessionId).emit('chat-message-created', {data: llmMessage});
        
        // // rename session
        // if (!session.renamed) {
        //     const renameContent = 'give a suitable name for this session , respond just with the new name with nothing else'
        //     llmMessages.push({role:'user', content:renameContent})
        //     let chatTitleResponse
        //     if (message.llmType === 'gemini-1.5-flash') {
        //         chatTitleResponse= await this.chatService.sendMessageToLLm(message.llmType, llmMessages, data.sessionId);
        //     }
        //     chatTitleResponse = await this.chatService.sendMessageToLLm(message.llmType, llmMessages);
        //     (this.gateway.server as any).to(message.sessionId).emit('recommended-session-title', {data: chatTitleResponse.chatResponse});
        //     console.log(chatTitleResponse.chatResponse);
        //     session.renamed = true;
        //     await session.save()
        // }

        // console.log('llmResponse', llmResponse);
        
        // return message;
    }
    async findSessionMessages(sessionId: string) {
        const messages = await this.messageModel.find({sessionId: sessionId});
        if (!messages) {
            return [];
        }
        return messages;
    };
    async formatSessionMessages(sessionMessages:any) {
        const llmMessages = sessionMessages.map((msg)=>({
            role: msg.senderType === 'user' ? 'user' : 'assistant',
            content: msg.senderType === 'user' ? msg.body : msg.metadata.chatResponse
        }))
        return llmMessages;
    }

    async createLLmMessage(llmType: string, sessionId: string, llmResponse: any) {
        const chatMessage = {
            sessionId: sessionId,
            body: "llm response",
            senderType: 'assistant',
            llmType: llmType,
            metadata: llmResponse
        }
        const llmMessage = await this.messageModel.create(chatMessage);
        return llmMessage;
    }

    async handleRenameSession(sessionId:string, llmType:string, llmMessages:any, stream: boolean){
        const session = await this.sessionModel.findById(sessionId);
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        if (!session.renamed) {
            const renameContent = 'give a short suitable title for this session , respond just with the new title with nothing else'
            llmMessages.push({role:'user', content:renameContent})
            let chatTitleResponse
            chatTitleResponse = await this.chatService.sendMessageToLLm(llmType, llmMessages, sessionId, stream);
            (this.gateway.server as any).to(sessionId).emit('recommended-session-title', {data: chatTitleResponse.chatResponse});
            console.log(chatTitleResponse.chatResponse);
            session.renamed = true;
            await session.save();
        }
        return {msg: 'session renamed'}


    }
    async hanldeMessageQueue(data: any){

    }
    async updateMessage(id: string,userId: string, data: UpdateMessageBodyDto) {
        const filter = { _id: id, senderId: userId };
        const message = await this.messageModel.findOneAndUpdate(filter, data, { new: true });
        if (!message) {
            throw new NotFoundException('Message not found');
        }
        (this.gateway.server as any).to(message.sessionId).emit('message-updated', {data: message});
        return message;
    }

    async deleteMessage(id: string,userId: string) {
        const filter = { _id: id, senderId: userId };
        const message = await this.messageModel.findOneAndUpdate(filter, {isDelete: true}, { new: true });
        const session = await this.sessionModel.findById(message.sessionId);
        session.messages = session.messages.filter((msg) => msg != message.id);
        await session.save();
        if (!message) {
            throw new NotFoundException('Message not found');
        }
        (this.gateway.server as any).to(message.sessionId).emit('message-deleted', {data: message});
        return message;
    }
}
