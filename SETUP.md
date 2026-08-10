# Setup — Payment Orders Microservice (semi-senior)

## What this service does
1. Consumes **payment order** messages from an AMQP-shaped queue
2. Validates product stock via a **Redis-like** client
3. Broadcasts status updates over **WebSocket**

## Quick start (all mocks)

```bash
cp .env.example .env
npm install
npm run dev
# HTTP :4100  |  WS ws://localhost:4100/ws/orders

# another terminal — inject a demo order into the in-process bus
npm run demo:publish
```

Open a WS client (browser console or `websocat`):

```js
const ws = new WebSocket('ws://localhost:4100/ws/orders');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

## Mocks vs real dependencies

| Concern | Default (demo) | Real swap |
|---------|----------------|-----------|
| Broker | `queue/in-memory-broker.ts` — same `assertQueue` / `sendToQueue` / `consume` surface as amqplib | Set `USE_REAL_AMQP=true` and implement `queue/rabbit-channel.ts` against `amqplib` + running RabbitMQ |
| Stock cache | `cache/memory-kv.ts` — `RedisPort` with `get`/`set`/`decr` on a `Map` | Set `USE_REAL_REDIS=true` and wire `ioredis` in `cache/redis-client.ts` |
| Notifications | `ws` attached to the HTTP server | Same code works in prod; put a sticky LB in front |

The folder layout mirrors a Nest-ish modular service without locking you into the Nest CLI:

```
src/
  domain/       entities + invariants
  handlers/     application use-cases (consume → validate → notify)
  queue/        AMQP port + in-memory / rabbit adapters
  cache/        Redis port + memory adapter
  websocket/    fan-out notifier
```

## HTTP helpers
- `GET /health`
- `GET /stock` — peek in-memory catalog
- `POST /demo/orders` — enqueue an order without the CLI script

Body example:

```json
{ "sku": "SKU-TEA-01", "qty": 2, "customerId": "c-42", "amountCents": 1990 }
```
