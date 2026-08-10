/** Minimal AMQP channel surface (amqplib-inspired) */

export interface AmqpMessage {
  content: Buffer;
  fields: { routingKey: string; exchange: string };
  properties: { messageId?: string; contentType?: string };
}

export type ConsumeHandler = (msg: AmqpMessage | null) => void | Promise<void>;

export interface AmqpChannel {
  assertQueue(queue: string, opts?: { durable?: boolean }): Promise<{ queue: string }>;
  sendToQueue(queue: string, content: Buffer, opts?: { messageId?: string }): boolean;
  consume(queue: string, onMessage: ConsumeHandler): Promise<{ consumerTag: string }>;
  ack(_msg: AmqpMessage): void;
  nack(_msg: AmqpMessage, _allUpTo?: boolean, requeue?: boolean): void;
}
