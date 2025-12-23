import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;
  private userSockets = new Map<string, Set<string>>();
  private socketUsers = new Map<string, string>();

  @SubscribeMessage('onlineUsers')
  private emitOnlineUsers(): void {
    this.server.emit('onlineUsers', {
      userIds: Array.from(this.userSockets.keys()),
      count: this.userSockets.size,
    });
  }

  @SubscribeMessage('connect')
  handleConnection(client: any, ...args: any[]): void {
    console.log(`Client connected: ${client.id}`);
    this.emitOnlineUsers();
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(client: any): void {
    const userId = this.socketUsers.get(client.id);
    if (!userId) {
      return;
    }

    const sockets = this.userSockets.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }

    this.socketUsers.delete(client.id);
    this.emitOnlineUsers();
  }

  @SubscribeMessage('register')
  handleRegister(client: any, payload: { userId?: string }): void {
    const userId = payload?.userId?.trim();
    if (!userId) {
      client.emit('registerError', { message: 'userId is required' });
      return;
    }

    let sockets = this.userSockets.get(userId);
    if (!sockets) {
      sockets = new Set<string>();
      this.userSockets.set(userId, sockets);
    }
    sockets.add(client.id);
    this.socketUsers.set(client.id, userId);
    this.emitOnlineUsers();
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): void {
    console.log('Received message:', payload, client);
    this.server.emit('message', payload);
  }

  @SubscribeMessage('messageToUser')
  handleMessageToUser(
    client: any,
    payload: { userId?: string; message?: any },
  ): void {
    const userId = payload?.userId?.trim();
    if (!userId) {
      client.emit('messageError', { message: 'userId is required' });
      return;
    }

    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) {
      client.emit('messageError', { message: 'user not connected' });
      return;
    }

    for (const socketId of sockets) {
      this.server.to(socketId).emit('message', payload?.message);
    }
  }
  @SubscribeMessage('getMessages')
  handleGetMessages(client: any, data: any): void {
    console.log('getMessages request from server:', data);
    this.server.emit('messages', data);
  }
  @SubscribeMessage('messagesToAll')
  handleMessagesToAll(client: Socket, data: any) {
    console.log('Received from client:', data);
    console.log('Connected clients:', this.server.sockets.sockets.size);
    this.server.emit('messagesToAll', data);
  }
}
