import { randomUUID } from 'node:crypto';
import type { CommandBus } from '../platform/cqrs/command_bus.js';
import type { EventBus } from '../platform/bus/eventbus.js';
import type { DomainEvent } from '../platform/types.js';

export type BookingStatus =
  | 'started'
  | 'seat_held'
  | 'passenger_ok'
  | 'paid'
  | 'baggage_ok'
  | 'completed'
  | 'compensating'
  | 'failed';

export interface BookingRecord {
  bookingId: string;
  flightId: string;
  seat: string;
  passengerId: string;
  amountCents: number;
  bags?: { pieces: number; weightKg: number };
  passenger: { fullName: string; email: string; documentId: string };
  status: BookingStatus;
  lastError?: string;
}

/**
 * Orchestration sketch — one process steps the workflow.
 * In prod this would be Temporal / Step Functions; here we react to events.
 */
export class BookingSaga {
  readonly bookings = new Map<string, BookingRecord>();

  constructor(
    private commands: CommandBus,
    bus: EventBus
  ) {
    bus.onAny((e) => this.onEvent(e));
  }

  async start(input: {
    flightId: string;
    seat: string;
    amountCents: number;
    passenger: { fullName: string; email: string; documentId: string };
    bags?: { pieces: number; weightKg: number };
  }): Promise<BookingRecord> {
    const bookingId = randomUUID();
    const passengerId = randomUUID();
    const rec: BookingRecord = {
      bookingId,
      flightId: input.flightId,
      seat: input.seat,
      passengerId,
      amountCents: input.amountCents,
      bags: input.bags,
      passenger: input.passenger,
      status: 'started',
    };
    this.bookings.set(bookingId, rec);

    await this.commands.dispatch({
      type: 'ReserveSeat',
      domain: 'flights',
      aggregateId: input.flightId,
      payload: { seat: input.seat, bookingId, passengerId },
      meta: { correlationId: bookingId },
    });

    return rec;
  }

  private async onEvent(event: DomainEvent) {
    const bookingId = String(
      event.payload.bookingId ?? event.meta.correlationId ?? ''
    );
    const rec = this.bookings.get(bookingId);
    if (!rec) return;

    try {
      if (event.type === 'SeatReserved') {
        rec.status = 'seat_held';
        await this.commands.dispatch({
          type: 'RegisterPassenger',
          domain: 'passengers',
          aggregateId: rec.passengerId,
          payload: { ...rec.passenger, bookingId },
          meta: { correlationId: bookingId, causationId: event.id },
        });
      }

      if (event.type === 'PassengerRegistered') {
        rec.status = 'passenger_ok';
        await this.commands.dispatch({
          type: 'ChargeBooking',
          domain: 'payments',
          aggregateId: randomUUID(),
          payload: { bookingId, amountCents: rec.amountCents },
          meta: { correlationId: bookingId, causationId: event.id },
        });
      }

      if (event.type === 'PaymentAuthorized') {
        rec.status = 'paid';
        await this.commands.dispatch({
          type: 'ConfirmSeat',
          domain: 'flights',
          aggregateId: rec.flightId,
          payload: { seat: rec.seat, bookingId },
          meta: { correlationId: bookingId, causationId: event.id },
        });

        if (rec.bags) {
          await this.commands.dispatch({
            type: 'AddBaggage',
            domain: 'baggage',
            aggregateId: randomUUID(),
            payload: {
              bookingId,
              passengerId: rec.passengerId,
              pieces: rec.bags.pieces,
              weightKg: rec.bags.weightKg,
            },
            meta: { correlationId: bookingId, causationId: event.id },
          });
        } else {
          await this.queueConfirmMail(rec, event.id);
          rec.status = 'completed';
        }
      }

      if (event.type === 'BaggageChecked') {
        rec.status = 'baggage_ok';
        await this.queueConfirmMail(rec, event.id);
        rec.status = 'completed';
      }

      if (event.type === 'PaymentFailed') {
        rec.status = 'compensating';
        rec.lastError = String(event.payload.reason ?? 'payment failed');
        await this.commands.dispatch({
          type: 'ReleaseSeat',
          domain: 'flights',
          aggregateId: rec.flightId,
          payload: { seat: rec.seat, bookingId, reason: 'payment_failed' },
          meta: { correlationId: bookingId, causationId: event.id },
        });
        await this.commands.dispatch({
          type: 'QueueNotification',
          domain: 'notifications',
          aggregateId: randomUUID(),
          payload: {
            to: rec.passenger.email,
            template: 'booking_failed',
            bookingId,
            channel: 'email',
          },
          meta: { correlationId: bookingId, causationId: event.id },
        });
        rec.status = 'failed';
      }
    } catch (err) {
      rec.status = 'failed';
      rec.lastError = err instanceof Error ? err.message : String(err);
      console.error('[saga]', rec.bookingId, rec.lastError);
    }
  }

  private async queueConfirmMail(rec: BookingRecord, causationId: string) {
    await this.commands.dispatch({
      type: 'QueueNotification',
      domain: 'notifications',
      aggregateId: randomUUID(),
      payload: {
        to: rec.passenger.email,
        template: 'booking_confirmed',
        bookingId: rec.bookingId,
        channel: 'email',
      },
      meta: { correlationId: rec.bookingId, causationId },
    });
  }
}
