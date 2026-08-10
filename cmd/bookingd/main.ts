import 'dotenv/config';
import { buildEventStore } from '../../internal/platform/eventstore/store.js';
import { EventBus } from '../../internal/platform/bus/eventbus.js';
import { CommandBus } from '../../internal/platform/cqrs/command_bus.js';
import { QueryBus } from '../../internal/platform/cqrs/query_bus.js';
import {
  flightsCatalog,
  flightProjectors,
  registerFlightCommands,
} from '../../internal/domain/flights/flights.js';
import {
  passengerIndex,
  passengerProjector,
  registerPassengerCommands,
} from '../../internal/domain/passengers/passengers.js';
import {
  paymentsByBooking,
  paymentProjector,
  registerPaymentCommands,
} from '../../internal/domain/payments/payments.js';
import {
  outbox,
  notificationProjector,
  registerNotificationCommands,
} from '../../internal/domain/notifications/notifications.js';
import {
  bagsByBooking,
  baggageProjector,
  registerBaggageCommands,
} from '../../internal/domain/baggage/baggage.js';
import { BookingSaga } from '../../internal/saga/booking_saga.js';
import { buildGateway } from '../../internal/gateway/http.js';

async function main() {
  const port = Number(process.env.PORT) || 5200;
  const store = buildEventStore(
    process.env.EVENT_STORE_BACKEND || 'memory',
    process.env.EVENT_STORE_PATH || './data/events.jsonl'
  );
  const bus = new EventBus();
  const commands = new CommandBus(store, bus);
  const queries = new QueryBus();

  // wire write handlers (5 domains)
  registerFlightCommands((t, h) => commands.register(t, h));
  registerPassengerCommands((t, h) => commands.register(t, h));
  registerPaymentCommands((t, h) => commands.register(t, h));
  registerNotificationCommands((t, h) => commands.register(t, h));
  registerBaggageCommands((t, h) => commands.register(t, h));

  // projections
  const projectFlight = flightProjectors(flightsCatalog);
  bus.onAny((e) => {
    projectFlight(e);
    passengerProjector(e);
    paymentProjector(e);
    notificationProjector(e);
    baggageProjector(e);
  });

  // rebuild read models from durable store
  for (const e of await store.loadAll()) {
    projectFlight(e);
    passengerProjector(e);
    paymentProjector(e);
    notificationProjector(e);
    baggageProjector(e);
  }

  queries.register('flightById', ({ id }) => {
    const f = flightsCatalog[id];
    if (!f) throw new Error('flight not found');
    return f;
  });
  queries.register('paymentByBooking', ({ bookingId }) => paymentsByBooking.get(bookingId) ?? null);
  queries.register('baggageByBooking', ({ bookingId }) => bagsByBooking.get(bookingId) ?? []);
  queries.register('notificationsByBooking', ({ bookingId }) =>
    outbox.filter((n) => n.bookingId === bookingId)
  );
  queries.register('passengerById', ({ id }) => passengerIndex.get(id) ?? null);

  const saga = new BookingSaga(commands, bus);
  const app = buildGateway({ commands, queries, store, saga });

  app.listen(port, () => {
    console.log(`bookingd listening on :${port}`);
    console.log(`event store: ${process.env.EVENT_STORE_BACKEND || 'memory'}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
