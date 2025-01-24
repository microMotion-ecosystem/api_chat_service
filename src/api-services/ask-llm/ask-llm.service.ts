import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";


@Injectable()
export class AskLLmService {
    constructor(
        @Inject('LLM_QUEUE_SERVICE')
        private readonly llmQueue: ClientProxy,
    ) {}

    async sendToLLM(data: any) {
        return await this.llmQueue.send('ask-llm', data).toPromise();
    }
}