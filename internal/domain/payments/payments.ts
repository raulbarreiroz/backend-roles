import type { Command, DomainEvent } from '../../platform/types.js';

export interface PaymentView {
  paymentId: string;
  bookingId: string;
  amountCents: number;
  status: 'authorized' | 'failed';
}

export const paymentsByBooking = new Map<string, PaymentView>();

export function paymentProjector(event: DomainEvent) {
  if (event.domain !== 'payments') return;
  if (event.type === 'PaymentAuthorized' || event.type === 'PaymentFailed') {
    const view: PaymentView = {
      paymentId: event.aggregateId,
      bookingId: String(event.payload.bookingId),
      amountCents: Number(event.payload.amountCents),
      status: event.type === 'PaymentAuthorized' ? 'authorized' : 'failed',
    };
    paymentsByBooking.set(view.bookingId, view);
  }
}

export function registerPaymentCommands(
  register: (type: string, h: (cmd: Command) => Promise<DomainEvent[]>) => void
) {
  register('ChargeBooking', async (cmd) => {
    const amountCents = Number(cmd.payload.amountCents);
    const bookingId = String(cmd.payload.bookingId);
    // tiny deterministic "gateway": odd cents fail — keeps demos interesting
    const ok = amountCents % 2 === 0;
    return [
      {
        id: 'draft',
        type: ok ? 'PaymentAuthorized' : 'PaymentFailed',
        aggregateId: cmd.aggregateId,
        domain: 'payments',
        payload: {
          bookingId,
          amountCents,
          reason: ok ? undefined : 'gateway_declined_odd_amount',
        },
        meta: { at: '', version: 0 },
      },
    ];
  });
}
