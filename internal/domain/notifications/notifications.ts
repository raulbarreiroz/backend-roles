import type { DomainEvent } from '../../platform/types.js';

export interface NotificationView {
  id: string;
  channel: string;
  to: string;
  template: string;
  bookingId: string;
}

export const outbox: NotificationView[] = [];

export function notificationProjector(event: DomainEvent) {
  if (event.type !== 'NotificationQueued') return;
  outbox.push({
    id: event.id,
    channel: String(event.payload.channel),
    to: String(event.payload.to),
    template: String(event.payload.template),
    bookingId: String(event.payload.bookingId),
  });
}

/** Notifications are mostly reactive — saga / handlers emit events directly via a command */
import type { Command } from '../../platform/types.js';

export function registerNotificationCommands(
  register: (type: string, h: (cmd: Command) => Promise<DomainEvent[]>) => void
) {
  register('QueueNotification', async (cmd) => [
    {
      id: 'draft',
      type: 'NotificationQueued',
      aggregateId: cmd.aggregateId,
      domain: 'notifications',
      payload: {
        channel: cmd.payload.channel ?? 'email',
        to: cmd.payload.to,
        template: cmd.payload.template,
        bookingId: cmd.payload.bookingId,
      },
      meta: { at: '', version: 0 },
    },
  ]);
}
