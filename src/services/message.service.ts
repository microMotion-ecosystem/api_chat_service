import {Injectable,BadRequestException , InternalServerErrorException, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Model } from 'mongoose';
import { AskLLmService} from '../api-services/ask-llm/ask-llm.service';
import { ApiService } from '../core/Api/api.service';
import { CreateMessageDto } from '../dtos/create-message.dto';
import { QueryMessageDto } from '../dtos/query-message.dto';
import { UpdateMessageBodyDto } from '../dtos/update-message.dto';
import { MessageDocument } from '../models/message.model';
import { SessionDocument } from '../models/session.model';
import { GateWay } from './gateway.events';
import { ChatService } from './chat.service';
import { BullSevice } from './bull.service';
import { OpenAI } from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Readable } from 'stream';
import { UploadService } from './upload.service';
import { TextExtractionService } from './textExtraction.service';
import { MODEL, MSG_TYPE } from 'src/types/enum';
import { text } from 'stream/consumers';
import { LLMMessage } from 'src/types/interface';
import e from 'express';
import { UploadFileMessageDto } from 'src/dtos/sendFileToLLm.dto';



@Injectable()
export class MessageService {
    private openAI: OpenAI;
    constructor(
        @InjectModel('Message')  private  messageModel: Model<MessageDocument>,
        @InjectModel('Session') private sessionModel:Model<SessionDocument>,
        private readonly llmService: AskLLmService,
        private readonly chatService: ChatService,
        private readonly bullService: BullSevice,
        private apiService: ApiService<MessageDocument, QueryMessageDto>,
        private readonly gateway: GateWay,
        private readonly uploadService:UploadService,
        private readonly textExtractionService: TextExtractionService,
    ) { 
        this.openAI = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
          })
    }
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
            const messages = await query.exec()
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

    // create another types of messages

    async sendAudioMessage(file,
         body: UploadFileMessageDto,
         user: any,
        ) {
        const session = await this.sessionModel.findById(body.sessionId);
        if(!session) {
            throw new NotFoundException(`session not found`)
        }
        const fileUrl = await this.uploadService.uploadFile(file);
        const audioText = await this.textExtractionService.AudioToText(file);
        const stream = body?.stream === 'true' ? true : false;
        const data = {
            sessionId: body.sessionId,
            senderId: user.userId,
            msgType: MSG_TYPE.AUDIO,
            body: 'this is audio message',
            llmType: body.llmType,
            enableLLM: session.enableLLM,
            metadata: {
                senderName: user.username,
                fileUrl: fileUrl,
                audioText: audioText,
                userText: body?.text || undefined,
                stream: stream
            } };
        if (session.createdBy.toString() !== user.userId && 
            !session.participants.includes(new Types.ObjectId(user.userId))) {
            throw new UnauthorizedException('User not authorized');
        }
        const message = await this.messageModel.create(data);
        console.log('message', message);

        this.gateway.emitEvent('user-message-created', {body: message, sessionId: data.sessionId});

        if(session.enableLLM) {
            await this.bullService.addMessageToQueue({
                sessionId: data.sessionId,
                llmType: message.llmType,
                stream: stream,
                messageId: message.id,
                senderId: user.userId,
                msgType: MSG_TYPE.AUDIO
            });
        }
        return message;
    }
    async sendImageMessage(file: Express.Multer.File, body:UploadFileMessageDto, user:any) {
        const session = await this.sessionModel.findById(body.sessionId);
        if(!session) {
            throw new NotFoundException(`session not found`)
        }
        const fileUrl = await this.uploadService.uploadFile(file);
        const stream = body?.stream === 'true' ? true : false;
        // force user to use stream = false with images
        if (stream) {
            throw new BadRequestException('system does not support stream  on image messages');
        }
        const data = {
            sessionId: body.sessionId,
            senderId: user.userId,
            msgType: MSG_TYPE.IMAGE,
            body: 'this is image message',
            llmType: body.llmType,
            enableLLM: session.enableLLM,
            metadata: {
                senderName: user.username,
                fileUrl: fileUrl,
                userText: body?.text || undefined,
                stream: stream
            } };
        if (session.createdBy.toString() !== user.userId && 
            !session.participants.includes(new Types.ObjectId(user.userId))) {
            throw new UnauthorizedException('User not authorized');
        }
        const message = await this.messageModel.create(data);

        this.gateway.emitEvent('user-message-created', {body: message, sessionId: data.sessionId});
        if(session.enableLLM) {
            await this.bullService.addMessageToQueue({
                sessionId: data.sessionId,
                llmType: message.llmType,
                stream: stream,
                messageId: message.id,
                senderId: user.userId,
                msgType: MSG_TYPE.IMAGE
            });
        }
        return message;

    }
  
    async sendPdfMessage(file: Express.Multer.File, body: UploadFileMessageDto, user:any) {
        const session = await this.sessionModel.findById(body.sessionId);
        console.log(user);
        if(!session) {
            throw new NotFoundException(`session not found`)
        }
        const fileUrl = await this.uploadService.uploadFile(file);
        const pdfText = await this.textExtractionService.extractTextFromPDF(file.buffer);
        const stream = body?.stream === 'true' ? true : false;
        const data = {
            sessionId: body.sessionId,
            senderId: user.userId,
            msgType: MSG_TYPE.PDF,
            body: 'this is pdf message',
            llmType: body.llmType,
            enableLLM: session.enableLLM,
            metadata: {
                senderName: user.username,
                fileUrl: fileUrl,
                pdfText: pdfText,
                userText: body?.text || undefined,
                stream: stream
            } };
        if (session.createdBy.toString() !== user.userId && 
            !session.participants.includes(new Types.ObjectId(user.userId))) {
            throw new UnauthorizedException('User not authorized');
        }
        const message = await this.messageModel.create(data);
        console.log('message', message);

        this.gateway.emitEvent('user-message-created', {body: message, sessionId: data.sessionId});
        if(session.enableLLM) {
            await this.bullService.addMessageToQueue({
                sessionId: data.sessionId,
                llmType: message.llmType,
                stream: stream,
                messageId: message.id,
                senderId: user.userId,
                msgType: MSG_TYPE.PDF
            });
        }
        return message;
    }

    // use this.bullService
    async sendTextMessage(data: CreateMessageDto, user: any) {
        console.log('user from token', user)
        const session = await this.sessionModel.findById(data.sessionId);
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        const stream = data?.metadata?.stream === true ? true : false;
        console.log(`all data`, data)
        console.log(`stream is`, stream)
        data = { ...data, 
            senderId: user.userId,
            enableLLM: session.enableLLM, 
            metadata: {
                senderName: user.username,
                stream: stream
            } };
        console.log('session', session);
        if (session.createdBy.toString() !== user.userId && 
            !session.participants.includes(new Types.ObjectId(user.userId))) {
            throw new UnauthorizedException('User not authorized');
        }
        const message = await this.messageModel.create(data);
        console.log('message', message);

        this.gateway.emitEvent('user-message-created', {body: message, sessionId: data.sessionId});
        
        console.log(`stream is ${stream}`)
        console.log(`session llm enabling status: ${session.enableLLM}`)
        if(session.enableLLM) {
            await this.bullService.addMessageToQueue({
                sessionId: data.sessionId,
                llmType: message.llmType,
                stream: stream,
                messageId: message.id,
                senderId: user.userId,
                msgType: MSG_TYPE.TEXT
            });
        }
        return message;
    }
    async findSessionMessages(sessionId: string, msgType: string, llmType: string, stream: boolean) {
        const filter: any = { 
            sessionId: sessionId, 
            enableLLM: true 
        };
        console.log(`llm & msgType & stream `,llmType, msgType, stream)
        // If the current message is an image, include ALL messages
        if (stream) { // the last message shouldnt be image
            filter.msgType = { $ne: MSG_TYPE.IMAGE };
        } else{
            if (llmType !== MODEL.OPENAI) {
                filter.msgType = { $ne: MSG_TYPE.IMAGE };
            }
        }
        console.log(`filter of sessionMessages ===> ${filter}`)
    
        const messages = await this.messageModel.find(filter);
        console.log(`messages of sessionMessages ===> ${messages}`)
        return messages || [];
    }
      async formatSessionMessages(sessionMessages: any[]): Promise<LLMMessage[]> {
        const llmMessages: LLMMessage[] = [];
        
        for (const msg of sessionMessages) {
          const message: LLMMessage = {
            role: msg.senderType === 'user' ? 'user' : 'assistant',
            content: ''
          };

          if (msg.senderType === 'assistant'){
            message.content = msg.metadata?.chatResponse
          } else {
            switch(msg.msgType) {
                case MSG_TYPE.TEXT:
                message.content = msg.body || '';
                break;
                
                case MSG_TYPE.AUDIO:
                message.content = [
                    `${msg.metadata?.userText || 'Audio message'}, audio transcript:`,
                    msg.metadata?.audioText || '[No audio text extracted]'
                ].join(' ');
                break;
        
                case MSG_TYPE.PDF:
                message.content = [
                    `${msg.metadata?.userText || 'PDF content'}, extracted text:`,
                    msg.metadata?.pdfText?.substring(0, 1000) || '[No PDF text extracted]'
                ].join(' ');
                break;
        
                case MSG_TYPE.IMAGE:
                message.content = [
                    {
                    type: "text",
                    text: msg.metadata?.userText || 'Image description:'
                    },
                    {
                    type: "image_url",
                    image_url: {
                        url: msg.metadata?.fileUrl || ''
                    }
                    }
                ];
                break;
        
                default:
                console.warn(`Unhandled message type: ${msg.msgType}`);
                continue;
            }
        }
      
          llmMessages.push(message);
        }
      
        return llmMessages;
      }
    async createLLmMessage(llmType: string, sessionId: string, llmResponse: any, messageId:string, senderId: string) {
        const chatMessage = {
            sessionId: sessionId,
            body: "llm response",
            senderType: 'assistant',
            senderId: senderId,
            llmType: llmType,
            metadata: llmResponse,
            additionalFields: {messageId: messageId}
        }
        const llmMessage = await this.messageModel.create(chatMessage);
        console.log('llmMessage is just created', llmMessage);
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
            this.gateway.emitEvent('recommended-session-title', {body: chatTitleResponse, sessionId: sessionId});
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
        this.gateway.emitEvent('message-updated', {body: message, sessionId: message.sessionId});
        return message;
    }

    async deleteMessage(id: string, userId: string) {
        const filter = { _id: id }; // this delete user message
        const filter2 = {'additionalFields.messageId':id}; // this delete llm message
        const userMessage = await this.messageModel.findOneAndUpdate(filter, {isDelete: true}, { new: true });
        const llmMessage = await this.messageModel.findOneAndUpdate(filter2, {isDelete: true} , {new: true});
        
        console.log(`userId is ==>${userId}`)
        console.log(`userMessage ==> ${userMessage}\n llmMessage ==> ${llmMessage}`)
        if (!userMessage && !llmMessage) {
            throw new NotFoundException('Message not found');
        }
        if (String(userMessage.senderId) !== userId) {
            throw new UnauthorizedException('User not authorized to delete this message');
        }

        if (String(llmMessage.senderId) !== userId) {
            throw new UnauthorizedException('User not authorized to delete this message');
        }
        this.gateway.emitEvent('message-deleted', {body: userMessage, sessionId: userMessage.sessionId});
        return userMessage;
    }
}
