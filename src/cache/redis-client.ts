import type { RedisPort } from './redis-port.js';

/**
 * Placeholder for a real Redis client (ioredis / node-redis).
 * Wired only when USE_REAL_REDIS=true — throws until you drop in the client.
 */
export function createRealRedis(_url: string): RedisPort {
  throw new Error(
    'USE_REAL_REDIS=true but redis client not configured — install ioredis and implement createRealRedis'
  );
}
