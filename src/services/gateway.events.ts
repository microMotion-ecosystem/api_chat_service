import { OnModuleInit, UseGuards } from "@nestjs/common";
import { MessageBody, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, OnGatewayInit   } from "@nestjs/websockets";
import { Server } from "socket.io";
import { session } from "passport";
import { Socket } from "socket.io";
import { CheckUserService } from "../api-services/check-user/check-user.service";
import { JwtAuthGuard } from "src/core/jwt-auth-guard/jwt-auth.guard";
import { WsAuthGuard } from "../core/jwt-auth-guard/ws-auth.guard";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

@WebSocketGateway({
    cors: {
      origin: '*', 
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  })
export class GateWay implements OnGatewayDisconnect, OnGatewayDisconnect , OnGatewayInit  {
    constructor(
        private readonly checkUserService: CheckUserService,
    ) {}
    @WebSocketServer()
    server: Server;

    afterInit(server: Server) {
        // Configure Redis adapter
        const pubClient = new Redis({ host: 'localhost', port: 6379 });
        const subClient = pubClient.duplicate();
        server.adapter(createAdapter(pubClient, subClient));

        // Add authentication middleware
        server.use((socket: Socket, next) => {
            const token = socket.handshake.auth.token;
            if (token === process.env.GATEWAY_SECRET) {
                next();
            } else {
                next(new Error('Unauthorized'));
            }
        });
    }
    handleConnection(client: Socket) {
        console.log(`Client connected with id: ${client.id}`)
        client.on('error', (error:Error)=>{
            console.log(`Error: ${error.message}`)
        })
        this.server.emit('connected', {id: client.id})
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected with id: ${client.id}`)
        
    }


    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join-session')
    handleJoinSession(socket: Socket , data: {sessionId: string}){
        socket.join(data.sessionId);
        console.log(`Client with id: ${socket.id} joined session with id: ${data.sessionId}`)
        socket.emit('joined-session', {sessionId: data.sessionId})
    }

    @SubscribeMessage('send-message')
    sendMessage(socket: Socket , data: {sessionId: string}){
        socket.join(data.sessionId);
        console.log(`Client with id: ${socket.id} joined session with id: ${data.sessionId}`)
        this.server.emit('recieve-message', {sessionId: data.sessionId})
    }
    async emitEvent(event ,data){
        this.server.emit(event, data)
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
