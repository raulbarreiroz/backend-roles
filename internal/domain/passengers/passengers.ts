import type { Command, DomainEvent } from '../../platform/types.js';

export interface PassengerView {
  passengerId: string;
  fullName: string;
  email: string;
  documentId: string;
}

export const passengerIndex = new Map<string, PassengerView>();

export function passengerProjector(event: DomainEvent) {
  if (event.type !== 'PassengerRegistered') return;
  const p: PassengerView = {
    passengerId: event.aggregateId,
    fullName: String(event.payload.fullName),
    email: String(event.payload.email),
    documentId: String(event.payload.documentId),
  };
  passengerIndex.set(p.passengerId, p);
}

export function registerPassengerCommands(
  register: (type: string, h: (cmd: Command) => Promise<DomainEvent[]>) => void
) {
  register('RegisterPassenger', async (cmd) => {
    const { fullName, email, documentId } = cmd.payload;
    if (!fullName || !email || !documentId) throw new Error('passenger fields required');
    return [
      {
        id: 'draft',
        type: 'PassengerRegistered',
        aggregateId: cmd.aggregateId,
        domain: 'passengers',
        payload: { fullName, email, documentId, bookingId: cmd.payload.bookingId },
        meta: { at: '', version: 0 },
      },
    ];
  });
}
