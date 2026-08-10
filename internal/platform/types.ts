export type DomainName =
  | 'flights'
  | 'passengers'
  | 'payments'
  | 'notifications'
  | 'baggage';

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  aggregateId: string;
  domain: DomainName;
  payload: T;
  meta: {
    correlationId?: string;
    causationId?: string;
    at: string;
    version: number;
  };
}

export interface Command<T = Record<string, unknown>> {
  type: string;
  aggregateId: string;
  domain: DomainName;
  payload: T;
  meta?: { correlationId?: string; causationId?: string };
}
