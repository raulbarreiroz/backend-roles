import type { AmqpChannel } from './amqp-port.js';

/**
 * Drop-in when USE_REAL_AMQP=true.
 * Pattern mirrors amqplib:
 *   const conn = await amqp.connect(url)
 *   const ch = await conn.createChannel()
 *   await ch.assertQueue(queue, { durable: true })
 */
export async function createRabbitChannel(_url: string): Promise<AmqpChannel> {
  throw new Error(
    'USE_REAL_AMQP=true — install amqplib and implement createRabbitChannel against a live broker'
  );
}
