import { InjectQueue } from "@nestjs/bull";
import { Injectable } from "@nestjs/common";
import { Queue } from "bull";


@Injectable()
export class BullSevice {
    constructor(
        @InjectQueue('messageQueue') private messageQueue: Queue,
    ) { }

    async addMessageToQueue(data: any) {
        const job = await this.messageQueue.add(data);
        return String(job.id);
    }
    async removeMessageFromQueue(jobId: string) {
        const job = await this.messageQueue.getJob(jobId);
        if(job){
            await job.remove();
            return true;
        }
    }
}