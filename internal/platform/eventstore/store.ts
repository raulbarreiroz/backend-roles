import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { DomainEvent } from './types.js';

export interface EventStore {
  append(event: Omit<DomainEvent, 'id' | 'meta'> & { meta?: Partial<DomainEvent['meta']> }): Promise<DomainEvent>;
  load(aggregateId?: string): Promise<DomainEvent[]>;
  loadAll(): Promise<DomainEvent[]>;
}

/** In-memory stream — great for tests / demos */
export class MemoryEventStore implements EventStore {
  private events: DomainEvent[] = [];
  private versions = new Map<string, number>();

  async append(partial: Omit<DomainEvent, 'id' | 'meta'> & { meta?: Partial<DomainEvent['meta']> }): Promise<DomainEvent> {
    const version = (this.versions.get(partial.aggregateId) ?? 0) + 1;
    this.versions.set(partial.aggregateId, version);
    const event: DomainEvent = {
      ...partial,
      id: randomUUID(),
      meta: {
        at: new Date().toISOString(),
        version,
        correlationId: partial.meta?.correlationId,
        causationId: partial.meta?.causationId,
      },
    };
    this.events.push(event);
    return event;
  }

  async load(aggregateId?: string): Promise<DomainEvent[]> {
    if (!aggregateId) return [...this.events];
    return this.events.filter((e) => e.aggregateId === aggregateId);
  }

  async loadAll(): Promise<DomainEvent[]> {
    return [...this.events];
  }
}

/** Append-only JSONL file — survives restarts */
export class FileEventStore implements EventStore {
  private mem = new MemoryEventStore();
  private ready: Promise<void>;

  constructor(private path: string) {
    this.ready = this.hydrate();
  }

  private async hydrate() {
    try {
      await mkdir(dirname(this.path), { recursive: true });
      const raw = await readFile(this.path, 'utf8');
      const lines = raw.split('\n').filter(Boolean);
      for (const line of lines) {
        const ev = JSON.parse(line) as DomainEvent;
        // replay into memory without rewriting file
        (this.mem as unknown as { events: DomainEvent[] }).events.push(ev);
        const versions = (this.mem as unknown as { versions: Map<string, number> }).versions;
        versions.set(ev.aggregateId, Math.max(versions.get(ev.aggregateId) ?? 0, ev.meta.version));
      }
    } catch {
      await writeFile(this.path, '', 'utf8');
    }
  }

  async append(partial: Parameters<EventStore['append']>[0]): Promise<DomainEvent> {
    await this.ready;
    const event = await this.mem.append(partial);
    await appendFile(this.path, JSON.stringify(event) + '\n', 'utf8');
    return event;
  }

  async load(aggregateId?: string) {
    await this.ready;
    return this.mem.load(aggregateId);
  }

  async loadAll() {
    await this.ready;
    return this.mem.loadAll();
  }
}

export function buildEventStore(backend: string, path: string): EventStore {
  return backend === 'file' ? new FileEventStore(path) : new MemoryEventStore();
}
