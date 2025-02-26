import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { ChatService } from "src/services/chat.service";
import { GateWay } from "src/services/gateway.events";
import { MessageService } from "src/services/message.service";


@Processor('messageQueue')
export class MessageProcessor {
    constructor(
        private readonly messageService: MessageService,
        private chatService: ChatService,
        private gateway:GateWay,
    ){}

    @Process()
    async handleEvent(job: Job): Promise<void> {
        console.log('Processing job', job.id);
        const {sessionId, llmType, stream, messageId, senderId, msgType} = job.data;
        const LLm = msgType === 'image' ? 'gpt-4o' : llmType;
        const sessionMessages = await this.messageService.findSessionMessages(sessionId, msgType, LLm, stream);
        const formatedMessages = await this.messageService.formatSessionMessages(sessionMessages);
        const llmResponse = await this.chatService.sendMessageToLLm(LLm, formatedMessages, sessionId, stream);
        const llmMessage = await this.messageService.createLLmMessage(
            llmType,
            sessionId,
            llmResponse,
            messageId,
            senderId
        );
        console.log('llmMessaege', llmMessage);
        if (!stream){
            // (this.gateway.server as any).to(sessionId).emit('chat-message-created', {data: llmMessage});
            this.gateway.emitEvent('chat-message-created', {body: llmMessage, sessionId: sessionId});
        }

        await this.messageService.handleRenameSession(sessionId, llmType, formatedMessages, stream);
    }
}
