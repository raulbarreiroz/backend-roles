import type { Command, DomainEvent } from '../../platform/types.js';

export interface FlightReadModel {
  flightId: string;
  route: string;
  seats: Record<string, 'free' | 'held' | 'sold'>;
}

export const flightsCatalog: Record<string, FlightReadModel> = {
  'IB-6401': {
    flightId: 'IB-6401',
    route: 'MAD → BIO',
    seats: { '12A': 'free', '12B': 'free', '14C': 'free' },
  },
  'VY-1008': {
    flightId: 'VY-1008',
    route: 'BCN → PMI',
    seats: { '1A': 'free', '1B': 'free' },
  },
};

export function flightProjectors(flights: Record<string, FlightReadModel>) {
  return (event: DomainEvent) => {
    if (event.domain !== 'flights') return;
    const f = flights[event.aggregateId];
    if (!f) return;
    const seat = String(event.payload.seat ?? '');
    if (event.type === 'SeatReserved' && seat) f.seats[seat] = 'held';
    if (event.type === 'SeatSold' && seat) f.seats[seat] = 'sold';
    if (event.type === 'SeatReleased' && seat) f.seats[seat] = 'free';
  };
}

export function registerFlightCommands(
  register: (type: string, h: (cmd: Command) => Promise<DomainEvent[]>) => void
) {
  register('ReserveSeat', async (cmd) => {
    const flight = flightsCatalog[cmd.aggregateId];
    if (!flight) throw new Error('flight not found');
    const seat = String(cmd.payload.seat);
    if (flight.seats[seat] !== 'free') {
      throw new Error(`seat ${seat} not available`);
    }
    // optimistic: projection updates after append; check current model
    return [
      {
        id: 'draft',
        type: 'SeatReserved',
        aggregateId: cmd.aggregateId,
        domain: 'flights',
        payload: {
          seat,
          bookingId: cmd.payload.bookingId,
          passengerId: cmd.payload.passengerId,
        },
        meta: { at: '', version: 0 },
      },
    ];
  });

  register('ConfirmSeat', async (cmd) => [
    {
      id: 'draft',
      type: 'SeatSold',
      aggregateId: cmd.aggregateId,
      domain: 'flights',
      payload: { seat: cmd.payload.seat, bookingId: cmd.payload.bookingId },
      meta: { at: '', version: 0 },
    },
  ]);

  register('ReleaseSeat', async (cmd) => [
    {
      id: 'draft',
      type: 'SeatReleased',
      aggregateId: cmd.aggregateId,
      domain: 'flights',
      payload: { seat: cmd.payload.seat, bookingId: cmd.payload.bookingId, reason: cmd.payload.reason },
      meta: { at: '', version: 0 },
    },
  ]);
}
