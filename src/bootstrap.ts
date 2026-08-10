import 'dotenv/config';
import express from 'express';
import http from 'node:http';
import { MemoryKv } from './cache/memory-kv.js';
import { stockKey } from './cache/redis-port.js';
import { createRealRedis } from './cache/redis-client.js';
import { getSharedBroker } from './queue/in-memory-broker.js';
import { createRabbitChannel } from './queue/rabbit-channel.js';
import { bindPaymentConsumer } from './handlers/payment-order.handler.js';
import { OrderNotifier } from './websocket/notifier.js';
import { buildAdminRouter } from './http/admin.routes.js';

async function main() {
  const port = Number(process.env.PORT) || 4100;
  const queue = process.env.PAYMENT_QUEUE || 'payment.orders';
  const wsPath = process.env.WS_PATH || '/ws/orders';

  const useRealRedis = process.env.USE_REAL_REDIS === 'true';
  const useRealAmqp = process.env.USE_REAL_AMQP === 'true';

  const kv = useRealRedis
    ? createRealRedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379')
    : new MemoryKv();

  if (kv instanceof MemoryKv) {
    kv.seed({
      [stockKey('SKU-TEA-01')]: 25,
      [stockKey('SKU-MUG-09')]: 4,
      [stockKey('SKU-OUT')]: 0,
    });
  }

  const channel = useRealAmqp
    ? await createRabbitChannel(process.env.AMQP_URL || 'amqp://localhost')
    : getSharedBroker();

  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const notifier = new OrderNotifier(server, wsPath);

  app.use(
    buildAdminRouter({
      channel,
      queue,
      kv: kv as MemoryKv,
      notifier,
    })
  );

  await bindPaymentConsumer(channel, queue, {
    redis: kv,
    notify: (evt) => notifier.broadcast(evt),
  });

  server.listen(port, () => {
    console.log(`payment-orders-ms on :${port}`);
    console.log(`  WS  ${wsPath}`);
    console.log(`  AMQP mode: ${useRealAmqp ? 'REAL' : 'in-memory'}`);
    console.log(`  Redis mode: ${useRealRedis ? 'REAL' : 'Map'}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
