import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { getSharedBroker } from '../src/queue/in-memory-broker.js';

/**
 * Note: this script only works against the in-memory broker when run in the
 * SAME process as the server. Prefer POST /demo/orders while `npm run dev` is up.
 * Kept as a sketch of an external publisher shape.
 */
async function run() {
  const queue = process.env.PAYMENT_QUEUE || 'payment.orders';
  const broker = getSharedBroker();
  await broker.assertQueue(queue);

  const order = {
    orderId: randomUUID(),
    sku: process.argv[2] || 'SKU-TEA-01',
    qty: Number(process.argv[3] || 1),
    customerId: 'cli-demo',
    amountCents: 1990,
    createdAt: new Date().toISOString(),
  };

  broker.sendToQueue(queue, Buffer.from(JSON.stringify(order)), {
    messageId: order.orderId,
  });

  console.log('published (in-process only):', order);
  console.log('→ Use POST /demo/orders against the running server for a real demo.');
}

run();
