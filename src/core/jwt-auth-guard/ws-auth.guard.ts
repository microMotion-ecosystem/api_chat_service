import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.query.token?.toString();

    console.log('Extracted token:', token); // Debugging

    if (!token) {
      const client: Socket = context.switchToWs().getClient();
      client.emit('Authentication_error', {message: 'Unauthorized'});
      throw new WsException('Missing token');
    }

    // Mimic the HTTP request structure for Passport compatibility
    const request = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    return request;
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
        console.log('Error:', err); // Debugging
        const client: Socket = context.switchToWs().getClient();
        client.emit('Authentication_error', {message: 'Unauthorized'});
      throw new WsException('Unauthorized');
    }
    return user;
  }
}