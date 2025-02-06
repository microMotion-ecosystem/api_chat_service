import { OnModuleInit, UseGuards } from "@nestjs/common";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "http";
import { Socket } from "socket.io";
import { WsAuthGuard } from "src/core/jwt-auth-guard/ws-auth.guard";

@WebSocketGateway({
    cors: {
      origin: '*', 
      methods: ['GET', 'POST'],
      credentials: true,
    },
})
export class GateWay implements OnModuleInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    onModuleInit() {
        console.log("WebSocket Gateway Initialized");
    }
    handleConnection(client: Socket) {
        console.log(`Client connected with id: ${client.id}`)
        client.on('error', (error:Error) => {
            console.log(`Error: ${error.message}`)
        })
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected with id: ${client.id}`)
    }

    @SubscribeMessage('send-message')
    handleMessage(@MessageBody() data: any) {
        this.server.emit('recive-message', data);
    }

    @UseGuards(WsAuthGuard)
    @SubscribeMessage('join-session')
    handleJoinSession(client: Socket, data: { sessionId: string }) {
        client.join(data.sessionId);
        console.log(`Client with id: ${client.id} joined session with id: ${data.sessionId}`);
        client.emit('joined-session', { sessionId: data.sessionId });
    }
    
    @UseGuards(WsAuthGuard)
    @SubscribeMessage('leave-session')
    handleLeaveSession(client: Socket, data: { sessionId: string }) {
        client.leave(data.sessionId);
        console.log(`Client with id ${client.id} left session ${data.sessionId}`);
        client.emit('leaved-session', { sessionId: data.sessionId });
    }
}
