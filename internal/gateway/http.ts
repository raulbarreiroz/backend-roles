import express from 'express';
import type { CommandBus } from '../platform/cqrs/command_bus.js';
import type { QueryBus } from '../platform/cqrs/query_bus.js';
import type { EventStore } from '../platform/eventstore/store.js';
import type { BookingSaga } from '../saga/booking_saga.js';

export function buildGateway(deps: {
  commands: CommandBus;
  queries: QueryBus;
  store: EventStore;
  saga: BookingSaga;
}) {
  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'bookingd' }));

  app.post('/commands/book', async (req, res) => {
    try {
      const body = req.body ?? {};
      const booking = await deps.saga.start({
        flightId: body.flightId ?? 'IB-6401',
        seat: body.seat ?? '12A',
        amountCents: Number(body.amountCents ?? 12000),
        passenger: {
          fullName: body.passenger?.fullName ?? 'Raúl Viajero',
          email: body.passenger?.email ?? 'raul@example.com',
          documentId: body.passenger?.documentId ?? 'X1234567',
        },
        bags: body.bags,
      });

      // give the saga a tick to cascade
      await new Promise((r) => setTimeout(r, 30));
      const latest = deps.saga.bookings.get(booking.bookingId);
      res.status(202).json(latest);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/queries/flights/:id', (req, res) => {
    try {
      res.json(deps.queries.ask('flightById', { id: req.params.id }));
    } catch (err) {
      res.status(404).json({ error: String(err) });
    }
  });

  app.get('/queries/bookings/:id', (req, res) => {
    const b = deps.saga.bookings.get(req.params.id);
    if (!b) return res.status(404).json({ error: 'booking not found' });
    res.json({
      ...b,
      payment: deps.queries.ask('paymentByBooking', { bookingId: b.bookingId }),
      baggage: deps.queries.ask('baggageByBooking', { bookingId: b.bookingId }),
      notifications: deps.queries.ask('notificationsByBooking', { bookingId: b.bookingId }),
    });
  });

  app.get('/queries/events', async (_req, res) => {
    res.json(await deps.store.loadAll());
  });

  return app;
}
