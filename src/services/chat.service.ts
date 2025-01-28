import {Injectable, InternalServerErrorException} from '@nestjs/common';
import { AskLLmService} from 'src/api-services/ask-llm/ask-llm.service';

@Injectable()
export class ChatService {

    constructor(
        private readonly llmService: AskLLmService
    ) {}

    async sendMessageToLLm(llmType: string, messages: any, sessionId?:string) {
        try{
            const body = {
                messages,
                llmType,
                sessionId
            }
            const response = await this.llmService.sendToLLM(body);
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

    /**
     * Returns a string indicating the status of the application.
     *
     * @return {string} The message indicating the status of the application.
     *
     * @example
     *
     * isWorking();
     * // Returns 'App is Working - V:1.0.0 - Thu Sep 30 2021 13:00:00 GMT+0000 (Coordinated Universal Time).
     * // Please check the API documentation at /api-docs'
     *
     */
    isWorking(): string {
        return (
            '"' + process.env.APP_NAME + '"' +
            ' App is Working (' +
            process.env.APP_ENV +
            ') ' +
            process.env.APP_VERSION +
            '\n' +
            new Date().toDateString() +
            ' ' +
            new Date().toTimeString() +
            '.\nPlease check the API documentation at "/api-docs" OR "/api-docs-json"'
        );
    }
}
