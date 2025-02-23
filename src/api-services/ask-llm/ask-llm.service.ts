import { Inject, Injectable } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";


@Injectable()
export class AskLLmService {
    constructor(
        @Inject('LLM_QUEUE_SERVICE')
        private readonly llmQueue: ClientProxy,
    ) {}

    async sendToLLM(data: any) {
        try{
            return await this.llmQueue.send('ask-llm', data).toPromise();
        }catch(e){
            throw(e);
        }
    }
    async callLLM(data: any) {
        try{
            return await this.llmQueue.send('send-prompt', data).toPromise();
        }catch(e){
            throw(e);
        }
    }
}
