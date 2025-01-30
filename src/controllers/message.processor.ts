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
        const {sessionId, llmType} = job.data;
        const sessionMessages = await this.messageService.findSessionMessages(sessionId);
        const formatedMessages = await this.messageService.formatSessionMessages(sessionMessages);
        const llmResponse = await this.chatService.sendMessageToLLm(llmType, formatedMessages, sessionId);  
        const llmMessage = await this.messageService.createLLmMessage(
            llmType,
            sessionId,
            llmResponse,
        );
        console.log('formatedMessages', formatedMessages);

        (this.gateway.server as any).to(sessionId).emit('chat-message-created', {data: llmMessage});

        await this.messageService.handleRenameSession(sessionId, llmType, formatedMessages);
    }
}