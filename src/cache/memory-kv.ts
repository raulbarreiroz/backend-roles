import type { RedisPort } from './redis-port.js';

/** Map-backed stand-in for Redis — fine for local demos */
export class MemoryKv implements RedisPort {
  private store = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async decrBy(key: string, by: number): Promise<number> {
    const current = Number((await this.get(key)) ?? '0');
    const next = current - by;
    await this.set(key, String(next));
    return next;
  }

  async ping(): Promise<'PONG'> {
    return 'PONG';
  }

  /** seeding helper (not part of RedisPort) */
  seed(entries: Record<string, number>): void {
    for (const [k, v] of Object.entries(entries)) {
      this.store.set(k, String(v));
    }
  }

  dump(): Record<string, string> {
    return Object.fromEntries(this.store.entries());
  }
}
