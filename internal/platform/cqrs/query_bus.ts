import type { DomainEvent } from '../types.js';

/**
 * CQRS read side — projections rebuilt from the event stream.
 */
export class QueryBus {
  private getters = new Map<string, (args: Record<string, string>) => unknown>();

  register(name: string, getter: (args: Record<string, string>) => unknown): void {
    this.getters.set(name, getter);
  }

  ask<T = unknown>(name: string, args: Record<string, string> = {}): T {
    const g = this.getters.get(name);
    if (!g) throw new Error(`no query: ${name}`);
    return g(args) as T;
  }
}

export type Projector = (event: DomainEvent) => void;
