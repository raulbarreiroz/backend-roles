import type { Command, DomainEvent } from '../types.js';
import type { EventStore } from '../eventstore/store.js';
import type { EventBus } from '../bus/eventbus.js';

export type CommandHandler = (cmd: Command) => Promise<DomainEvent[]>;

/**
 * CQRS write side — commands produce events, never mutate read models directly.
 */
export class CommandBus {
  private handlers = new Map<string, CommandHandler>();

  constructor(
    private store: EventStore,
    private bus: EventBus
  ) {}

  register(type: string, handler: CommandHandler): void {
    this.handlers.set(type, handler);
  }

  async dispatch(cmd: Command): Promise<DomainEvent[]> {
    const handler = this.handlers.get(cmd.type);
    if (!handler) throw new Error(`no command handler for ${cmd.type}`);

    const produced = await handler(cmd);
    const persisted: DomainEvent[] = [];

    for (const draft of produced) {
      const saved = await this.store.append({
        type: draft.type,
        aggregateId: draft.aggregateId,
        domain: draft.domain,
        payload: draft.payload,
        meta: {
          correlationId: cmd.meta?.correlationId ?? draft.meta?.correlationId,
          causationId: cmd.meta?.causationId ?? draft.id,
        },
      });
      this.bus.publish(saved);
      persisted.push(saved);
    }
    return persisted;
  }
}
