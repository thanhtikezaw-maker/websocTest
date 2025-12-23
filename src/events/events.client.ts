import { io } from 'socket.io-client';

const url = process.env.WS_URL ?? 'http://localhost:3000';

const socket = io(url, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`ws connected: ${socket.id}`);
  socket.emit('register', { userId: 'user-123' });
  socket.emit('message', { text: 'hello from client' });
  socket.emit('getMessages', { message: 'triggering the event' });
  socket.emit('messageToUser', {
    userId: 'user-123',
    message: { text: 'private hello' },
  });
});

socket.on('message', (data) => {
  console.log('ws message:', data);
});

socket.on('onlineUsers', (data) => {
  console.log('ws onlineUsers:', data);
});

socket.on('connect_error', (error) => {
  console.error('ws connect_error:', error.message);
});

socket.on('disconnect', (reason) => {
  console.log('ws disconnect:', reason);
});
