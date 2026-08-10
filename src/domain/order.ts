/** Domain types for payment orders — keep this free of infra imports */

export type OrderStatus =
  | 'received'
  | 'stock_ok'
  | 'stock_rejected'
  | 'charged'
  | 'failed';

export interface PaymentOrder {
  orderId: string;
  sku: string;
  qty: number;
  customerId: string;
  amountCents: number;
  createdAt: string;
}

export interface OrderLifecycleEvent {
  orderId: string;
  status: OrderStatus;
  detail?: string;
  at: string;
}

export function assertOrderShape(raw: unknown): PaymentOrder {
  const o = raw as Partial<PaymentOrder>;
  if (!o?.orderId || !o.sku || !o.qty || !o.customerId) {
    throw new Error('malformed payment order payload');
  }
  if (o.qty < 1) throw new Error('qty must be >= 1');
  return {
    orderId: String(o.orderId),
    sku: String(o.sku),
    qty: Number(o.qty),
    customerId: String(o.customerId),
    amountCents: Number(o.amountCents ?? 0),
    createdAt: o.createdAt ?? new Date().toISOString(),
  };
}
