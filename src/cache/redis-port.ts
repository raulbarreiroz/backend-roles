/**
 * Port that looks like a thin Redis subset.
 * Swap MemoryKv ↔ ioredis without touching handlers.
 */
export interface RedisPort {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  decrBy(key: string, by: number): Promise<number>;
  ping(): Promise<'PONG'>;
}

export function stockKey(sku: string): string {
  return `stock:${sku}`;
}
