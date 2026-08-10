# Setup — Flight Booking ES/CQRS (senior)

Go-inspired layout in TypeScript (`cmd/` + `internal/`). Five bounded contexts share one append-only event store; writes go through commands, reads through projections.

## Run

```bash
cp .env.example .env
npm install
npm run dev          # API on :5200

# another shell — drive a full booking saga
npm run demo
```

`EVENT_STORE_BACKEND=file` persists NDJSON to `EVENT_STORE_PATH` (rebuilt into projections on boot).

## Layout

```
cmd/bookingd/          process entry (like main.go)
internal/
  platform/            event store, command/query bus, in-proc pub/sub
  domain/
    flights/
    passengers/
    payments/
    notifications/
    baggage/
  saga/                BookingSaga orchestrator sketch
  gateway/             thin HTTP adapters (commands in, queries out)
```

## Domains & events (sketch)

| Domain | Commands | Key events |
|--------|----------|------------|
| flights | ReserveSeat | `SeatReserved`, `SeatReleased` |
| passengers | RegisterPassenger | `PassengerRegistered` |
| payments | ChargeBooking | `PaymentAuthorized`, `PaymentFailed` |
| notifications | — (reacts) | `NotificationQueued` |
| baggage | AddBaggage | `BaggageChecked` |

## Saga
`BookingSaga` listens to domain events and issues the next command (reserve → register → charge → baggage → notify). Compensates with `ReleaseSeat` if payment fails.

## Useful routes
- `POST /commands/book` — kick off saga (`flightId`, `seat`, `passenger`, `amountCents`, `bags?`)
- `GET /queries/flights/:id`
- `GET /queries/bookings/:id`
- `GET /queries/events` — raw stream (debug)
