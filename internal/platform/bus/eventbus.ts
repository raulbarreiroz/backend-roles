import { EventEmitter } from 'node:events';
import type { DomainEvent } from '../types.js';

/** Process-local fan-out (stand-in for Kafka / NATS) */
export class EventBus {
  private ee = new EventEmitter();

  publish(event: DomainEvent): void {
    this.ee.emit('domain', event);
    this.ee.emit(event.type, event);
    this.ee.emit(`domain:${event.domain}`, event);
  }

  onAny(handler: (e: DomainEvent) => void | Promise<void>): void {
    this.ee.on('domain', (e) => {
      void Promise.resolve(handler(e));
    });
  }

  onType(type: string, handler: (e: DomainEvent) => void | Promise<void>): void {
    this.ee.on(type, (e) => {
      void Promise.resolve(handler(e));
    });
  }
}
