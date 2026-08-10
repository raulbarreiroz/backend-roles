import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import type { AmqpChannel } from '../queue/amqp-port.js';
import type { MemoryKv } from '../cache/memory-kv.js';
import { stockKey } from '../cache/redis-port.js';
import type { OrderNotifier } from '../websocket/notifier.js';

export function buildAdminRouter(opts: {
  channel: AmqpChannel;
  queue: string;
  kv: MemoryKv;
  notifier: OrderNotifier;
}) {
  const r = Router();

  r.get('/health', async (_req, res) => {
    const pong = await opts.kv.ping();
    res.json({
      ok: true,
      redis: pong,
      wsClients: opts.notifier.clientCount(),
      queue: opts.queue,
    });
  });

  r.get('/stock', (_req, res) => {
    res.json(opts.kv.dump());
  });

  r.post('/demo/orders', async (req, res) => {
    const body = req.body ?? {};
    const order = {
      orderId: body.orderId ?? randomUUID(),
      sku: body.sku ?? 'SKU-TEA-01',
      qty: Number(body.qty ?? 1),
      customerId: body.customerId ?? 'anon',
      amountCents: Number(body.amountCents ?? 1500),
      createdAt: new Date().toISOString(),
    };

    await opts.channel.assertQueue(opts.queue);
    opts.channel.sendToQueue(opts.queue, Buffer.from(JSON.stringify(order)), {
      messageId: order.orderId,
    });

    res.status(202).json({ enqueued: true, order });
  });

  // convenience: restock a sku in the memory kv
  r.post('/demo/stock', async (req, res) => {
    const sku = String(req.body?.sku ?? '');
    const available = Number(req.body?.available ?? 0);
    if (!sku) return res.status(400).json({ error: 'sku required' });
    await opts.kv.set(stockKey(sku), String(available));
    res.json({ sku, available });
  });

  return r;
}
