import { EventEmitter } from 'node:events';
import type { AmqpChannel, AmqpMessage, ConsumeHandler } from './amqp-port.js';

/**
 * In-process broker that mimics amqplib channel methods.
 * Swap for rabbit-channel.ts when RabbitMQ is available.
 */
export class InMemoryBroker implements AmqpChannel {
  private bus = new EventEmitter();
  private queues = new Set<string>();
  private tagSeq = 0;

  async assertQueue(queue: string): Promise<{ queue: string }> {
    this.queues.add(queue);
    return { queue };
  }

  sendToQueue(queue: string, content: Buffer, opts?: { messageId?: string }): boolean {
    if (!this.queues.has(queue)) {
      throw new Error(`queue not asserted: ${queue}`);
    }
    const msg: AmqpMessage = {
      content,
      fields: { routingKey: queue, exchange: '' },
      properties: {
        messageId: opts?.messageId,
        contentType: 'application/json',
      },
    };
    // microtask so publish returns before consume runs (closer to real AMQP)
    queueMicrotask(() => this.bus.emit(queue, msg));
    return true;
  }

  async consume(queue: string, onMessage: ConsumeHandler) {
    if (!this.queues.has(queue)) {
      throw new Error(`queue not asserted: ${queue}`);
    }
    const consumerTag = `ctag-${++this.tagSeq}`;
    this.bus.on(queue, (msg: AmqpMessage) => {
      void Promise.resolve(onMessage(msg));
    });
    return { consumerTag };
  }

  ack(_msg: AmqpMessage): void {
    /* no-op in memory */
  }

  nack(msg: AmqpMessage, _allUpTo = false, requeue = true): void {
    if (requeue) {
      queueMicrotask(() => this.bus.emit(msg.fields.routingKey, msg));
    }
  }
}

/** singleton used by HTTP demo publisher + consumer */
let shared: InMemoryBroker | null = null;

export function getSharedBroker(): InMemoryBroker {
  if (!shared) shared = new InMemoryBroker();
  return shared;
}
