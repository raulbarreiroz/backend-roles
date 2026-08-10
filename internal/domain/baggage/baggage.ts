import type { Command, DomainEvent } from '../../platform/types.js';

export interface BaggageView {
  bagId: string;
  bookingId: string;
  pieces: number;
  weightKg: number;
}

export const bagsByBooking = new Map<string, BaggageView[]>();

export function baggageProjector(event: DomainEvent) {
  if (event.type !== 'BaggageChecked') return;
  const bookingId = String(event.payload.bookingId);
  const list = bagsByBooking.get(bookingId) ?? [];
  list.push({
    bagId: event.aggregateId,
    bookingId,
    pieces: Number(event.payload.pieces),
    weightKg: Number(event.payload.weightKg),
  });
  bagsByBooking.set(bookingId, list);
}

export function registerBaggageCommands(
  register: (type: string, h: (cmd: Command) => Promise<DomainEvent[]>) => void
) {
  register('AddBaggage', async (cmd) => {
    const pieces = Number(cmd.payload.pieces ?? 1);
    const weightKg = Number(cmd.payload.weightKg ?? 20);
    if (pieces < 1) throw new Error('pieces >= 1');
    return [
      {
        id: 'draft',
        type: 'BaggageChecked',
        aggregateId: cmd.aggregateId,
        domain: 'baggage',
        payload: {
          bookingId: cmd.payload.bookingId,
          pieces,
          weightKg,
          passengerId: cmd.payload.passengerId,
        },
        meta: { at: '', version: 0 },
      },
    ];
  });
}
