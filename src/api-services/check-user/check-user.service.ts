import { Inject } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";


export class CheckUserService{
    constructor(
        @Inject('CHECK_USER_SERVICE') private readonly checkUserQueue: ClientProxy,
    ) { }

    async checkUser(userId: string) {       
        try{
            return await this.checkUserQueue.send('get_user', {id: userId}).toPromise();
        } catch(e){
            throw(e);
        }
    }
}