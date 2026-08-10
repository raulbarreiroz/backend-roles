import type { AmqpChannel } from '../queue/amqp-port.js';
import type { RedisPort } from '../cache/redis-port.js';
import { stockKey } from '../cache/redis-port.js';
import { assertOrderShape, type OrderLifecycleEvent } from '../domain/order.js';
import { canFulfill } from '../domain/stock.js';

export interface HandlerDeps {
  redis: RedisPort;
  notify: (event: OrderLifecycleEvent) => void;
}

/**
 * Application handler — consume payment.orders → Redis stock → WS notify
 */
export function createPaymentOrderHandler(deps: HandlerDeps) {
  return async function onPaymentOrder(raw: Buffer): Promise<void> {
    let order;
    try {
      order = assertOrderShape(JSON.parse(raw.toString('utf8')));
    } catch (err) {
      console.warn('[handler] bad payload', err);
      return;
    }

    const emit = (status: OrderLifecycleEvent['status'], detail?: string) => {
      deps.notify({
        orderId: order.orderId,
        status,
        detail,
        at: new Date().toISOString(),
      });
    };

    emit('received');

    const key = stockKey(order.sku);
    const available = Number((await deps.redis.get(key)) ?? '0');

    if (!canFulfill(available, order.qty)) {
      emit('stock_rejected', `need ${order.qty}, have ${available}`);
      return;
    }

    const remaining = await deps.redis.decrBy(key, order.qty);
    emit('stock_ok', `remaining=${remaining}`);

    // pretend payment gateway call
    try {
      if (order.amountCents <= 0) throw new Error('invalid charge');
      await delay(40);
      emit('charged', `cents=${order.amountCents}`);
    } catch (err) {
      // compensate stock
      await deps.redis.decrBy(key, -order.qty);
      emit('failed', err instanceof Error ? err.message : 'charge failed');
    }
  };
}

export async function bindPaymentConsumer(
  channel: AmqpChannel,
  queue: string,
  deps: HandlerDeps
): Promise<void> {
  await channel.assertQueue(queue, { durable: true });
  const handle = createPaymentOrderHandler(deps);

  await channel.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      await handle(msg.content);
      channel.ack(msg);
    } catch (err) {
      console.error('[handler] crash', err);
      channel.nack(msg, false, false);
    }
  });

  console.log(`[queue] consuming ${queue}`);
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
