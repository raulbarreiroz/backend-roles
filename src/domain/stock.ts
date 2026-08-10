export interface StockSnapshot {
  sku: string;
  available: number;
}

/** Pure check — easy to unit test without Redis */
export function canFulfill(available: number, requested: number): boolean {
  return available >= requested && requested > 0;
}
