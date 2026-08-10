import WebSocket, { WebSocketServer } from 'ws';
import type { Server } from 'node:http';
import type { OrderLifecycleEvent } from '../domain/order.js';

export class OrderNotifier {
  private wss: WebSocketServer;

  constructor(server: Server, path: string) {
    this.wss = new WebSocketServer({ server, path });
    this.wss.on('connection', (socket) => {
      socket.send(JSON.stringify({ type: 'hello', at: new Date().toISOString() }));
      socket.on('error', (err) => console.error('[ws]', err.message));
    });
  }

  broadcast(event: OrderLifecycleEvent): void {
    const payload = JSON.stringify({ type: 'order.lifecycle', ...event });
    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  clientCount(): number {
    return this.wss.clients.size;
  }
}
