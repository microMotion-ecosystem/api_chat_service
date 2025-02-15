import { OnModuleInit, UseGuards } from "@nestjs/common";
import { MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "http";
import { session } from "passport";
import { Socket } from "socket.io";
import { CheckUserService } from "src/api-services/check-user/check-user.service";
import { JwtAuthGuard } from "src/core/jwt-auth-guard/jwt-auth.guard";
import { WsAuthGuard } from "src/core/jwt-auth-guard/ws-auth.guard";
@WebSocketGateway({
    cors: {
      origin: '*', 
      methods: ['GET', 'POST'],
      credentials: true,
    },
  })
export class GateWay implements OnGatewayDisconnect, OnGatewayDisconnect {
    constructor(
        private readonly checkUserService: CheckUserService,
    ) {}
    @WebSocketServer()
    server: Server;

    handleConnection(client: Socket) {
        console.log(`Client connected with id: ${client.id}`)
        client.on('error', (error:Error)=>{
            console.log(`Error: ${error.message}`)
        })
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected with id: ${client.id}`)
        
    }

    @SubscribeMessage('send-message')
    handleMessage(@MessageBody() data:any) {
        this.server.emit('recive-message', data)
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join-session')
    handleJoinSession(socket: Socket , data: {sessionId: string}){
        socket.join(data.sessionId);
        console.log(`Client with id: ${socket.id} joined session with id: ${data.sessionId}`)
        socket.emit('joined-session', {sessionId: data.sessionId})
    }
    
    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave-session')
    handleLeaveSession(socket:Socket, data:{sessionId: string}){
        socket.leave(data.sessionId)
        console.log(`Client with id ${socket.id} leaved session ${data.sessionId}`)
        socket.emit('leaved-session', {sessionId: data.sessionId})
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('typing')
    async isTyping(socket:Socket, data:{sessionId: string, userId: string}){
        // socket.leave(data.sessionId)
        const user = await this.checkUserService.checkUser(data.userId);
        if (user.success) {
            console.log(`user ${user} is typing`);
            socket.to(data.sessionId).emit('is-typing', {user: user.user})
        } else {
            socket.to(data.sessionId).emit('is-typing', {user: 'user not found'})
        }
        // socket.emit('is-typing', {sessionId: data.sessionId})
    }
    
}
